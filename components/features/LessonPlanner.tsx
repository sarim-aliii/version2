import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateLessonPlan } from '../../services/geminiService';
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

export const LessonPlanner: React.FC = () => {
    const { ingestedText, addNotification, language, llm } = useAppContext();
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!ingestedText) {
            addNotification('Please ingest some text first to provide context.', 'info');
            return;
        }
        if (!topic.trim()) {
            addNotification('Please enter a topic for the lesson plan.', 'info');
            return;
        }
        setIsLoading(true);
        setLessonPlan(null);
        try {
            const plan = await generateLessonPlan(llm, ingestedText, topic, language);
            setLessonPlan(plan);
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [ingestedText, topic, addNotification, language, llm]);

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