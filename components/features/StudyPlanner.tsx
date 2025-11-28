import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateStudyPlan } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';
import { StudyPlan } from '../../types';
import { Slider } from '../ui/Slider';

const StudyPlanDisplay: React.FC<{ plan: StudyPlan }> = ({ plan }) => {
    
    const handleDownload = () => {
        let content = `${plan.title}\n`;
        content += `Duration: ${plan.durationDays} Days\n`;
        content += `================================\n\n`;

        plan.schedule.forEach((day) => {
            content += `Day ${day.day}: ${day.topic}\n`;
            content += `------------------------\n`;
            day.tasks.forEach((task) => {
                content += `[ ] ${task}\n`;
            });
            content += `\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_plan.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 text-slate-300 bg-slate-900 p-6 rounded-md border border-slate-700 relative">
            <div className="absolute top-4 right-4">
                 <button 
                    onClick={handleDownload}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                    title="Download Study Plan"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="text-center pt-2">
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
};

export const StudyPlanner: React.FC = () => {
    const { ingestedText, addNotification, language, llm, activeProject, updateActiveProjectData } = useAppContext();
    const [days, setDays] = useState(7);
    const [isLoading, setIsLoading] = useState(false);
    
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(activeProject?.studyPlan || null);

    useEffect(() => {
        setStudyPlan(activeProject?.studyPlan || null);
    }, [activeProject]);

    const handleGenerate = useCallback(async () => {
        if (!ingestedText) {
            addNotification('Please ingest your study material first.', 'info');
            return;
        }
        setIsLoading(true);
        try {
            const plan = await generateStudyPlan(llm, ingestedText, days, language);
            setStudyPlan(plan);
            await updateActiveProjectData({ studyPlan: plan });
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [ingestedText, days, addNotification, language, llm, updateActiveProjectData]);

    if (!ingestedText) {
        return <EmptyState
            title="Personalized Study Planner"
            message="Beat procrastination. Ingest your notes, set your study timeframe, and get a custom day-by-day plan to prepare for your exam."
        />;
    }

    return (
        <Card title="Study Plan Generator">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="w-full sm:w-1/2">
                       <Slider label="How many days to study?" min={1} max={30} value={days} onChange={setDays} />
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto flex-shrink-0">
                        {isLoading ? 'Generating...' : 'Generate Study Plan'}
                    </Button>
                </div>
                {isLoading && <Loader />}
                {studyPlan && (
                    <div className="fade-in mt-4">
                        <StudyPlanDisplay plan={studyPlan} />
                    </div>
                )}
            </div>
        </Card>
    );
};