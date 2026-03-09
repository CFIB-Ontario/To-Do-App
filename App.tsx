import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import {
  CheckCircle2, Circle, Trash2, Edit2, Cloud, CloudOff, RefreshCw,
  Info, AlignLeft, ChevronDown, ChevronUp, Save, X, PlusCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

type Category = 'Personal' | 'Work' | 'Shopping' | 'Health';

interface Task {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  category: Category;
  createdAt: any;
}

const CATEGORIES: Category[] = ['Personal', 'Work', 'Shopping', 'Health'];

const CATEGORY_COLORS: Record<Category, string> = {
  Personal: 'bg-blue-100 text-blue-700 border-blue-200',
  Work: 'bg-purple-100 text-purple-700 border-purple-200',
  Shopping: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Health: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Personal');
  const [showAddDetails, setShowAddDetails] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Personal');

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('syncing');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('taskflow_offline');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) { }
    }

    try {
      const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Task[];
          setTasks(tasksData);
          localStorage.setItem('taskflow_offline', JSON.stringify(tasksData));
          setSyncStatus('synced');
        },
        (error) => {
          console.error("Firebase sync error:", error);
          setSyncStatus('error');
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase init failed:", e);
      setSyncStatus('error');
    }
  }, []);

  const progress = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const tempId = Date.now().toString();
    const newTaskObj: Task = {
      id: tempId,
      text: newTask.trim(),
      description: newDescription.trim() || undefined,
      completed: false,
      category: newCategory,
      createdAt: new Date(),
    };

    setTasks(prev => [newTaskObj, ...prev]);
    setNewTask('');
    setNewDescription('');
    setShowAddDetails(false);

    try {
      setSyncStatus('syncing');
      await addDoc(collection(db, 'tasks'), {
        ...newTaskObj,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error adding task:", err);
      setSyncStatus('error');
    }
  };

  const toggleComplete = async (task: Task) => {
    const newStatus = !task.completed;
    
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newStatus } : t));
    
    if (newStatus) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f43f5e', '#8b5cf6']
      });
    }

    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: newStatus
      });
    } catch (err) {
      console.error("Error toggling task:", err);
      setSyncStatus('error');
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.error("Error deleting task:", err);
      setSyncStatus('error');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTaskText(task.text);
    setEditDescription(task.description || '');
    setEditCategory(task.category);
  };

  const saveEdit = async (id: string) => {
    if (!editTaskText.trim()) return;

    setTasks(prev => prev.map(t => 
      t.id === id 
        ? { ...t, text: editTaskText.trim(), description: editDescription.trim() || undefined, category: editCategory }
        : t
    ));
    setEditingId(null);

    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, 'tasks', id), {
        text: editTaskText.trim(),
        description: editDescription.trim() || null,
        category: editCategory
      });
    } catch (err) {
      console.error("Error updating task:", err);
      setSyncStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100">
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white pb-6 pt-8 px-6 shadow-md rounded-b-[2rem]">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">TaskFlow</h1>
            <div className="flex items-center gap-3">
              <div title={syncStatus === 'synced' ? "Cloud Sync Active" : syncStatus === 'error' ? "Sync Failed" : "Syncing..."}
                   className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm transition-colors ${syncStatus === 'error' ? 'text-red-300' : 'text-white'}`}>
                {syncStatus === 'synced' ? <Cloud className="w-4 h-4" /> : 
                 syncStatus === 'error' ? <CloudOff className="w-4 h-4" /> : 
                 <RefreshCw className="w-4 h-4 animate-spin" />}
              </div>
              <button onClick={() => setShowInfo(!showInfo)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition">
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Today's Progress</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
              <p className="text-indigo-100 text-sm">{tasks.filter(t => t.completed).length} of {tasks.length} tasks</p>
            </div>
            <div className="h-3 w-full bg-indigo-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-20">
        
        {showInfo && (
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-indigo-50 mb-6 animate-in slide-in-from-top-4 fade-in">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Info className="w-5 h-5 text-indigo-500"/> App Info</h3>
            <p className="text-slate-600 mb-3 text-sm leading-relaxed">
              Your tasks are synced automatically to the cloud. You can install this app on your phone via your browser's "Add to Home Screen" feature.
            </p>
            {syncStatus === 'error' && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
                <strong>Sync Failed:</strong> Please make sure your Firebase Database rules are set to <code className="bg-white px-1 rounded text-red-800">allow read, write: if true;</code>
              </div>
            )}
            <button onClick={() => setShowInfo(false)} className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition">
              Close
            </button>
          </div>
        )}

        <form onSubmit={addTask} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-8 mt-8 relative z-10">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowAddDetails(!showAddDetails)}
              className={`px-4 py-3 rounded-xl font-medium transition ${showAddDetails ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <AlignLeft className="w-5 h-5" />
            </button>
          </div>
          
          {showAddDetails && (
            <textarea
              placeholder="Add details, notes, or sub-tasks... (Optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 mb-3 h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
            />
          )}

          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar flex-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${newCategory === cat ? CATEGORY_COLORS[cat] : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-3 rounded-xl transition-colors shadow-sm flex-shrink-0 flex items-center gap-2 font-medium"
            >
              <PlusCircle className="w-5 h-5" /> <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-slate-300" />
              </div>
              <p>You're all caught up!</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`bg-white p-4 rounded-2xl shadow-sm border transition-all duration-300 group
                  ${task.completed ? 'border-indigo-100 opacity-75' : 'border-slate-100 hover:shadow-md'}`}
              >
                {editingId === task.id ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <input
                      type="text"
                      value={editTaskText}
                      onChange={(e) => setEditTaskText(e.target.value)}
                      className="w-full bg-slate-50 border border-indigo-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium"
                      autoFocus
                    />
                    <textarea
                      placeholder="Details/Notes..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm"
                    />
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div className="flex gap-2">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setEditCategory(cat)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                              ${editCategory === cat ? CATEGORY_COLORS[cat] : 'bg-white text-slate-400 border-slate-200'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                          <X className="w-5 h-5" />
                        </button>
                        <button onClick={() => saveEdit(task.id)} className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition">
                          <Save className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 items-start">
                    <button 
                      onClick={() => toggleComplete(task)}
                      className={`mt-1 flex-shrink-0 transition-all duration-300 ${task.completed ? 'text-indigo-500 scale-110' : 'text-slate-300 hover:text-indigo-400'}`}
                    >
                      {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 cursor-pointer" onClick={() => task.description && toggleExpand(task.id)}>
                          <p className={`font-medium text-[15px] leading-snug transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {task.text}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[task.category]}`}>
                              {task.category}
                            </span>
                            {task.description && (
                              <span className="flex items-center text-xs text-slate-400 hover:text-slate-600 transition">
                                <AlignLeft className="w-3 h-3 mr-1" />
                                {expandedIds.has(task.id) ? 'Hide details' : 'Show details'}
                                {expandedIds.has(task.id) ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(task)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {task.description && expandedIds.has(task.id) && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600 whitespace-pre-wrap animate-in slide-in-from-top-2 fade-in duration-200">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
