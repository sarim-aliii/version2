import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';

export const Summary: React.FC = () => {
  const { 
    activeProject, 
    projects, 
    generateSummaryForActiveProject, 
    isGeneratingSummary 
  } = useAppContext();

  if (!projects.length) {
    return <EmptyState 
      title="Generate a Summary"
      message="First, provide some study material in the 'Ingest' tab. Once you've ingested text, you can generate a concise summary here."
    />;
  }
  
  if (!activeProject) {
    return <EmptyState 
      title="Select a Study"
      message="Please select a study from the sidebar to view its summary, or create a new one."
    />;
  }

  const hasSummary = !!activeProject.summary;

  return (
    <Card title="Auto Summary">
      <div className="space-y-6">
        <div>
          <Button onClick={generateSummaryForActiveProject} disabled={isGeneratingSummary}>
            {isGeneratingSummary ? 'Generating...' : hasSummary ? 'Re-generate Summary' : 'Generate Summary'}
          </Button>
        </div>
        {isGeneratingSummary && <Loader />}
        {hasSummary && !isGeneratingSummary && (
          <div className="fade-in">
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Summary</h3>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-md border border-slate-700">{activeProject.summary}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
