// Reelix Landing Page — Data & Constants
// All data driving the landing page UI

export interface CreatorTool {
  key: string;
  name: string;
  badge: string | null;
  badgeStyle: string;
  shortDesc: string;
  longDesc: string;
  iconPath: string; // SVG path data
}

export interface Reel {
  id: string;
  title: string;
  category: string;
  handle: string;
  initials: string;
  avatarGrad: string;
  views: string;
  likes: number;
  comments: string;
  shares: string;
  audio: string;
  gradient: string;
  orb1: string;
  orb2: string;
  icon: string;
  captions: string[];
}

export const CREATOR_TOOLS: CreatorTool[] = [
  {
    key: "clipper",
    name: "AI Clipper",
    badge: "POPULAR",
    badgeStyle: "bg-ink text-white",
    shortDesc: "Detect key moments and cut long videos into short clips",
    longDesc:
      "Drop in podcasts, YouTube videos, or livestreams. Reelix identifies high-retention hooks and punchlines—suggesting ready-to-review vertical clips.",
    iconPath: "clipper",
  },
  {
    key: "captions",
    name: "Auto-Captions",
    badge: null,
    badgeStyle: "",
    shortDesc: "Word-by-word animated subtitles with high accuracy",
    longDesc:
      "Generate frame-accurate, animated subtitles in multiple languages. Switch between minimalist, bold, or karaoke-style captions.",
    iconPath: "captions",
  },
  {
    key: "hooks",
    name: "Hook Analysis",
    badge: "NEW",
    badgeStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    shortDesc: "Analyze opening 3-second hooks and suggest improvements",
    longDesc:
      "Review your first 3 seconds before publishing. Reelix analyzes scroll-stop potential and suggests punchier opening titles and visual hooks.",
    iconPath: "hooks",
  },
  {
    key: "beatsync",
    name: "Beat Sync",
    badge: null,
    badgeStyle: "",
    shortDesc: "Align cuts to audio beats and transitions automatically",
    longDesc:
      "Detect BPM transients and bass drops automatically. Snap jump cuts, speed ramps, and B-roll transitions directly onto the beat.",
    iconPath: "beatsync",
  },
  {
    key: "reframe",
    name: "Smart Reframe",
    badge: null,
    badgeStyle: "",
    shortDesc: "Speaker-tracking for crisp 9:16 vertical framing",
    longDesc:
      "Convert widescreen 16:9 interviews and multi-cam shoots into vertical video with smooth camera pan and active speaker framing.",
    iconPath: "reframe",
  },
  {
    key: "templates",
    name: "Pro Templates",
    badge: null,
    badgeStyle: "",
    shortDesc: "Studio-grade motion presets built for Reels & Shorts",
    longDesc:
      "Launch faster with modular motion presets crafted by editorial designers—complete with LUTs, lower thirds, and brand kits.",
    iconPath: "templates",
  },
];

export const REELS: Reel[] = [
  {
    id: "01",
    title: "Tokyo Night Drive",
    category: "CINEMATIC",
    handle: "@ren.midnight",
    initials: "RM",
    avatarGrad: "from-fuchsia-500 to-indigo-600",
    views: "1.8M",
    likes: 184200,
    comments: "2.4K",
    shares: "18.1K",
    audio: "Shibuya Drift 2AM • Beat Sync",
    gradient:
      "linear-gradient(160deg, #0b0718 0%, #251145 45%, #6e1c7c 80%, #f43f5e 100%)",
    orb1: "rgba(244, 63, 94, 0.50)",
    orb2: "rgba(99, 102, 241, 0.52)",
    icon: "🌃",
    captions: [
      "3AM neon rain in Shibuya",
      "Auto-synced to 128 BPM drop",
      "Shot handheld on 24mm 🔥",
    ],
  },
  {
    id: "02",
    title: "Minimalist Desk Setup",
    category: "AESTHETIC",
    handle: "@minimal.desk",
    initials: "MD",
    avatarGrad: "from-emerald-400 to-teal-600",
    views: "940K",
    likes: 112600,
    comments: "1.4K",
    shares: "15.2K",
    audio: "Warm Studio Lo-Fi • Loop",
    gradient:
      "linear-gradient(165deg, #071716 0%, #0e3834 48%, #18645c 84%, #34d399 100%)",
    orb1: "rgba(52, 211, 153, 0.46)",
    orb2: "rgba(13, 148, 136, 0.50)",
    icon: "🪴",
    captions: [
      "Walnut shelf + 2700K key light",
      "Zero visible cables anywhere",
      "Deep focus mode unlocked 🎧",
    ],
  },
  {
    id: "03",
    title: "Espresso Pour Aesthetics",
    category: "ASMR 4K",
    handle: "@crema.studio",
    initials: "CS",
    avatarGrad: "from-amber-400 to-stone-700",
    views: "1.4M",
    likes: 158900,
    comments: "1.9K",
    shares: "12.7K",
    audio: "Velvet Roast ASMR • Original",
    gradient:
      "linear-gradient(165deg, #16110e 0%, #3a2419 46%, #74492e 82%, #c99764 100%)",
    orb1: "rgba(201, 151, 100, 0.50)",
    orb2: "rgba(116, 73, 46, 0.52)",
    icon: "☕",
    captions: [
      "18g single-origin extraction",
      "Watch that tiger-stripe crema",
      "120fps slow-mo perfection ✨",
    ],
  },
  {
    id: "04",
    title: "Streetwear Fit Check",
    category: "TRENDING",
    handle: "@kai.drapes",
    initials: "KD",
    avatarGrad: "from-orange-400 to-rose-500",
    views: "1.2M",
    likes: 142800,
    comments: "2.1K",
    shares: "9.8K",
    audio: "Concrete Groove • Viral Hook",
    gradient:
      "linear-gradient(160deg, #17141c 0%, #3a1a2c 45%, #8a2c3e 82%, #f97316 100%)",
    orb1: "rgba(249, 115, 22, 0.50)",
    orb2: "rgba(225, 29, 72, 0.46)",
    icon: "🧥",
    captions: [
      "Boxy 500gsm washed hoodie",
      "Paired with pleated cargos",
      "Rate the silhouette 1–10 👟",
    ],
  },
  {
    id: "05",
    title: "AI Workflow Tips",
    category: "AI CLIPPER",
    handle: "@dev.pulse",
    initials: "DP",
    avatarGrad: "from-cyan-400 to-blue-600",
    views: "2.4M",
    likes: 268000,
    comments: "5.1K",
    shares: "39.6K",
    audio: "Synth Grid Pulse • Auto-Cut",
    gradient:
      "linear-gradient(160deg, #060e1c 0%, #0d264c 46%, #0f568c 82%, #06b6d4 100%)",
    orb1: "rgba(6, 182, 212, 0.52)",
    orb2: "rgba(59, 130, 246, 0.46)",
    icon: "⚡",
    captions: [
      "This 1-click AI workflow cuts",
      "3 hours of editing to 90 sec",
      "Save this before it blows up ⚡",
    ],
  },
  {
    id: "06",
    title: "Alpine FPV Drone",
    category: "FPV 60FPS",
    handle: "@aero.mira",
    initials: "AM",
    avatarGrad: "from-amber-500 to-pink-600",
    views: "3.1M",
    likes: 312500,
    comments: "3.8K",
    shares: "44.2K",
    audio: "Golden Horizon • Cine LUT",
    gradient:
      "linear-gradient(165deg, #170c18 0%, #4a1936 44%, #a8324a 78%, #fbbf24 100%)",
    orb1: "rgba(251, 191, 36, 0.48)",
    orb2: "rgba(219, 39, 119, 0.46)",
    icon: "🚁",
    captions: [
      "Diving 1,200ft alpine ridges",
      "Smart Reframe locked to 9:16",
      "Wait for the golden horizon 🌅",
    ],
  },
  {
    id: "07",
    title: "Midnight Lo-Fi Beats",
    category: "BEAT SYNC",
    handle: "@kuro.sound",
    initials: "KS",
    avatarGrad: "from-violet-500 to-purple-700",
    views: "1.6M",
    likes: 173900,
    comments: "2.6K",
    shares: "16.9K",
    audio: "Analog Tape 86 BPM • Synced",
    gradient:
      "linear-gradient(160deg, #0f0a1e 0%, #27134e 46%, #5b21b6 82%, #a855f7 100%)",
    orb1: "rgba(168, 85, 247, 0.52)",
    orb2: "rgba(236, 72, 153, 0.42)",
    icon: "🎹",
    captions: [
      "Chopping dusty vinyl at 1AM",
      "Every cut locked to the snare",
      "Drop a 🎧 if you feel this",
    ],
  },
];

export const REEL_DURATION = 5200;
export const LOADING_DURATION = 550;
