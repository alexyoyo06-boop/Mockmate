"use client";

import { useRef, useState } from "react";

interface Category {
  name: string;
  score: number;
  comment: string;
}

interface ReportData {
  overallScore: number;
  verdict: "CONTRATAR" | "CONSIDERAR" | "RECHAZAR";
  summary: string;
  categories: Category[];
  strengths: string[];
  improvements: string[];
  studyTopics?: string[];
  recommendation: string;
}

interface ReportProps {
  data: Record<string, unknown>;
  role: string;
  level: string;
  duration: number;
  interviewer: string;
  onRestart: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  frontend: "Frontend Dev",
  backend: "Backend Dev",
  fullstack: "Full Stack",
  data: "Data Scientist",
  devops: "DevOps / SRE",
  mobile: "Mobile Dev",
};

const VERDICT_CONFIG = {
  CONTRATAR:  { label: "CONTRATAR",  bg: "bg-black", text: "white" },
  CONSIDERAR: { label: "CONSIDERAR", bg: "bg-black", text: "#facc15" },
  RECHAZAR:   { label: "RECHAZAR",   bg: "bg-black", text: "var(--red)" },
};

export default function Report({ data, role, level, duration, interviewer, onRestart }: ReportProps) {
  const report = data as unknown as ReportData;
  const verdict = VERDICT_CONFIG[report.verdict] || VERDICT_CONFIG.CONSIDERAR;
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const handleCopy = () => {
    const lines = [
      `MockMate — Informe de evaluación`,
      `Puesto: ${ROLE_LABELS[role] || role} | Nivel: ${level.toUpperCase()} | Entrevistador: ${interviewer === "alex" ? "ALEX" : "PAU"}`,
      `Puntuación: ${report.overallScore}/100 | Veredicto: ${report.verdict} | Duración: ${formatTime(duration)}`,
      ``,
      `CATEGORÍAS:`,
      ...(report.categories?.map((c) => `  ${c.name}: ${c.score}/100`) || []),
      ``,
      `FORTALEZAS:`,
      ...(report.strengths?.map((s) => `  + ${s}`) || []),
      ``,
      `ÁREAS DE MEJORA:`,
      ...(report.improvements?.map((s) => `  → ${s}`) || []),
      ``,
      `${report.recommendation}`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(reportRef.current, { backgroundColor: "#f2f0eb", scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let y = 0;
      while (y < imgHeight) {
        pdf.addImage(imgData, "PNG", 0, -y, pageWidth, imgHeight);
        y += pageHeight;
        if (y < imgHeight) pdf.addPage();
      }
      pdf.save(`mockmate-${role}-${level}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b-2 border-black px-6 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <button onClick={onRestart} className="mono text-xs hover:underline">← SALIR</button>
          <div className="h-4 w-px bg-black opacity-20" />
          <span className="font-black text-xl tracking-tight mono">MOCKMATE</span>
        </div>
        <span className="mono text-xs border border-black px-2 py-1">INFORME DE EVALUACIÓN</span>
      </div>

      <div ref={reportRef} className="max-w-3xl mx-auto px-4 py-10">

        {/* Header del informe */}
        <div className="border-2 border-black bg-white mb-4">
          <div className="border-b-2 border-black px-6 py-3 flex items-center justify-between">
            <span className="mono text-xs opacity-50">MOCKMATE / INFORME #{Date.now().toString().slice(-6)}</span>
            <span className="mono text-xs opacity-50">{new Date().toLocaleDateString("es-ES")}</span>
          </div>
          <div className="px-6 py-6 flex items-start justify-between gap-6">
            <div>
              <div className="mono text-xs mb-2" style={{ color: "var(--red)" }}>— RESULTADO FINAL</div>
              <div className="font-black text-5xl leading-none mb-3">{report.overallScore}<span className="text-2xl opacity-30">/100</span></div>
              <div
                className="inline-block mono text-xs font-bold px-3 py-1"
                style={{ background: "var(--black)", color: verdict.text }}
              >
                {verdict.label}
              </div>
            </div>
            <div className="text-right mono text-xs opacity-50 space-y-1">
              <div>PUESTO: <strong className="text-black">{ROLE_LABELS[role]?.toUpperCase() || role.toUpperCase()}</strong></div>
              <div>NIVEL: <strong className="text-black">{level.toUpperCase()}</strong></div>
              <div>ENTREVISTADOR: <strong className="text-black">{interviewer === "alex" ? "ALEX 🧑‍💼" : "PAU 😎"}</strong></div>
              <div>DURACIÓN: <strong className="text-black">{formatTime(duration)}</strong></div>
            </div>
          </div>
          <div className="border-t-2 border-black px-6 py-4 text-sm leading-relaxed opacity-70">
            {report.summary}
          </div>
        </div>

        {/* Categorías */}
        <div className="border-2 border-black bg-white mb-4">
          <div className="border-b-2 border-black px-6 py-3 mono text-xs font-bold">DESGLOSE POR CATEGORÍAS</div>
          {report.categories?.map((cat, i) => (
            <div key={cat.name} className={`px-6 py-4 ${i < report.categories.length - 1 ? "border-b-2 border-black" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{cat.name}</span>
                <span className="mono text-sm font-black">{cat.score}<span className="opacity-30">/100</span></span>
              </div>
              <div className="w-full border border-black h-3 mb-2" style={{ background: "#eee" }}>
                <div
                  className="h-full"
                  style={{
                    "--bar-width": `${cat.score}%`,
                    width: 0,
                    animation: `growBar 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 0.12}s forwards`,
                    background: cat.score >= 75 ? "var(--black)" : cat.score >= 50 ? "#555" : "var(--red)",
                  } as React.CSSProperties}
                />
              </div>
              <p className="mono text-xs opacity-50">{cat.comment}</p>
            </div>
          ))}
        </div>

        {/* Fortalezas y mejoras */}
        <div className="grid sm:grid-cols-2 gap-0 border-2 border-black mb-4">
          <div className="bg-white border-r-2 border-black p-6">
            <div className="mono text-xs font-bold mb-4 border-b-2 border-black pb-2">FORTALEZAS</div>
            <ul className="space-y-3">
              {report.strengths?.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="font-black mt-0.5 flex-shrink-0">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6">
            <div className="mono text-xs font-bold mb-4 border-b-2 border-black pb-2" style={{ color: "var(--red)" }}>ÁREAS DE MEJORA</div>
            <ul className="space-y-3">
              {report.improvements?.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="font-black mt-0.5 flex-shrink-0" style={{ color: "var(--red)" }}>→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Temas a estudiar */}
        {report.studyTopics && report.studyTopics.length > 0 && (
          <div className="border-2 border-black bg-white mb-4">
            <div className="border-b-2 border-black px-6 py-3 mono text-xs font-bold flex items-center gap-2">
              <span>TEMAS A REPASAR</span>
              <span className="opacity-40 font-normal">— basados en tus áreas de mejora</span>
            </div>
            <div className="px-6 py-5 flex flex-wrap gap-2">
              {report.studyTopics.map((topic, i) => (
                <span
                  key={i}
                  className="border-2 border-black px-3 py-1.5 mono text-xs font-bold"
                  style={{ background: i % 2 === 0 ? "var(--black)" : "white", color: i % 2 === 0 ? "white" : "var(--black)" }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recomendación */}
        <div className="border-2 border-black bg-white p-6 mb-8">
          <div className="mono text-xs font-bold mb-3 border-b-2 border-black pb-2">RECOMENDACIÓN</div>
          <p className="text-sm leading-relaxed">{report.recommendation}</p>
        </div>

      </div>

      {/* Actions */}
      <div className="border-t-2 border-black bg-white px-6 py-4 flex flex-wrap gap-3 justify-center">
        <button onClick={onRestart} className="brutal-btn px-8 py-3 text-sm uppercase tracking-widest">
          Nueva entrevista →
        </button>
        <button
          onClick={handleCopy}
          className="brutal-btn-outline px-8 py-3 text-sm uppercase tracking-widest"
        >
          {copied ? "✓ COPIADO" : "Copiar resultado"}
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="brutal-btn-outline px-8 py-3 text-sm uppercase tracking-widest"
        >
          {downloading ? "Generando..." : "Descargar PDF"}
        </button>
      </div>
    </div>
  );
}
