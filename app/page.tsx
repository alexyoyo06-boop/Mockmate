"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { id: "frontend", label: "Frontend Dev", icon: "FE", desc: "React · CSS · JS" },
  { id: "backend", label: "Backend Dev", icon: "BE", desc: "APIs · DBs · Arquitectura" },
  { id: "fullstack", label: "Full Stack", icon: "FS", desc: "Frontend + Backend" },
  { id: "data", label: "Data Scientist", icon: "DS", desc: "ML · Python · Estadística" },
  { id: "devops", label: "DevOps / SRE", icon: "DO", desc: "CI/CD · Infra · Cloud" },
  { id: "mobile", label: "Mobile Dev", icon: "MB", desc: "iOS · Android · RN" },
];

const LEVELS = [
  { id: "junior", label: "JUNIOR", desc: "0–2 años", tag: "01" },
  { id: "mid", label: "MID-LEVEL", desc: "2–5 años", tag: "02" },
  { id: "senior", label: "SENIOR", desc: "5+ años", tag: "03" },
];

const TECH_JOBS = [
  "Game Developer", "QA Engineer", "Security Analyst", "Cybersecurity Engineer",
  "Cloud Architect", "ML Engineer", "AI Engineer", "Blockchain Developer",
  "Embedded Systems Engineer", "Firmware Engineer", "Network Engineer",
  "Database Administrator", "Systems Administrator", "IT Support",
  "Product Manager", "Scrum Master", "Technical Lead", "Engineering Manager",
  "UI/UX Designer", "UX Researcher", "3D Artist", "Graphics Programmer",
  "Backend Engineer", "Platform Engineer", "Site Reliability Engineer",
  "AR/VR Developer", "Robotics Engineer", "Bioinformatics Developer",
  "Data Engineer", "Data Analyst", "Business Intelligence", "ETL Developer",
  "Salesforce Developer", "SAP Consultant", "ERP Developer",
];

const JOB_KEYWORDS = [
  "dev", "developer", "engineer", "analyst", "architect", "designer",
  "manager", "lead", "administrator", "consultant", "programmer",
  "scientist", "researcher", "specialist", "technician", "ops",
];

function looksLikeJob(text: string): boolean {
  const lower = text.toLowerCase();
  return JOB_KEYWORDS.some((kw) => lower.includes(kw));
}

const INTERVIEWERS = [
  {
    id: "alex",
    name: "ALEX",
    emoji: "🧑‍💼",
    tag: "ENTREVISTADOR A",
    trait: "Serio · Directo · Sin filtros",
    desc: "Va al grano. Si la respuesta es vaga, te lo dice. Sin rodeos.",
  },
  {
    id: "pau",
    name: "PAU",
    emoji: "😎",
    tag: "ENTREVISTADOR B",
    trait: "Enrollado · Cercano · Honesto",
    desc: "Ambiente relajado, algún chiste. Pero evalúa igual de duro.",
  },
];

export default function Home() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [customRoleText, setCustomRoleText] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState<string | null>(null);
  const [noFeedback, setNoFeedback] = useState(false);
  const [softskills, setSoftskills] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const effectiveRole = selectedRole === "otro" ? customRoleText.trim() : selectedRole;
  const customTrimmed = customRoleText.trim();
  const suggestions = customTrimmed.length >= 2
    ? TECH_JOBS.filter((j) => j.toLowerCase().includes(customTrimmed.toLowerCase())).slice(0, 5)
    : [];
  const showJobWarning = selectedRole === "otro" && customTrimmed.length >= 3 && !looksLikeJob(customTrimmed);
  const canProceedStep1 = selectedRole && (selectedRole !== "otro" || customTrimmed.length >= 2);

  const handleStart = () => {
    if (!effectiveRole || !selectedLevel || !selectedInterviewer) return;
    const params = new URLSearchParams({
      role: effectiveRole,
      level: selectedLevel,
      interviewer: selectedInterviewer,
      ...(noFeedback && { noFeedback: "true" }),
      ...(softskills && { softskills: "true" }),
      ...(timerEnabled && { timer: "true" }),
      ...(lang === "en" && { lang: "en" }),
    });
    router.push(`/interview?${params.toString()}`);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* Top bar */}
      <div className="border-b-2 border-black px-4 sm:px-6 py-3 flex items-center justify-between">
        <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="font-black text-xl tracking-tight mono hover:opacity-70 transition-opacity">MOCKMATE</button>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => router.push("/stats")} className="mono text-xs border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors">PROGRESO →</button>
          <span className="mono text-xs border border-black px-2 py-1 hidden sm:inline">POWERED BY GROQ</span>
        </div>
      </div>

      {/* Marquee */}
      <div className="border-b-2 border-black overflow-hidden py-2 bg-black text-white">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array(4).fill("SIMULADOR DE ENTREVISTAS TÉCNICAS CON IA  ·  PRACTICA · MEJORA · CONSIGUE EL TRABAJO  ·  ").map((t, i) => (
            <span key={i} className="mono text-xs px-4">{t}</span>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-14 animate-fade-in">
          <div className="mono text-xs mb-3" style={{ color: "var(--red)" }}>
            — SIMULADOR DE ENTREVISTAS CON IA
          </div>
          <h1 className="text-[clamp(3rem,10vw,6rem)] font-black leading-none tracking-tighter mb-4 border-b-2 border-black pb-4">
            PRACTICA.<br />MEJORA.<br />CONSIGUE<br />EL TRABAJO.
          </h1>
          <p className="text-base max-w-md" style={{ color: "#555" }}>
            Un entrevistador de IA te hace preguntas técnicas reales, evalúa cada respuesta y genera un informe completo al final.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-0 mb-10 border-2 border-black w-full sm:w-fit overflow-hidden">
          {[["01", "PUESTO"], ["02", "NIVEL"], ["03", "ENTREVISTADOR"]].map(([num, label], i) => (
            <div
              key={i}
              className="flex-1 sm:flex-none px-2 sm:px-4 py-2 mono text-xs font-bold border-r-2 border-black last:border-r-0 text-center sm:text-left"
              style={{
                background: step === i + 1 ? "var(--black)" : step > i + 1 ? "#555" : "white",
                color: step >= i + 1 ? "white" : "#aaa",
              }}
            >
              <span className="sm:hidden">{num}</span>
              <span className="hidden sm:inline">{num} {label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">¿Para qué puesto?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 border-2 border-black mb-4">
              {ROLES.map((role, i) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className="p-4 text-left border-r-2 border-b-2 border-black transition-all"
                  style={{
                    background: selectedRole === role.id ? "var(--black)" : "white",
                    color: selectedRole === role.id ? "white" : "var(--black)",
                    borderRight: (i + 1) % 3 === 0 ? "none" : "2px solid var(--black)",
                  }}
                >
                  <div className="mono text-xs mb-2" style={{ color: selectedRole === role.id ? "var(--red)" : "#aaa" }}>
                    {role.icon}
                  </div>
                  <div className="font-bold text-sm">{role.label}</div>
                  <div className="text-xs mt-1 opacity-60">{role.desc}</div>
                </button>
              ))}
              {/* Opción personalizada */}
              <button
                onClick={() => setSelectedRole("otro")}
                className="p-4 text-left border-r-2 border-b-2 border-black transition-all col-span-full sm:col-span-full"
                style={{
                  background: selectedRole === "otro" ? "var(--black)" : "white",
                  color: selectedRole === "otro" ? "white" : "var(--black)",
                  borderRight: "none",
                  borderBottom: "none",
                }}
              >
                <div className="mono text-xs mb-2" style={{ color: selectedRole === "otro" ? "var(--red)" : "#aaa" }}>??</div>
                <div className="font-bold text-sm">Otro puesto</div>
                <div className="text-xs mt-1 opacity-60">Escribe el puesto que quieras</div>
              </button>
            </div>

            {selectedRole === "otro" && (
              <div className="mb-8">
                <div className="border-2 border-black bg-white">
                  <div className="px-4 py-2 border-b-2 border-black mono text-xs opacity-50">ESCRIBE EL PUESTO</div>
                  <input
                    type="text"
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    placeholder="Ej: Game Developer, QA Engineer, Security Analyst..."
                    className="brutal-input w-full px-4 py-3 text-base border-0"
                    autoFocus
                    maxLength={60}
                  />
                </div>

                {/* Sugerencias */}
                {suggestions.length > 0 && (
                  <div className="border-2 border-t-0 border-black bg-white">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setCustomRoleText(s)}
                        className="w-full text-left px-4 py-2 text-sm border-b border-black last:border-b-0 hover:bg-black hover:text-white transition-colors mono"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Aviso si no parece un trabajo */}
                {showJobWarning && (
                  <div className="border-2 border-t-0 border-black px-4 py-3 mono text-xs flex items-start gap-2" style={{ background: "var(--red)", color: "white" }}>
                    <span>⚠️</span>
                    <span>
                      <strong>&quot;{customTrimmed}&quot;</strong> no parece un puesto de trabajo. Prueba algo como <em>Game Developer</em>, <em>QA Engineer</em> o <em>Security Analyst</em>.
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedRole !== "otro" && <div className="mb-8" />}

            <button
              onClick={() => canProceedStep1 && setStep(2)}
              disabled={!canProceedStep1}
              className="brutal-btn px-8 py-3 text-sm uppercase tracking-widest"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="animate-fade-in">
            <button onClick={() => setStep(1)} className="mono text-xs mb-6 flex items-center gap-1 hover:underline">
              ← Volver
            </button>
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">¿Cuál es tu nivel?</h2>
            <div className="flex flex-col gap-0 border-2 border-black mb-8">
              {LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className="p-5 text-left flex items-center justify-between border-b-2 border-black last:border-b-0 transition-all"
                  style={{
                    background: selectedLevel === level.id ? "var(--black)" : "white",
                    color: selectedLevel === level.id ? "white" : "var(--black)",
                  }}
                >
                  <div>
                    <span className="mono text-xs mr-3 opacity-50">{level.tag}</span>
                    <span className="font-black text-lg tracking-tight">{level.label}</span>
                    <span className="ml-3 text-sm opacity-60">{level.desc}</span>
                  </div>
                  {selectedLevel === level.id && (
                    <span className="mono text-xs" style={{ color: "var(--red)" }}>✓ SELECCIONADO</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedLevel && setStep(3)}
              disabled={!selectedLevel}
              className="brutal-btn px-8 py-3 text-sm uppercase tracking-widest"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="animate-fade-in">
            <button onClick={() => setStep(2)} className="mono text-xs mb-6 flex items-center gap-1 hover:underline">
              ← Volver
            </button>
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">¿Quién te entrevista?</h2>
            <div className="grid sm:grid-cols-2 gap-0 border-2 border-black mb-8">
              {INTERVIEWERS.map((iv) => (
                <button
                  key={iv.id}
                  onClick={() => setSelectedInterviewer(iv.id)}
                  className="p-6 text-left border-r-2 border-black last:border-r-0 transition-all"
                  style={{
                    background: selectedInterviewer === iv.id ? "var(--black)" : "white",
                    color: selectedInterviewer === iv.id ? "white" : "var(--black)",
                  }}
                >
                  <div className="text-4xl mb-3">{iv.emoji}</div>
                  <div className="mono text-xs mb-1" style={{ color: selectedInterviewer === iv.id ? "var(--red)" : "#aaa" }}>
                    {iv.tag}
                  </div>
                  <div className="font-black text-2xl mb-1">{iv.name}</div>
                  <div className="text-xs mb-3 opacity-60">{iv.trait}</div>
                  <div className="text-sm leading-relaxed opacity-80">{iv.desc}</div>
                </button>
              ))}
            </div>
            {/* Opciones adicionales */}
            <div className="border-2 border-black bg-white mb-8">
              <div className="border-b-2 border-black px-4 py-2 mono text-xs opacity-50">OPCIONES</div>
              <div className="divide-y-2 divide-black">
                {[
                  {
                    id: "noFeedback",
                    label: "Modo sin feedback",
                    desc: "El entrevistador no comenta tus respuestas. Más realista.",
                    value: noFeedback,
                    toggle: () => setNoFeedback((v) => !v),
                  },
                  {
                    id: "softskills",
                    label: "Incluir softskills",
                    desc: "Añade 1-2 preguntas de trabajo en equipo y cultura.",
                    value: softskills,
                    toggle: () => setSoftskills((v) => !v),
                  },
                  {
                    id: "timer",
                    label: "Cronómetro de respuesta",
                    desc: "2 minutos por pregunta. Simula la presión real.",
                    value: timerEnabled,
                    toggle: () => setTimerEnabled((v) => !v),
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={opt.toggle}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-50 mt-0.5">{opt.desc}</div>
                    </div>
                    <div
                      className="w-10 h-5 border-2 border-black relative flex-shrink-0 ml-4 transition-all"
                      style={{ background: opt.value ? "var(--black)" : "white" }}
                    >
                      <div
                        className="absolute top-0 w-4 h-full border-r-2 border-black transition-all"
                        style={{ left: opt.value ? "calc(100% - 1rem)" : "0", background: opt.value ? "white" : "#ccc" }}
                      />
                    </div>
                  </button>
                ))}
                {/* Idioma */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="font-bold text-sm">Idioma de la entrevista</div>
                    <div className="text-xs opacity-50 mt-0.5">Practica en español o en inglés.</div>
                  </div>
                  <div className="flex border-2 border-black ml-4">
                    <button
                      onClick={() => setLang("es")}
                      className="px-3 py-1 mono text-xs font-bold transition-all"
                      style={{ background: lang === "es" ? "var(--black)" : "white", color: lang === "es" ? "white" : "var(--black)" }}
                    >
                      ES
                    </button>
                    <button
                      onClick={() => setLang("en")}
                      className="px-3 py-1 mono text-xs font-bold border-l-2 border-black transition-all"
                      style={{ background: lang === "en" ? "var(--black)" : "white", color: lang === "en" ? "white" : "var(--black)" }}
                    >
                      EN
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!selectedInterviewer}
              className="brutal-btn w-full py-4 text-base uppercase tracking-widest"
            >
              {lang === "en" ? "Start interview →" : "Comenzar entrevista →"}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-black px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 mt-8">
        <span className="mono text-xs text-gray-400">MOCKMATE © 2026</span>
        <div className="flex gap-4 sm:gap-6 mono text-xs text-gray-400">
          <span>50+ PREGUNTAS</span>
          <span>3 NIVELES</span>
          <span>2 ENTREVISTADORES</span>
        </div>
      </div>
    </main>
  );
}
