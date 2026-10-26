export type Stage = "spark" | "exploring" | "building" | "parked";
export const STAGES: { id: Stage; label: string }[] = [
  { id: "spark", label: "Spark" },
  { id: "exploring", label: "Exploring" },
  { id: "building", label: "Building" },
  { id: "parked", label: "Parked" },
];

export type Idea = {
  id: string;
  title: string;
  notes: string;
  stage: Stage;
  keywords: string[];
  tickers: string[];
  createdAt: number;
  lastViewedAt?: number;
};

export const SEED: Idea[] = [
  {
    id: "seed-1",
    title: "Offline voice notes that auto-tag themselves",
    notes: "On-device speech-to-text, then cluster notes by topic. No cloud.",
    stage: "spark",
    keywords: ["speech recognition", "on-device"],
    tickers: ["AAPL", "GOOGL"],
    createdAt: Date.now(),
  },
  {
    id: "seed-2",
    title: "Battery health marketplace for used EVs",
    notes: "Certify battery degradation so used EV buyers trust the price.",
    stage: "exploring",
    keywords: ["battery degradation", "electric vehicle"],
    tickers: ["TSLA", "ALB"],
    createdAt: Date.now(),
  },
  {
    id: "seed-3",
    title: "Local-first CRDT spreadsheet",
    notes: "Collaborative spreadsheet that works offline and syncs peer-to-peer.",
    stage: "building",
    keywords: ["CRDT", "local-first"],
    tickers: ["MSFT"],
    createdAt: Date.now(),
  },
];

const KEY = "idea-desk:v1";
export function loadIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED;
}
export function saveIdeas(ideas: Idea[]) {
  localStorage.setItem(KEY, JSON.stringify(ideas));
}

export function parseList(s: string, upper = false): string[] {
  return Array.from(
    new Set(
      s.split(",").map((x) => (upper ? x.trim().toUpperCase() : x.trim())).filter(Boolean),
    ),
  );
}
