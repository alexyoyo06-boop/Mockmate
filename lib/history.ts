import { createClient } from "@/lib/supabase/client";

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

  const item: HistoryEntry = {
    ...entry,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };

  // Siempre guarda en localStorage como caché local
  const all = loadHistory();
  localStorage.setItem(KEY, JSON.stringify([item, ...all].slice(0, 50)));

  // Fire-and-forget a Supabase si hay sesión activa
  const supabase = createClient();
  supabase.auth.getUser().then(({ data }) => {
    if (!data.user) return;
    supabase.from("interview_history").insert({
      user_id: data.user.id,
      role: item.role,
      level: item.level,
      interviewer: item.interviewer,
      score: item.score,
      verdict: item.verdict,
      duration: item.duration,
      category_scores: item.categories,
    });
  });
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export async function loadHistoryFromSupabase(): Promise<HistoryEntry[] | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("interview_history")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return null;

  return data.map((row) => ({
    id: row.id,
    date: row.created_at,
    role: row.role,
    level: row.level,
    interviewer: row.interviewer,
    score: row.score ?? 0,
    verdict: row.verdict ?? "CONSIDERAR",
    duration: row.duration ?? 0,
    categories: row.category_scores ?? [],
  }));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
