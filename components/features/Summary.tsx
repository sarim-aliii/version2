import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateSummary } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';

export const Summary: React.FC = () => {
  const { ingestedText, addNotification, language, llm } = useAppContext();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSummary = useCallback(async () => {
    if (!ingestedText) {
      addNotification('Please ingest some text first.', 'info');
      return;
    }
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await generateSummary(llm, ingestedText, language);
      setSummary(result);
    } catch (e: any) {
      addNotification(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [ingestedText, addNotification, language, llm]);

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
            {isLoading ? 'Generating...' : 'Generate Summary'}
          </Button>
        </div>
        {isLoading && <Loader />}
        {summary && (
          <div className="fade-in">
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Summary</h3>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-md border border-slate-700">{summary}</p>
          </div>
        )}
      </div>
    </Card>
  );
};