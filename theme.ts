// ============================================================
//  THEME CONFIG — change anything here to restyle your app
//  Then push to GitHub and Vercel redeploys automatically!
// ============================================================

const theme = {
  // --- Text & Layout ---
  appName: "TaskFlow",
  subtitle: "Organize your day",

  // --- Background Colors ---
  pageBg: "bg-gray-950",        // main background color
  headerBg: "bg-gray-950/80",   // header background with blur

  // --- Gradient Header Text ---
  gradientTextStart: "from-indigo-400",
  gradientTextEnd: "to-purple-400",

  // --- Progress Bar Gradient ---
  progressStart: "from-indigo-500",
  progressEnd: "to-purple-500",

  // --- Add Button Color ---
  addButtonBg: "bg-indigo-500",

  // --- Categories Setup ---
  categories: {
    Personal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Work: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Shopping: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    Health: "bg-green-500/20 text-green-400 border-green-500/30"
  },

  // --- Category Dots ---
  dots: {
    Personal: "bg-blue-400",
    Work: "bg-purple-400",
    Shopping: "bg-pink-400",
    Health: "bg-green-400"
  }
};

export default theme;
