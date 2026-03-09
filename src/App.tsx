import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import theme from "./theme";
import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

// Remove unused loadTasks function - we now load from Firebase
// const loadTasks function removed

type Category = "Focus" | "Life" | "Errands";
type Filter = "all" | "active" | "done";

type Task = {
  id: string;
  title: string;
  category: Category;
  completed: boolean;
  createdAt: number;
};

const filterOptions: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
];

const categoryOptions: Category[] = ["Focus", "Life", "Errands"];

function formatRelativeTime(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("Focus");
  const [activeFilter, setActiveFilter] = useState<Filter>("active");

  // Load tasks from Firebase with real-time sync
  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      setTasks(loadedTasks);
    }, (error) => {
      console.error("Error loading tasks:", error);
    });

    return () => unsubscribe();
  }, []);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        return b.createdAt - a.createdAt;
      }),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    if (activeFilter === "active") return sortedTasks.filter((t) => !t.completed);
    if (activeFilter === "done") return sortedTasks.filter((t) => t.completed);
    return sortedTasks;
  }, [activeFilter, sortedTasks]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const remainingCount = tasks.length - completedCount;
  const completionProgress = tasks.length === 0 ? 0 : completedCount / tasks.length;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const greeting = getGreeting();

  async function handleAddTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = draft.trim().replace(/\s+/g, " ");
    if (!title) return;

    try {
      await addDoc(collection(db, "tasks"), {
        title,
        category: selectedCategory,
        completed: false,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Error adding task:", error);
    }
    setDraft("");
  }

  async function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    try {
      await updateDoc(doc(db, "tasks", id), {
        completed: !task.completed,
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }

  async function deleteTask(id: string) {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  async function clearCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    try {
      await Promise.all(
        completedTasks.map(task => deleteDoc(doc(db, "tasks", task.id)))
      );
    } catch (error) {
      console.error("Error clearing completed:", error);
    }
  }

  return (
    <div
      className="min-h-screen px-0 py-0 text-white sm:px-6 sm:py-8"
      style={{ backgroundColor: theme.pageBg }}
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: `${theme.accentStart}18` }}
        />
        <div
          className="absolute bottom-0 right-0 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: `${theme.accentEnd}18` }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col overflow-hidden backdrop-blur-xl sm:min-h-[780px] sm:rounded-[34px] sm:border sm:border-white/10 sm:shadow-[0_30px_80px_rgba(3,7,18,0.75)]"
        style={{ backgroundColor: theme.cardBg }}
      >
        {/* ── Header ── */}
        <div className="px-5 pb-5 pt-4">
          {/* Notch pill */}
          <div className="mb-5 flex justify-center">
            <div className="h-1.5 w-16 rounded-full bg-white/12" />
          </div>

          <div className="flex items-start justify-between gap-4">
            {/* Left: greeting + stats */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/45">
                {theme.appName}
              </p>
              <h1 className={`mt-3 ${theme.titleSize} font-semibold tracking-tight text-white`}>
                Today
              </h1>
              <p className={`mt-2 max-w-[15rem] ${theme.subtitleSize} leading-6 text-white/60`}>
                {greeting}.{" "}
                {remainingCount === 0
                  ? "Everything is done."
                  : `${remainingCount} left to finish.`}
              </p>
              <p className={`mt-3 ${theme.dateSize} text-white/35`}>{formattedDate}</p>
            </div>

            {/* Right: progress ring */}
            <div className="flex flex-col items-center gap-3 pt-1">
              <div className="relative grid h-20 w-20 place-items-center">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.09)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={263.89}
                    initial={{ strokeDashoffset: 263.89 }}
                    animate={{ strokeDashoffset: 263.89 * (1 - completionProgress) }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={theme.accentStart} />
                      <stop offset="100%" stopColor={theme.accentEnd} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <div className="text-2xl font-semibold tracking-tight">
                    {Math.round(completionProgress * 100)}%
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">done</div>
                </div>
              </div>

              <div className="text-center text-[11px] uppercase tracking-[0.24em] text-white/35">
                {completedCount}/{tasks.length || 0} finished
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mt-6 flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            {filterOptions.map((option) => {
              const isActive = option.key === activeFilter;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setActiveFilter(option.key)}
                  className="relative flex-1 rounded-full px-4 py-2 text-sm font-medium text-white/60 transition hover:text-white"
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-filter"
                      className="absolute inset-0 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative ${isActive ? "text-[#050816]" : "text-white/60"}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Task list ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-48">
          <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-white/35">
            <span>Tasks</span>
            <span>{filteredTasks.length} visible</span>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredTasks.length > 0 ? (
              <motion.ul layout className="space-y-3">
                {filteredTasks.map((task) => (
                  <motion.li
                    layout
                    key={task.id}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14, scale: 0.96 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="rounded-[28px] border border-white/8 bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* Checkbox */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleTask(task.id)}
                        aria-label={
                          task.completed
                            ? `Mark ${task.title} as active`
                            : `Mark ${task.title} as done`
                        }
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                          task.completed
                            ? `${theme.checkDoneBorder} ${theme.checkDoneBg}`
                            : "border-white/15 bg-transparent text-transparent hover:border-white/35"
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke={task.completed ? theme.checkDoneText : "currentColor"}
                          strokeWidth="3"
                        >
                          <path
                            d="M5 12.5 9.5 17 19 7.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.button>

                      {/* Task content */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`${theme.taskSize} font-medium leading-6 tracking-tight transition ${
                            task.completed ? "text-white/35 line-through" : "text-white"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div
                          className={`mt-3 flex items-center gap-2 ${theme.labelSize} text-white/45`}
                        >
                          <span
                            className={`rounded-full border px-2.5 py-1 ${
                              theme.categories[task.category]
                            }`}
                          >
                            {task.category}
                          </span>
                          <span>{formatRelativeTime(task.createdAt)}</span>
                        </div>
                      </div>

                      {/* Delete */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Delete ${task.title}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/35 transition hover:bg-white/8 hover:text-white"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                        >
                          <path d="M18 6 6 18" strokeLinecap="round" />
                          <path d="M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </motion.button>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex min-h-[280px] flex-col justify-center rounded-[32px] border border-dashed border-white/10 px-6 text-center"
              >
                <p className="text-2xl font-semibold tracking-tight text-white">Nothing here yet</p>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Add a fresh task below or switch filters to bring completed items back into view.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom composer ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className={`absolute inset-x-0 bottom-0 border-t border-white/10 px-5 pb-5 pt-4 backdrop-blur-xl ${theme.bottomBarBg}`}
        >
          <form onSubmit={handleAddTask} className="space-y-3">
            <div className="flex items-center gap-3 rounded-[30px] border border-white/10 bg-white/[0.05] px-4 py-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a task"
                className="h-12 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/28"
                maxLength={80}
                aria-label="Add a task"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.94 }}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_12px_30px_rgba(255,255,255,0.18)] transition ${theme.addButtonBg} ${theme.addButtonText} ${theme.addButtonHover}`}
                aria-label="Create task"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M12 5v14" strokeLinecap="round" />
                  <path d="M5 12h14" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {categoryOptions.map((cat) => {
                  const isSelected = cat === selectedCategory;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium tracking-wide transition ${
                        isSelected
                          ? `${theme.categories[cat]} border-transparent`
                          : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {completedCount > 0 ? (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="text-xs font-medium uppercase tracking-[0.22em] text-white/45 transition hover:text-white"
                >
                  Clear done
                </button>
              ) : (
                <span className="text-xs uppercase tracking-[0.22em] text-white/28">
                  Synced to cloud
                </span>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
