import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateSummary } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';

export const Summary: React.FC = () => {
  const { ingestedText, addNotification, language, llm, activeProject, updateActiveProjectData } = useAppContext();
  const [summary, setSummary] = useState<string | null>(activeProject?.summary || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      setSummary(activeProject?.summary || null);
  }, [activeProject]);

  const handleGenerateSummary = useCallback(async () => {
    if (!ingestedText) {
      addNotification('Please ingest some text first.', 'info');
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateSummary(llm, ingestedText, language);
      setSummary(result);
      await updateActiveProjectData({ summary: result });
    } 
    catch (e: any) {
      addNotification(e.message);
    } 
    finally {
      setIsLoading(false);
    }
  }, [ingestedText, addNotification, language, llm, updateActiveProjectData]);

  if (!ingestedText) {
    return <EmptyState 
      title="Generate a Summary"
      message="First, provide some study material in the 'Ingest' tab. Once you've ingested text, you can generate a concise summary here."
    />;
  }

  return (
    <Card title="Auto Summary">
      <div className="space-y-6">
        <div>
          <Button onClick={handleGenerateSummary} disabled={isLoading}>
            {isLoading ? 'Generating...' : (summary ? 'Regenerate Summary' : 'Generate Summary')}
          </Button>
        </div>
        {isLoading && <Loader />}
        {summary && (
          <div className="fade-in">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Summary</h3>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-gray-100 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">{summary}</p>
          </div>
        )}
      </div>
    </Card>
  );
};