import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';
import { StudyPlan } from '../../types';
import { Slider } from '../ui/Slider';

const StudyPlanDisplay: React.FC<{ plan: StudyPlan }> = ({ plan }) => (
    <div className="space-y-6 text-slate-300 bg-slate-900 p-6 rounded-md border border-slate-700">
        <div className="text-center">
            <h3 className="text-2xl font-bold text-red-400">{plan.title}</h3>
            <p className="text-slate-400">{plan.durationDays}-Day Study Plan</p>
        </div>
        <div className="space-y-4">
            {plan.schedule.map((day) => (
                <div key={day.day} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 className="text-lg font-semibold text-slate-200">Day {day.day}: <span className="text-red-400">{day.topic}</span></h4>
                    <ul className="list-disc list-inside pl-4 text-slate-400 mt-2">
                        {day.tasks.map((task, i) => <li key={i}>{task}</li>)}
                    </ul>
                </div>
            ))}
        </div>
    </div>
);

export const StudyPlanner: React.FC = () => {
    const { 
        activeProject, projects, 
        isGeneratingStudyPlan, generateStudyPlanForActiveProject
    } = useAppContext();
    const studyPlan = activeProject?.studyPlan ?? null;
    
    const [days, setDays] = useState(7);

    const handleGenerate = useCallback(() => {
        generateStudyPlanForActiveProject(days);
    }, [days, generateStudyPlanForActiveProject]);

    if (!projects.length) {
        return <EmptyState title="Personalized Study Planner" message="Beat procrastination. Ingest your notes, set your study timeframe, and get a custom day-by-day plan to prepare for your exam." />;
    }
    
    if (!activeProject) {
        return <EmptyState title="Select a Study" message="Please select a study from the sidebar to create a study plan, or start a new one." />;
    }

    return (
        <Card title="Study Plan Generator">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="w-full sm:w-1/2">
                       <Slider label="How many days to study?" min={1} max={30} value={days} onChange={setDays} />
                    </div>
                    <Button onClick={handleGenerate} disabled={isGeneratingStudyPlan} className="w-full sm:w-auto flex-shrink-0">
                        {isGeneratingStudyPlan ? 'Generating...' : 'Generate Study Plan'}
                    </Button>
                </div>
                {isGeneratingStudyPlan && <Loader />}
                {studyPlan && !isGeneratingStudyPlan && (
                    <div className="fade-in mt-4">
                        <StudyPlanDisplay plan={studyPlan} />
                    </div>
                )}
            </div>
        </Card>
    );
};
