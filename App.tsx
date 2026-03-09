import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import theme from './theme';
import './index.css';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: 'Focus' | 'Life' | 'Errands';
  createdAt: any;
}

type FilterType = 'all' | 'active' | 'done';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<'Focus' | 'Life' | 'Errands'>('Focus');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  // Real-time sync with Firebase
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        text: newTask.trim(),
        completed: false,
        category,
        createdAt: serverTimestamp()
      });
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { completed: !task.completed });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const clearCompleted = async () => {
    try {
      const completedTasks = tasks.filter(task => task.completed);
      await Promise.all(
        completedTasks.map(task => deleteDoc(doc(db, 'tasks', task.id)))
      );
    } catch (error) {
      console.error('Error clearing completed:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'done') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  // Date formatting for the header
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 18 ? 'Good Afternoon,' : 'Good Evening,';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{ backgroundColor: theme.pageBg }}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen text-white selection:bg-cyan-500/30 overflow-hidden"
      style={{ backgroundColor: theme.pageBg }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-md mx-auto h-screen flex flex-col relative">
        
        {/* HEADER SECTION */}
        <header className="px-6 pt-12 pb-6 flex-shrink-0">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-white/50 text-xs font-medium mb-1 uppercase tracking-wider">{dateStr}</p>
            <h1 className={`${theme.titleSize} font-bold tracking-tight leading-none mb-1`}>
              {greeting}
            </h1>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.accentStart}, ${theme.accentEnd})` }}>
              {theme.appName}
            </h2>
          </motion.div>

          {/* Progress Ring & Stats */}
          <motion.div 
            className="mt-6 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div>
              <p className="text-3xl font-bold">{totalCount - completedCount}</p>
              <p className="text-white/40 text-xs uppercase tracking-wide">Tasks Remaining</p>
            </div>
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-white/10"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={150.8}
                  strokeDashoffset={150.8 - (150.8 * progress) / 100}
                  className="text-cyan-400 transition-all duration-1000 ease-out"
                  style={{ color: theme.accentStart }}
                />
              </svg>
              <div className="absolute text-[10px] font-bold">{Math.round(progress)}%</div>
            </div>
          </motion.div>
        </header>

        {/* FILTERS */}
        <div className="px-6 mb-2 flex-shrink-0">
          <div className="flex bg-white/5 p-1 rounded-xl">
            {(['all', 'active', 'done'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  filter === f 
                    ? 'bg-white text-black shadow-lg' 
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* TASK LIST SCROLL AREA */}
        <div className="flex-1 px-6 overflow-y-auto no-scrollbar pb-32">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center h-full text-center py-12 opacity-30"
              >
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm">No tasks found</p>
              </motion.div>
            ) : (
              filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05 }}
                  className="mb-3 group"
                >
                  <div 
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                      task.completed 
                        ? 'bg-white/[0.02] border-white/5' 
                        : 'bg-white/[0.05] border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task)}
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                        task.completed 
                          ? 'border-transparent' 
                          : 'border-white/30 hover:border-cyan-400'
                      }`}
                      style={{ 
                        backgroundColor: task.completed ? theme.accentStart : 'transparent',
                        borderColor: task.completed ? 'transparent' : undefined
                      }}
                    >
                      {task.completed && (
                        <motion.svg 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="w-3.5 h-3.5 text-black font-bold" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={4}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate transition-all ${
                        task.completed ? 'text-white/30 line-through' : 'text-white'
                      } ${theme.taskSize}`}>
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          theme.categories[task.category] || 'border-white/10 bg-white/5 text-white/50'
                        }`}>
                          {task.category}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all focus:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM COMPOSER - FIXED */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/95 to-transparent -top-20 pointer-events-none" />
          
          <div className="relative px-6 pb-8 pt-4">
             {/* Completed Actions */}
             {completedCount > 0 && (
              <div className="flex justify-center mb-4">
                <button 
                  onClick={clearCompleted}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full backdrop-blur-md"
                >
                  <span>Trash {completedCount} completed</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}

            <form onSubmit={addTask} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 mb-2 px-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-white/30 tracking-wider">New Task</span>
                <div className="flex-1 h-px bg-white/5" />
                <div className="flex gap-1">
                  {(['Focus', 'Life', 'Errands'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                        category === cat 
                          ? theme.categories[cat]
                          : 'border-transparent bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs doing?"
                  className="w-full bg-transparent border-none px-4 py-3 text-white placeholder-white/30 focus:outline-none text-lg"
                />
                <button
                  type="submit"
                  disabled={!newTask.trim()}
                  className="absolute right-1 top-1 bottom-1 aspect-square rounded-2xl flex items-center justify-center text-black font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-0 disabled:scale-75 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${theme.accentStart}, ${theme.accentEnd})` }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </form>
            
            <div className="mt-4 flex justify-center items-center gap-2 opacity-30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium tracking-wide">SYNCED TO CLOUD</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default App;
