// ============================================================
//  THEME CONFIG — change anything here to restyle your app
//  Then push to GitHub and Vercel redeploys automatically!
// ============================================================

const theme = {
  // --- Background colours ---
  pageBg: "#050816",          // outer page background
  cardBg: "rgba(255,255,255,0.03)", // main app card background

  // --- Text sizes (Tailwind scale: text-xs text-sm text-base text-lg text-xl text-2xl text-3xl text-4xl) ---
  titleSize: "text-4xl",      // "Today" heading
  subtitleSize: "text-sm",    // greeting / remaining count line
  dateSize: "text-xs",        // date below greeting
  taskSize: "text-base",      // task title text
  labelSize: "text-xs",       // category badge & timestamp

  // --- Accent colours (used in progress ring and highlights) ---
  accentStart: "#22d3ee",     // gradient start (cyan by default)
  accentEnd: "#c026d3",       // gradient end (fuchsia by default)

  // --- Category badge colours (Tailwind classes) ---
  categories: {
    Focus:   "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
    Life:    "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100",
    Errands: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  },

  // --- Checkmark button colours ---
  checkDoneBg: "bg-cyan-400",          // filled circle when task is done
  checkDoneBorder: "border-cyan-300/40",
  checkDoneText: "#050816",            // tick colour when done

  // --- Add button ---
  addButtonBg: "bg-white",
  addButtonText: "text-[#050816]",
  addButtonHover: "hover:bg-cyan-100",

  // --- Bottom bar background ---
  bottomBarBg: "bg-[#050816]/95",

  // --- App name shown at the top ---
  appName: "Minute",
};

export default theme;
