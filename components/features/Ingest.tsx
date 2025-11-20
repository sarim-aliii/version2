import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FileUploader } from '../ui/FileUploader';
import { Slider } from '../ui/Slider';
import { Tab } from '../../types';
import { fetchTopicInfo, extractTextFromFile } from '../../services/geminiService';
import { Loader } from '../ui/Loader';

export const Ingest: React.FC = () => {
  const { setIngestedText, setActiveTab, addNotification, language, llm } = useAppContext();
  const [pastedText, setPastedText] = useState('');
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [chunkWords, setChunkWords] = useState(837);
  const [chunkOverlap, setChunkOverlap] = useState(254);
  const [topic, setTopic] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const acceptedMimeTypes = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };
  
  const handleFilesUpload = async (files: File[]) => {
    setFileNames(files.map(f => f.name));
    setPastedText('');
    setIsExtracting(true);

    const fileProcessingPromises = files.map(file => {
      return new Promise<string>(async (resolve, reject) => {
        try {
          let fileText = '';
          if (file.type === 'text/plain') {
            fileText = await new Promise<string>((res, rej) => {
              const reader = new FileReader();
              reader.onload = (e) => res(e.target?.result as string);
              reader.onerror = () => rej(new Error(`Failed to read ${file.name}.`));
              reader.readAsText(file);
            });
          } else if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              const base64Data = await fileToBase64(file);
              fileText = await extractTextFromFile(llm, base64Data, file.type);
          } else {
              addNotification(`Skipping unsupported file type: ${file.name}.`, 'info');
              resolve('');
              return;
          }
          resolve(`\n\n--- START OF FILE: ${file.name} ---\n\n${fileText}\n\n--- END OF FILE: ${file.name} ---\n\n`);
        } catch (e: any) {
          reject(e);
        }
      });
    });

    try {
        const allTextContents = await Promise.all(fileProcessingPromises);
        setPastedText(allTextContents.join('').trim());
    } catch (e: any) {
        addNotification(e.message);
    } finally {
        setIsExtracting(false);
    }
  };

  const handleAutoSeed = async () => {
    if (!topic.trim()) {
      addNotification('Please enter a topic to auto-seed.', 'info');
      return;
    }
    setIsSeeding(true);
    try {
      const notes = await fetchTopicInfo(llm, topic, language);
      setPastedText(notes);
      setFileNames([`notes_on_${topic.replace(/\s+/g, '_')}.txt`]);
    } 
    catch (e: any) {
      addNotification(e.message);
    } 
    finally {
      setIsSeeding(false);
    }
  };

  const handleIngest = () => {
    if (!pastedText.trim()) {
      addNotification('Please upload a file or paste some text to ingest.', 'info');
      return;
    }
    setIngestedText(pastedText);
    setActiveTab(Tab.Summary);
  };

  return (
    <div className="space-y-8">
      <Card title="Ingest study material (PDF / DOCX / TXT)">
        <FileUploader 
            onFileUpload={handleFilesUpload} 
            acceptedMimeTypes={acceptedMimeTypes} 
            multiple={true} 
            unsupportedFormatError="Please upload PDF, DOCX, or TXT files."
            onError={addNotification}
        />
        {isExtracting && (
            <div className="flex items-center gap-2 text-slate-400 mt-2 text-sm p-2 bg-slate-900/50 rounded-md">
                <Loader spinnerClassName="w-5 h-5" />
                <span>Extracting text from {fileNames.length} file(s)... This may take a moment.</span>
            </div>
        )}
        {fileNames.length > 0 && !isExtracting && (
            <div className="text-sm text-slate-400 mt-2">
                <p className="font-semibold">Loaded file(s):</p>
                <ul className="list-disc list-inside pl-2">
                    {fileNames.map(name => <li key={name}>{name}</li>)}
                </ul>
            </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Or enter a topic to auto-seed..."
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                disabled={isSeeding}
            />
            <Button onClick={handleAutoSeed} disabled={!topic.trim() || isSeeding} className="w-full sm:w-auto flex-shrink-0">
                {isSeeding ? 'Generating...' : 'Auto-seed'}
            </Button>
        </div>
      </Card>


      <div className="flex items-center space-x-4">
        <hr className="flex-grow border-slate-700" />
        <span className="text-slate-400 text-sm">Or paste notes here</span>
        <hr className="flex-grow border-slate-700" />
      </div>

      <Card>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste your study notes here..."
          className="w-full h-48 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
        />
      </Card>

      <Card>
        <div className="space-y-6">
          <Slider label="Chunk words" min={200} max={1200} value={chunkWords} onChange={setChunkWords} />
          <Slider label="Chunk overlap" min={0} max={400} value={chunkOverlap} onChange={setChunkOverlap} />
          <div className="pt-2">
            <Button onClick={handleIngest} disabled={!pastedText.trim() || isExtracting}>
                {isExtracting ? 'Processing file(s)...' : 'Ingest & Build Index'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};