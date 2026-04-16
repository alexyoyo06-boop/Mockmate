"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadHistory, clearHistory, HistoryEntry } from "@/lib/history";

const ROLE_LABELS: Record<string, string> = {
  frontend: "Frontend Dev",
  backend: "Backend Dev",
  fullstack: "Full Stack",
  data: "Data Scientist",
  devops: "DevOps / SRE",
  mobile: "Mobile Dev",
};

const VERDICT_COLORS: Record<string, string> = {
  CONTRATAR: "white",
  CONSIDERAR: "#facc15",
  RECHAZAR: "var(--red)",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" });
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function StatsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    setConfirmClear(false);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center mono text-sm" style={{ background: "var(--bg)" }}>
        CARGANDO...
      </div>
    );
  }

  // Calcular stats
  const total = history.length;
  const avgScore = total > 0 ? Math.round(history.reduce((s, e) => s + e.score, 0) / total) : 0;
  const bestScore = total > 0 ? Math.max(...history.map((e) => e.score)) : 0;
  const lastScore = history[0]?.score ?? null;
  const trend = history.length >= 2 ? history[0].score - history[1].score : null;

  const verdictCount = {
    CONTRATAR: history.filter((e) => e.verdict === "CONTRATAR").length,
    CONSIDERAR: history.filter((e) => e.verdict === "CONSIDERAR").length,
    RECHAZAR: history.filter((e) => e.verdict === "RECHAZAR").length,
  };

  const chartData = [...history].reverse().slice(-10);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b-2 border-black px-6 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="mono text-xs hover:underline">← INICIO</button>
          <div className="h-4 w-px bg-black opacity-20" />
          <span className="font-black text-xl tracking-tight mono">MOCKMATE</span>
        </div>
        <span className="mono text-xs border border-black px-2 py-1">MI PROGRESO</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {total === 0 ? (
          /* Estado vacío */
          <div className="border-2 border-black bg-white p-12 text-center animate-fade-in">
            <div className="mono text-xs mb-4 opacity-40">— SIN DATOS</div>
            <div className="font-black text-4xl mb-4">HISTORIAL VACÍO</div>
            <p className="text-sm opacity-60 mb-8 max-w-sm mx-auto">
              Completa tu primera entrevista para ver aquí tu progreso y estadísticas.
            </p>
            <button onClick={() => router.push("/")} className="brutal-btn px-8 py-3 text-sm uppercase tracking-widest">
              Hacer primera entrevista →
            </button>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div className="mono text-xs mb-3" style={{ color: "var(--red)" }}>— RESUMEN GENERAL</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-2 border-black bg-white mb-6 animate-fade-in">
              {[
                { label: "ENTREVISTAS", value: total },
                { label: "PUNTUACIÓN MEDIA", value: `${avgScore}/100` },
                { label: "MEJOR NOTA", value: `${bestScore}/100` },
                {
                  label: "ÚLTIMA NOTA",
                  value: lastScore !== null ? `${lastScore}/100` : "—",
                  sub: trend !== null ? (trend > 0 ? `↑ +${trend}` : trend < 0 ? `↓ ${trend}` : "= igual") : undefined,
                  subColor: trend !== null && trend > 0 ? "#22c55e" : trend !== null && trend < 0 ? "var(--red)" : "#aaa",
                },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="p-5 border-r-2 border-black last:border-r-0 sm:border-b-0 border-b-2"
                >
                  <div className="font-black text-3xl leading-none mb-1">{stat.value}</div>
                  {stat.sub && (
                    <div className="mono text-xs font-bold mb-1" style={{ color: stat.subColor }}>
                      {stat.sub} vs anterior
                    </div>
                  )}
                  <div className="mono text-xs opacity-40">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Distribución de veredictos */}
            <div className="border-2 border-black bg-white mb-6 animate-fade-in">
              <div className="border-b-2 border-black px-6 py-3 mono text-xs font-bold">DISTRIBUCIÓN DE VEREDICTOS</div>
              <div className="grid grid-cols-3 divide-x-2 divide-black">
                {(["CONTRATAR", "CONSIDERAR", "RECHAZAR"] as const).map((v) => (
                  <div key={v} className="p-5 text-center">
                    <div
                      className="font-black text-4xl mb-2"
                      style={{ color: v === "RECHAZAR" ? "var(--red)" : v === "CONSIDERAR" ? "#ca8a04" : "var(--black)" }}
                    >
                      {verdictCount[v]}
                    </div>
                    <div className="mono text-xs opacity-50">{v}</div>
                    {total > 0 && (
                      <div className="mono text-xs mt-1 opacity-30">
                        {Math.round((verdictCount[v] / total) * 100)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Barra proporcional */}
              <div className="border-t-2 border-black h-3 flex">
                {verdictCount.CONTRATAR > 0 && (
                  <div style={{ width: `${(verdictCount.CONTRATAR / total) * 100}%`, background: "var(--black)" }} />
                )}
                {verdictCount.CONSIDERAR > 0 && (
                  <div style={{ width: `${(verdictCount.CONSIDERAR / total) * 100}%`, background: "#facc15" }} />
                )}
                {verdictCount.RECHAZAR > 0 && (
                  <div style={{ width: `${(verdictCount.RECHAZAR / total) * 100}%`, background: "var(--red)" }} />
                )}
              </div>
            </div>

            {/* Gráfico de tendencia */}
            {chartData.length > 1 && (
              <div className="border-2 border-black bg-white mb-6 animate-fade-in">
                <div className="border-b-2 border-black px-6 py-3 mono text-xs font-bold">
                  TENDENCIA — ÚLTIMAS {chartData.length} ENTREVISTAS
                </div>
                <div className="px-6 py-6">
                  <div className="flex items-end gap-2 h-28">
                    {chartData.map((entry, i) => {
                      const barColor =
                        entry.score >= 75 ? "var(--black)" :
                        entry.score >= 50 ? "#888" :
                        "var(--red)";
                      return (
                        <div key={entry.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="mono text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 whitespace-nowrap">
                            {entry.score}
                          </div>
                          <div
                            className="w-full border-2 border-black transition-all"
                            style={{
                              height: `${(entry.score / 100) * 96}px`,
                              background: barColor,
                              minHeight: "4px",
                            }}
                          />
                          <div className="mono text-xs opacity-30 rotate-0">{i + 1}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Escala */}
                  <div className="flex justify-between mono text-xs opacity-30 mt-2 border-t border-black pt-1">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            )}

            {/* Historial completo */}
            <div className="border-2 border-black bg-white mb-8 animate-fade-in">
              <div className="border-b-2 border-black px-6 py-3 mono text-xs font-bold flex items-center justify-between">
                <span>HISTORIAL COMPLETO</span>
                <span className="opacity-40 font-normal">{total} entrevistas</span>
              </div>
              {history.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between px-6 py-4 ${i < history.length - 1 ? "border-b-2 border-black" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="mono text-xs opacity-30 w-16">{formatDate(entry.date)}</div>
                    <div>
                      <div className="font-bold text-sm">{ROLE_LABELS[entry.role] || entry.role}</div>
                      <div className="mono text-xs opacity-40 uppercase">{entry.level} · {entry.interviewer === "alex" ? "🧑‍💼 ALEX" : "😎 PAU"} · {formatTime(entry.duration)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xl">{entry.score}<span className="text-sm opacity-30">/100</span></span>
                    <span
                      className="mono text-xs font-bold px-2 py-1"
                      style={{ background: "var(--black)", color: VERDICT_COLORS[entry.verdict] }}
                    >
                      {entry.verdict}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Borrar historial */}
            <div className="text-center">
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="mono text-xs opacity-30 hover:opacity-60 transition-opacity underline"
                >
                  Borrar historial
                </button>
              ) : (
                <div className="border-2 border-black bg-white p-4 inline-flex flex-col items-center gap-3">
                  <span className="mono text-xs">¿Seguro? Esto borra todas las entrevistas guardadas.</span>
                  <div className="flex gap-3">
                    <button onClick={handleClear} className="brutal-btn px-4 py-2 text-xs uppercase" style={{ background: "var(--red)" }}>
                      Sí, borrar
                    </button>
                    <button onClick={() => setConfirmClear(false)} className="brutal-btn-outline px-4 py-2 text-xs uppercase">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
