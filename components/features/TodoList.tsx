import React, { useState, useMemo } from 'react';
import { Todo, Priority } from '../../types';

const priorityConfig = {
    [Priority.High]: { color: 'bg-red-500', order: 1 },
    [Priority.Medium]: { color: 'bg-yellow-500', order: 2 },
    [Priority.Low]: { color: 'bg-blue-500', order: 3 },
};

export const TodoList: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [inputText, setInputText] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.Medium);
    const [isSorted, setIsSorted] = useState(false);

    const handleAddTask = () => {
        if (inputText.trim() === '') return;
        const newTodo: Todo = {
            id: Date.now(),
            text: inputText,
            completed: false,
            priority: priority,
        };
        setTodos([...todos, newTodo]);
        setInputText('');
        setPriority(Priority.Medium);
    };

    const handleToggleTodo = (id: number) => {
        setTodos(
            todos.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    };
    
    const handleDeleteTodo = (id: number) => {
        setTodos(
            todos.map(todo =>
                todo.id === id ? { ...todo, deleting: true } : todo
            )
        );
        setTimeout(() => {
            setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
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

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                 <h2 className="text-lg font-bold text-slate-100">To-Do List</h2>
                 <button 
                    onClick={() => setIsSorted(!isSorted)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${isSorted ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title={isSorted ? "Sort by creation time" : "Sort by priority"}
                >
                    Sort
                </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
                    placeholder="Add a new task..."
                    className="flex-grow bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-300 focus:ring-1 focus:ring-red-500 focus:outline-none transition"
                />
                <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-300 focus:ring-1 focus:ring-red-500 focus:outline-none transition"
                >
                    <option value={Priority.High}>High</option>
                    <option value={Priority.Medium}>Medium</option>
                    <option value={Priority.Low}>Low</option>
                </select>
                <button
                    onClick={handleAddTask}
                    className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors"
                    aria-label="Add Task"
                >
                    Add
                </button>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {sortedTodos.map(todo => (
                    <li key={todo.id} className={`flex items-center justify-between bg-slate-800/50 p-2 rounded-md group transition-all duration-500 ease-in-out overflow-hidden fade-in ${
                        todo.deleting ? 'opacity-0 -translate-x-4 max-h-0 !p-0 !my-0 !border-0' : 'max-h-20'
                    }`}>
                        <div className="flex items-center overflow-hidden">
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500 cursor-pointer flex-shrink-0"
                            />
                            <span className={`ml-3 text-sm truncate ${todo.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
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
                                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                aria-label={`Delete task: ${todo.text}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor">
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
        </div>
    );
};