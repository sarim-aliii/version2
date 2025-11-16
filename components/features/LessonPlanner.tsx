import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';
import { LessonPlan } from '../../types';

const LessonPlanDisplay: React.FC<{ plan: LessonPlan }> = ({ plan }) => (
    <div className="space-y-6 text-slate-300 bg-slate-900 p-6 rounded-md border border-slate-700">
        <div className="text-center">
            <h3 className="text-2xl font-bold text-red-400">{plan.title}</h3>
            <p className="text-slate-400">Duration: {plan.duration}</p>
        </div>
        <div className="space-y-4">
            <div>
                <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-600 pb-1 mb-2">Learning Objective</h4>
                <p>{plan.objective}</p>
            </div>
            <div>
                <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-600 pb-1 mb-2">Materials</h4>
                <ul className="list-disc list-inside pl-4 text-slate-400">{plan.materials.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div>
                <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-600 pb-1 mb-2">Activities</h4>
                <div className="space-y-3">
                    {plan.activities.map((activity, i) => (
                        <div key={i} className="p-3 bg-slate-800/50 rounded-md">
                            <p className="font-semibold">{activity.name} <span className="text-sm text-slate-400">({activity.duration})</span></p>
                            <p className="text-slate-400 text-sm mt-1">{activity.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-600 pb-1 mb-2">Assessment</h4>
                <p>{plan.assessment}</p>
            </div>
        </div>
    </div>
);

export const LessonPlanner: React.FC = () => {
    const { 
        activeProject, projects, addNotification,
        isGeneratingLessonPlan, generateLessonPlanForActiveProject 
    } = useAppContext();
    const lessonPlan = activeProject?.lessonPlan ?? null;
    
    const [topic, setTopic] = useState('');

    useEffect(() => { setTopic(''); }, [activeProject]);

    const handleGenerate = useCallback(() => {
        if (!topic.trim()) {
            addNotification('Please enter a topic for the lesson plan.', 'info');
            return;
        }
        generateLessonPlanForActiveProject(topic);
    }, [topic, addNotification, generateLessonPlanForActiveProject]);

    if (!projects.length) {
        return <EmptyState title="AI-Powered Lesson Planner" message="For educators: Ingest a textbook chapter or article, then enter a topic to instantly generate a structured 50-minute lesson plan." />;
    }
    
    if (!activeProject) {
        return <EmptyState title="Select a Study" message="Please select a study from the sidebar to create a lesson plan, or start a new one." />;
    }

    return (
        <Card title="Lesson Plan Generator">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter the main topic for the lesson..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                        disabled={isGeneratingLessonPlan}
                    />
                    <Button onClick={handleGenerate} disabled={!topic.trim() || isGeneratingLessonPlan} className="w-full sm:w-auto flex-shrink-0">
                        {isGeneratingLessonPlan ? 'Generating...' : 'Generate Lesson Plan'}
                    </Button>
                </div>
                {isGeneratingLessonPlan && <Loader />}
                {lessonPlan && !isGeneratingLessonPlan && (
                    <div className="fade-in mt-4">
                        <LessonPlanDisplay plan={lessonPlan} />
                    </div>
                )}
            </div>
        </Card>
    );
};
