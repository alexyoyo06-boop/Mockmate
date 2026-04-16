export interface HistoryEntry {
  id: string;
  date: string;
  role: string;
  level: string;
  interviewer: string;
  score: number;
  verdict: "CONTRATAR" | "CONSIDERAR" | "RECHAZAR";
  duration: number;
  categories: { name: string; score: number }[];
}

const KEY = "mockmate_history";

export function saveEntry(entry: Omit<HistoryEntry, "id" | "date">): void {
  if (typeof window === "undefined") return;
  const all = loadHistory();
  const item: HistoryEntry = {
    ...entry,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([item, ...all].slice(0, 50)));
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
