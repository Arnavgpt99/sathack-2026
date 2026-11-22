import {
  SourceVideo,
  Clip,
  EditorPreset,
  EditorCaptionStyle,
  Project,
} from "@/types/studio";

export interface PresetDef {
  id: EditorPreset;
  name: string;
  desc: string;
  thumb: "editorial" | "kinetic" | "podcast" | "letterbox" | "noir" | "raw";
}

export const EDITOR_PRESETS: PresetDef[] = [
  {
    id: "editorial",
    name: "Editorial Mono",
    desc: "Balanced architectural contrast & clean framing",
    thumb: "editorial",
  },
  {
    id: "kinetic",
    name: "Kinetic Punch",
    desc: "Tighter framing with crisp high-energy contrast",
    thumb: "kinetic",
  },
  {
    id: "podcast",
    name: "Podcast Split",
    desc: "Dual horizontal split frame for speaker focus",
    thumb: "podcast",
  },
  {
    id: "letterbox",
    name: "Cinema Letterbox",
    desc: "Widescreen matte bars inside 9:16 canvas",
    thumb: "letterbox",
  },
  {
    id: "noir",
    name: "High-Contrast Noir",
    desc: "Deep obsidian shadows & stark highlights",
    thumb: "noir",
  },
  {
    id: "raw",
    name: "Studio Raw",
    desc: "Unfiltered neutral framing with grid lines",
    thumb: "raw",
  },
];

export const EDITOR_CAPTION_STYLES: { id: EditorCaptionStyle; name: string }[] = [
  { id: "editorial", name: "Editorial Mono" },
  { id: "kinetic", name: "Bold Kinetic" },
  { id: "karaoke", name: "Karaoke Highlight" },
  { id: "bar", name: "Subtitle Bar" },
];

export function generateWaveform(seed: number, count = 72): number[] {
  const arr: number[] = [];
  for (let i = 0; i < count; i++) {
    const v = Math.abs(
      Math.sin(i * 0.42 + seed) * Math.cos(i * 0.19 + seed * 1.7)
    );
    arr.push(Math.round(18 + v * 78));
  }
  return arr;
}

export const SAMPLE_SOURCES: SourceVideo[] = [
  {
    id: "sample-yt",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Building Products That Stick — Keynote",
    channel: "Design Systems Conf",
    platform: "YouTube",
    duration: "48:15",
    resolution: "1080p",
  },
  {
    id: "sample-vimeo",
    url: "https://vimeo.com/948271042/founders-unfiltered",
    title: "Founders Unfiltered: Zero to First 10K Users",
    channel: "Indie Builders Podcast",
    platform: "Vimeo",
    duration: "1:04:20",
    resolution: "4K",
  },
  {
    id: "sample-twitch",
    url: "https://twitch.tv/videos/2298410051",
    title: "Live Architecture Breakdown & Design Review",
    channel: "DevCraft Live",
    platform: "Twitch",
    duration: "36:42",
    resolution: "1080p60",
  },
];

export const DIRECTION_PRESETS: Record<string, string> = {
  hooks:
    "Find the sharpest 30–45 second contrarian takes, punch up the opening 3-second hook, and trim dead air.",
  gold: "Extract concrete, step-by-step frameworks and actionable takeaways with crisp conclusions.",
  debate:
    "Isolate high-tension back-and-forth exchanges, strong disagreements, and bold counterarguments.",
  story:
    "Pull complete mini-stories with a clear setup, turning point, and memorable closing lesson.",
};

export function createInitialClips(): Clip[] {
  return [
    {
      id: "clip-01",
      indexLabel: "01",
      title: "The 10-Second Retention Rule",
      hook: "Most teams spend months polishing features while losing 70% of viewers in ten seconds.",
      rationale:
        "Opens with a sharp contrarian metric and resolves into a clear, memorable takeaway.",
      startSec: 252,
      endSec: 284,
      duration: 32.0,
      trimIn: 0,
      trimOut: 32.0,
      splits: [],
      sceneType: "soundwave",
      preset: "editorial",
      subtitlesEnabled: true,
      editorCaptionStyle: "editorial",
      subFontSize: 14,
      subPosY: 18,
      adjust: { zoom: 100, contrast: 100, vignette: 25 },
      waveform: generateWaveform(1.1),
      subtitles: [
        { id: "s1", start: 0.5, end: 6.5, text: "Most teams spend months polishing features" },
        { id: "s2", start: 6.8, end: 13.5, text: "while losing 70% of viewers in ten seconds." },
        { id: "s3", start: 14.0, end: 22.0, text: "Lead with the sharpest tension, not the intro." },
        { id: "s4", start: 22.5, end: 31.0, text: "Cut every pause that does not earn attention." },
      ],
      score: 94,
      hookScore: 96,
      pacingScore: 92,
      clarityScore: 94,
      completionRate: "78%",
      dropoffNote:
        "Minimal drop-off after 0:08; strong vocal cadence sustains retention through the close.",
      retentionPoints: [100, 94, 89, 86, 83, 81, 79, 78],
      favorite: false,
      edited: false,
      exported: false,
    },
    {
      id: "clip-02",
      indexLabel: "02",
      title: "Why Simplicity Wins",
      hook: "Every extra button you add is a tax on the one action that matters.",
      rationale:
        "Clean, quotable one-liner with a natural vocal pause—ideal for kinetic captions.",
      startSec: 740,
      endSec: 768,
      duration: 28.0,
      trimIn: 0,
      trimOut: 28.0,
      splits: [],
      sceneType: "spotlight",
      preset: "kinetic",
      subtitlesEnabled: true,
      editorCaptionStyle: "kinetic",
      subFontSize: 15,
      subPosY: 22,
      adjust: { zoom: 106, contrast: 112, vignette: 30 },
      waveform: generateWaveform(2.4),
      subtitles: [
        { id: "s1", start: 0.4, end: 7.0, text: "Every extra button you add to a screen" },
        { id: "s2", start: 7.4, end: 14.2, text: "is a tax on the one action that matters." },
        { id: "s3", start: 14.8, end: 21.5, text: "Great products remove decisions before users ask." },
        { id: "s4", start: 22.0, end: 27.4, text: "Clarity compounds faster than feature count." },
      ],
      score: 91,
      hookScore: 93,
      pacingScore: 89,
      clarityScore: 92,
      completionRate: "74%",
      dropoffNote:
        "Slight dip around 0:18 during transition; trimming 2s of pause tightens pacing.",
      retentionPoints: [100, 92, 87, 82, 79, 77, 75, 74],
      favorite: false,
      edited: false,
      exported: false,
    },
    {
      id: "clip-03",
      indexLabel: "03",
      title: "The Feedback Trap",
      hook: "Stop asking users what they want—watch where they hesitate.",
      rationale:
        "Direct imperative hook with high conversational energy and a crisp ending.",
      startSec: 1285,
      endSec: 1309,
      duration: 24.0,
      trimIn: 0,
      trimOut: 24.0,
      splits: [],
      sceneType: "dualwave",
      preset: "podcast",
      subtitlesEnabled: true,
      editorCaptionStyle: "bar",
      subFontSize: 13,
      subPosY: 16,
      adjust: { zoom: 100, contrast: 105, vignette: 20 },
      waveform: generateWaveform(3.8),
      subtitles: [
        { id: "s1", start: 0.3, end: 6.2, text: "Stop asking users what features they want." },
        { id: "s2", start: 6.6, end: 13.0, text: "Instead, watch where they hesitate for two seconds." },
        { id: "s3", start: 13.5, end: 23.2, text: "That two-second pause is your entire roadmap." },
      ],
      score: 88,
      hookScore: 87,
      pacingScore: 90,
      clarityScore: 88,
      completionRate: "71%",
      dropoffNote:
        "Steady mid-clip retention; best suited for audiences who prefer deeper context.",
      retentionPoints: [100, 90, 84, 80, 77, 75, 73, 71],
      favorite: false,
      edited: false,
      exported: false,
    },
    {
      id: "clip-04",
      indexLabel: "04",
      title: "Designing for Habit",
      hook: "First impressions win the click, frictionless workflows win the habit.",
      rationale:
        "Balanced narrative arc with a strong closing line suited for Reels and Shorts.",
      startSec: 1902,
      endSec: 1938,
      duration: 36.0,
      trimIn: 0,
      trimOut: 36.0,
      splits: [],
      sceneType: "filmgrain",
      preset: "letterbox",
      subtitlesEnabled: true,
      editorCaptionStyle: "karaoke",
      subFontSize: 14,
      subPosY: 20,
      adjust: { zoom: 104, contrast: 118, vignette: 35 },
      waveform: generateWaveform(5.2),
      subtitles: [
        { id: "s1", start: 0.6, end: 8.5, text: "First impressions will always win the first click." },
        { id: "s2", start: 9.0, end: 17.5, text: "But frictionless workflows are what win the habit." },
        { id: "s3", start: 18.0, end: 26.5, text: "Design the second visit with twice the care." },
        { id: "s4", start: 27.0, end: 35.2, text: "Consistency beats novelty every single week." },
      ],
      score: 92,
      hookScore: 95,
      pacingScore: 91,
      clarityScore: 90,
      completionRate: "81%",
      dropoffNote:
        "Highest completion estimate due to tight 28s runtime and immediate payoff.",
      retentionPoints: [100, 96, 92, 89, 86, 84, 82, 81],
      favorite: false,
      edited: false,
      exported: false,
    },
    {
      id: "clip-05",
      indexLabel: "05",
      title: "Designing for the Second Visit",
      hook: "First impressions win the click, but frictionless workflows win the habit.",
      rationale:
        "Balanced narrative arc with a strong closing line suited for Reels and Shorts.",
      startSec: 2510,
      endSec: 2552,
      duration: 42.0,
      trimIn: 0,
      trimOut: 42.0,
      splits: [],
      sceneType: "soundwave",
      preset: "raw",
      subtitlesEnabled: true,
      editorCaptionStyle: "editorial",
      subFontSize: 14,
      subPosY: 18,
      adjust: { zoom: 100, contrast: 100, vignette: 20 },
      waveform: generateWaveform(6.5),
      subtitles: [
        { id: "s1", start: 0.5, end: 8.0, text: "Design the second visit with twice the care." },
        { id: "s2", start: 8.5, end: 19.0, text: "Consistency beats novelty every single week." },
        { id: "s3", start: 19.5, end: 31.0, text: "Lead with the sharpest tension, not the intro." },
        { id: "s4", start: 31.5, end: 41.0, text: "Cut every pause that does not earn attention." },
      ],
      score: 85,
      hookScore: 84,
      pacingScore: 86,
      clarityScore: 87,
      completionRate: "68%",
      dropoffNote:
        "Gentle slope throughout; opening with the punchline lifts early retention.",
      retentionPoints: [100, 88, 82, 77, 74, 71, 69, 68],
      favorite: false,
      edited: false,
      exported: false,
    },
  ];
}

export function createDefaultProject(): Project {
  return {
    id: "proj-sathack-2026",
    source: SAMPLE_SOURCES[0],
    creativeDirection: DIRECTION_PRESETS.hooks,
    aspectRatio: "9:16",
    lengthPreference: "30-60",
    autoCaptions: true,
    clips: createInitialClips(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
