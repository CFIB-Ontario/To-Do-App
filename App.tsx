import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Plus, 
  Trash2, 
  Info, 
  X,
  Cloud,
  CloudOff,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import theme from './theme';
import './index.css';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: 'Personal' | 'Work' | 'Shopping' | 'Health';
  createdAt: number; // using timestamp integer for consistent sorting across devices
}

type FilterType = 'All' | 'Active' | 'Completed';
type CategoryType = Task['category'];

const CATEGORIES: CategoryType[] = ['Personal', 'Work', 'Shopping', 'Health'];

const CATEGORY_COLORS = theme.categories;
const CATEGORY_DOTS = theme.dots;

function App() {
  // Load initial from local storage so it NEVER looks empty while loading
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('taskflow-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<CategoryType>('Personal');
  const [filter, setFilter] = useState<FilterType>('All');
  const [showInfo, setShowInfo] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('syncing');
  const [errorMessage, setErrorMessage] = useState('');

  // Save to local storage whenever tasks change (fallback)
  useEffect(() => {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Firebase Real-time Sync
  useEffect(() => {
    try {
      const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        
        setTasks(tasksData);
        setSyncStatus('synced');
        setErrorMessage('');
      }, (error) => {
        console.error('Firebase sync error:', error);
        setSyncStatus('error');
        if (error.code === 'permission-denied') {
          setErrorMessage('Database permissions denied. Please enable Test Mode in Firebase Console.');
        } else {
          setErrorMessage('Could not connect to database. Using offline mode.');
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Firebase init error:', err);
      setSyncStatus('error');
      setErrorMessage('Invalid Firebase config. Check your API keys.');
    }
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981']
    });
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const newTaskData: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      completed: false,
      category,
      createdAt: Date.now()
    };

    // Optimistic UI update
    setTasks(prev => [newTaskData, ...prev]);
    setNewTask('');

    // Sync to Firebase
    try {
      await setDoc(doc(db, 'tasks', newTaskData.id), newTaskData);
    } catch (error: any) {
      console.error('Error adding to Firebase:', error);
      if (syncStatus !== 'error') setSyncStatus('error');
      // Already saved to localStorage, so data isn't lost
    }
  };

  const toggleTask = async (task: Task) => {
    if (!task.completed) {
      triggerConfetti();
    }

    const newCompletedState = !task.completed;

    // Optimistic UI update
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, completed: newCompletedState } : t
    ));

    // Sync to Firebase
    try {
      await setDoc(doc(db, 'tasks', task.id), { ...task, completed: newCompletedState }, { merge: true });
    } catch (error: any) {
      console.error('Error updating Firebase:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic UI update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    // Sync to Firebase
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error: any) {
      console.error('Error deleting from Firebase:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'Active') return !task.completed;
    if (filter === 'Completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className={`min-h-screen ${theme.pageBg} text-white font-sans selection:bg-indigo-500/30`}>
      
      {/* Background ambient light */}
      <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent pointer-events-none" />

      <div className="max-w-md mx-auto min-h-screen flex flex-col relative z-10 pb-40">
        
        {/* Header Section */}
        <header className={`pt-12 pb-6 px-6 sticky top-0 ${theme.headerBg} backdrop-blur-xl z-20 border-b border-white/5`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r ${theme.gradientTextStart} ${theme.gradientTextEnd} bg-clip-text text-transparent`}>
                {theme.appName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{theme.subtitle}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sync Status Icon */}
              <div className="group relative">
                {syncStatus === 'synced' ? (
                  <Cloud className="w-5 h-5 text-green-400/80" />
                ) : syncStatus === 'error' ? (
                  <CloudOff className="w-5 h-5 text-red-400/80" />
                ) : (
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <Cloud className="w-5 h-5 text-blue-400/80" />
                  </motion.div>
                )}
                
                {/* Error tooltip */}
                {syncStatus === 'error' && (
                  <div className="absolute right-0 top-8 w-48 p-2 bg-red-950/90 border border-red-500/20 rounded-lg text-xs text-red-200 hidden group-hover:block backdrop-blur-md">
                    {errorMessage || "Sync failed. App is running in offline mode."}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowInfo(true)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5"
              >
                <Info className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 shadow-xl">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-gray-400 text-sm font-medium">Daily Progress</p>
                <p className="text-2xl font-bold mt-1">{progress}%</p>
              </div>
              <p className="text-gray-500 text-sm">{completedCount} of {totalCount} completed</p>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full bg-gradient-to-r ${theme.progressStart} ${theme.progressEnd} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {(['All', 'Active', 'Completed'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f 
                    ? 'bg-white text-gray-900 shadow-md' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        {/* Task List */}
        <main className="px-6 pt-4 flex-1">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Check className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-300 mb-2">All caught up!</h3>
                <p className="text-gray-500">
                  {filter === 'All' 
                    ? "You have no tasks on your list. Add one below!"
                    : filter === 'Active'
                    ? "No active tasks remaining."
                    : "You haven't completed any tasks yet."}
                </p>
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`group flex items-center gap-4 p-4 rounded-2xl mb-3 border transition-all duration-300 ${
                    task.completed 
                      ? 'bg-white/[0.02] border-white/5' 
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task)}
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                      task.completed 
                        ? `${theme.addButtonBg} border-transparent scale-110 shadow-[0_0_15px_rgba(99,102,241,0.4)]` 
                        : `border-2 border-gray-500 hover:border-white/50`
                    }`}
                  >
                    <Check className={`w-4 h-4 text-white transition-all duration-300 ${task.completed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-[15px] transition-all duration-300 truncate ${
                      task.completed ? 'text-gray-500 line-through' : 'text-gray-200'
                    }`}>
                      {task.text}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOTS[task.category]}`} />
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                        {task.category}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </main>

        {/* Add Task Form - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent z-20 pointer-events-none">
          <form 
            onSubmit={addTask}
            className="max-w-md mx-auto bg-gray-900 border border-white/10 p-2 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-3 backdrop-blur-xl"
          >
            <div className="flex gap-2 overflow-x-auto px-2 pt-2 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    category === cat 
                      ? CATEGORY_COLORS[cat]
                      : 'bg-transparent text-gray-500 border-transparent hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 pl-4 pr-2 pb-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newTask.trim()}
                className={`w-10 h-10 rounded-xl ${theme.addButtonBg} text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-700 transition-colors shadow-lg shadow-indigo-500/20`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">App Info</h2>
                <button 
                  onClick={() => setShowInfo(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Cloud className={`w-5 h-5 ${syncStatus === 'synced' ? 'text-green-400' : syncStatus === 'error' ? 'text-red-400' : 'text-blue-400'}`} />
                    <h3 className="font-semibold text-white">Cloud Sync</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {syncStatus === 'synced' 
                      ? 'Your tasks are actively syncing across devices via Firebase.'
                      : syncStatus === 'error'
                      ? 'Sync offline. Tasks are saving to this device only. Check Firebase Rules.'
                      : 'Connecting to database...'}
                  </p>
                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{errorMessage}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="text-lg">📱</span> Add to Home Screen
                  </h3>
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <strong className="text-white block mb-1">iPhone (Safari)</strong>
                      Tap the Share button <span className="inline-block bg-white/10 px-1.5 rounded text-xs mx-1">↑</span> then select "Add to Home Screen"
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <strong className="text-white block mb-1">Android (Chrome)</strong>
                      Tap the Menu button <span className="inline-block bg-white/10 px-1.5 rounded text-xs mx-1">⋮</span> then select "Add to Home screen"
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

export default App;
