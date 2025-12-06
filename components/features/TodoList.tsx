import React, { useState, useMemo, useEffect } from 'react';
import { Todo, Priority } from '../../types';
import { useAppContext } from '../../context/AppContext';

const priorityConfig = {
    [Priority.High]: { color: 'bg-red-500', order: 1 },
    [Priority.Medium]: { color: 'bg-yellow-500', order: 2 },
    [Priority.Low]: { color: 'bg-blue-500', order: 3 },
};

export const TodoList: React.FC = () => {
    const { currentUser, updateUserTodos } = useAppContext();
    
    const [todos, setTodos] = useState<Todo[]>([]);
    const [inputText, setInputText] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.Medium);
    const [isSorted, setIsSorted] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.todos) {
            setTodos(currentUser.todos);
        }
    }, [currentUser]);

    const saveTodos = (newTodos: Todo[]) => {
        setTodos(newTodos);
        updateUserTodos(newTodos);
    };

    const handleAddTask = () => {
        if (inputText.trim() === '') return;
        const newTodo: Todo = {
            id: Date.now(),
            text: inputText,
            completed: false,
            priority: priority,
        };
        const newTodos = [...todos, newTodo];
        saveTodos(newTodos);
        setInputText('');
        setPriority(Priority.Medium);
    };

    const handleToggleTodo = (id: number) => {
        const newTodos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos(newTodos);
    };
    
    const handleDeleteTodo = (id: number) => {
        const tempTodos = todos.map(todo =>
            todo.id === id ? { ...todo, deleting: true } : todo
        );
        setTodos(tempTodos);

        setTimeout(() => {
            const finalTodos = todos.filter(todo => todo.id !== id);
            saveTodos(finalTodos);
        }, 500);
    };

    const sortedTodos = useMemo(() => {
        if (!isSorted) {
            return todos;
        }
        return [...todos].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return priorityConfig[a.priority].order - priorityConfig[b.priority].order;
        });
    }, [todos, isSorted]);

    const isDisabled = false;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-1">
                 <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 transition-colors">To-Do List</h2>
                 <button 
                    onClick={() => setIsSorted(!isSorted)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${isSorted ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
                    title={isSorted ? "Sort by creation time" : "Sort by priority"}
                >
                    Sort
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 px-1">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
                    placeholder={isDisabled ? "Select a study to add tasks" : "Add a new task..."}
                    className="flex-grow bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-2 text-sm text-slate-800 dark:text-slate-300 focus:ring-1 focus:ring-red-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-2 text-sm text-slate-800 dark:text-slate-300 focus:ring-1 focus:ring-red-500 focus:outline-none transition-colors disabled:opacity-50"
                >
                    <option value={Priority.High}>High</option>
                    <option value={Priority.Medium}>Medium</option>
                    <option value={Priority.Low}>Low</option>
                </select>
                <button
                    onClick={handleAddTask}
                    className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Add Task"
                >
                    Add
                </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-0">
                {isDisabled ? (
                     <p className="text-sm text-slate-500 text-center py-8 italic">
                        Select or create a study to manage tasks.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {sortedTodos.map(todo => (
                            <li key={todo.id} className={`flex items-center justify-between bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-transparent p-2 rounded-md group transition-all duration-500 ease-in-out overflow-hidden fade-in ${
                                todo.deleting ? 'opacity-0 -translate-x-4 max-h-0 !p-0 !my-0 !border-0' : 'max-h-20'
                            }`}>
                                <div className="flex items-center overflow-hidden">
                                    <input
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={() => handleToggleTodo(todo.id)}
                                        className="w-4 h-4 text-red-600 bg-gray-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-red-500 cursor-pointer flex-shrink-0"
                                    />
                                    <span className={`ml-3 text-sm truncate ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {todo.text}
                                    </span>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                    <span 
                                        className={`w-3 h-3 rounded-full ml-3 ${priorityConfig[todo.priority].color}`}
                                        title={`Priority: ${todo.priority}`}
                                    ></span>
                                    <button
                                        onClick={() => handleDeleteTodo(todo.id)}
                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                        aria-label={`Delete task: ${todo.text}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                        {todos.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No tasks yet.</p>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};