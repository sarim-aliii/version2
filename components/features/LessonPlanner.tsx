import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi'; // 1. Import hook
import { generateLessonPlan } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';
import { LessonPlan } from '../../types';

// --- Display Component (Unchanged) ---
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
                <ul className="list-disc list-inside pl-4 text-slate-400">
                    {plan.materials.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
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

// --- Main Component ---
export const LessonPlanner: React.FC = () => {
    const { ingestedText, addNotification, language, llm, activeProject, updateActiveProjectData } = useAppContext();
    const [topic, setTopic] = useState('');
    
    // Local state for plan (initialized from DB, updated by hook)
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(activeProject?.lessonPlan || null);

    // 2. Setup Hook
    const { 
        execute: createPlan, 
        loading: isLoading 
    } = useApi(generateLessonPlan); // Removed auto-toast here to handle success manually after DB save if desired, or you can add it back.

    useEffect(() => {
        setLessonPlan(activeProject?.lessonPlan || null);
    }, [activeProject]);

    const handleGenerate = useCallback(async () => {
        if (!ingestedText) {
            addNotification('Please ingest some text first to provide context.', 'info');
            return;
        }
        if (!topic.trim()) {
            addNotification('Please enter a topic for the lesson plan.', 'info');
            return;
        }

        // 3. Execute Hook
        const plan = await createPlan(llm, ingestedText, topic, language);

        // If successful
        if (plan) {
            setLessonPlan(plan);
            try {
                await updateActiveProjectData({ lessonPlan: plan });
                addNotification("Lesson plan generated and saved!", "success");
            } catch (e: any) {
                addNotification("Generated plan but failed to save: " + e.message, "error");
            }
        }
    }, [ingestedText, topic, addNotification, language, llm, updateActiveProjectData, createPlan]);

    if (!ingestedText) {
        return <EmptyState
            title="AI-Powered Lesson Planner"
            message="For educators: Ingest a textbook chapter or article, then enter a topic to instantly generate a structured 50-minute lesson plan."
        />;
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
                        disabled={isLoading}
                    />
                    <Button onClick={handleGenerate} disabled={!topic.trim() || isLoading} className="w-full sm:w-auto flex-shrink-0">
                        {isLoading ? 'Generating...' : 'Generate Lesson Plan'}
                    </Button>
                </div>
                {isLoading && <Loader />}
                {lessonPlan && (
                    <div className="fade-in mt-4">
                        <LessonPlanDisplay plan={lessonPlan} />
                    </div>
                )}
            </div>
        </Card>
    );
};