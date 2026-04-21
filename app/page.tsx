"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UserNav from "@/components/UserNav";

const CATEGORIES = [
  {
    id: "tech",
    name: "Informática",
    accent: "#ff2b2b",
    jobs: [
      { name: "Frontend Developer", icon: "FE" },
      { name: "Backend Developer", icon: "BE" },
      { name: "Full Stack Developer", icon: "FS" },
      { name: "Data Scientist", icon: "DS" },
      { name: "DevOps Engineer", icon: "DO" },
      { name: "Mobile Developer", icon: "MB" },
      { name: "Game Developer", icon: "GD" },
      { name: "QA Engineer", icon: "QA" },
      { name: "Security Analyst", icon: "SA" },
      { name: "Cloud Architect", icon: "CA" },
      { name: "ML Engineer", icon: "ML" },
      { name: "AI Engineer", icon: "AI" },
      { name: "Network Engineer", icon: "NE" },
      { name: "Database Administrator", icon: "DB" },
      { name: "IT Support", icon: "IT" },
      { name: "Product Manager", icon: "PM" },
      { name: "Technical Lead", icon: "TL" },
      { name: "Site Reliability Engineer", icon: "SR" },
      { name: "Data Engineer", icon: "DE" },
      { name: "Data Analyst", icon: "DA" },
      { name: "AR/VR Developer", icon: "VR" },
      { name: "Blockchain Developer", icon: "BC" },
      { name: "Scrum Master", icon: "SM" },
      { name: "UI/UX Designer", icon: "UX" },
    ],
  },
  {
    id: "design",
    name: "Diseño",
    accent: "#7c3aed",
    jobs: [
      { name: "Graphic Designer", icon: "GR" },
      { name: "Brand Designer", icon: "BR" },
      { name: "Motion Designer", icon: "MO" },
      { name: "UX Researcher", icon: "UX" },
      { name: "3D Artist", icon: "3D" },
      { name: "Illustrator", icon: "IL" },
      { name: "Video Editor", icon: "VE" },
      { name: "Art Director", icon: "AD" },
      { name: "Creative Director", icon: "CD" },
      { name: "Product Designer", icon: "PD" },
      { name: "Visual Designer", icon: "VD" },
      { name: "Web Designer", icon: "WD" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    accent: "#d97706",
    jobs: [
      { name: "Digital Marketing Manager", icon: "DM" },
      { name: "SEO Specialist", icon: "SE" },
      { name: "Content Creator", icon: "CC" },
      { name: "Social Media Manager", icon: "SM" },
      { name: "Growth Hacker", icon: "GH" },
      { name: "Email Marketing Specialist", icon: "EM" },
      { name: "Performance Marketing Manager", icon: "PM" },
      { name: "Brand Strategist", icon: "BS" },
      { name: "Copywriter", icon: "CW" },
      { name: "Community Manager", icon: "CM" },
      { name: "Paid Media Specialist", icon: "PA" },
    ],
  },
  {
    id: "finance",
    name: "Finanzas",
    accent: "#059669",
    jobs: [
      { name: "Financial Analyst", icon: "FA" },
      { name: "Investment Banker", icon: "IB" },
      { name: "Accountant", icon: "AC" },
      { name: "Risk Analyst", icon: "RA" },
      { name: "Financial Controller", icon: "FC" },
      { name: "Auditor", icon: "AU" },
      { name: "Portfolio Manager", icon: "PO" },
      { name: "Tax Consultant", icon: "TC" },
      { name: "CFO", icon: "CF" },
      { name: "Business Analyst", icon: "BA" },
    ],
  },
  {
    id: "health",
    name: "Salud",
    accent: "#0284c7",
    jobs: [
      { name: "Nurse", icon: "NR" },
      { name: "Physician", icon: "MD" },
      { name: "Pharmacist", icon: "PH" },
      { name: "Physical Therapist", icon: "PT" },
      { name: "Clinical Psychologist", icon: "PS" },
      { name: "Nutritionist", icon: "NU" },
      { name: "Healthcare Manager", icon: "HM" },
      { name: "Medical Researcher", icon: "MR" },
      { name: "Dentist", icon: "DN" },
    ],
  },
  {
    id: "legal",
    name: "Legal",
    accent: "#64748b",
    jobs: [
      { name: "Lawyer", icon: "LW" },
      { name: "Legal Counsel", icon: "LC" },
      { name: "Paralegal", icon: "PL" },
      { name: "Compliance Officer", icon: "CO" },
      { name: "Contract Manager", icon: "CM" },
      { name: "IP Specialist", icon: "IP" },
      { name: "Tax Lawyer", icon: "TL" },
      { name: "Judge", icon: "JG" },
    ],
  },
];

const ALL_JOB_NAMES = CATEGORIES.flatMap((c) => c.jobs.map((j) => j.name));

const LEVELS = [
  { id: "junior", label: "JUNIOR", desc: "0–2 años", tag: "01" },
  { id: "mid", label: "MID-LEVEL", desc: "2–5 años", tag: "02" },
  { id: "senior", label: "SENIOR", desc: "5+ años", tag: "03" },
];

const JOB_KEYWORDS = [
  "dev", "developer", "engineer", "analyst", "architect", "designer",
  "manager", "lead", "administrator", "consultant", "programmer",
  "scientist", "researcher", "specialist", "technician", "ops",
  "lawyer", "nurse", "doctor", "physician", "accountant", "director",
];

function looksLikeJob(text: string): boolean {
  return JOB_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));
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
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [customRoleText, setCustomRoleText] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState<string | null>(null);
  const [noFeedback, setNoFeedback] = useState(false);
  const [softskills, setSoftskills] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory)!;
  const accent = activeCategory.accent;

  const customTrimmed = customRoleText.trim();
  const suggestions = customTrimmed.length >= 2
    ? ALL_JOB_NAMES.filter((j) => j.toLowerCase().includes(customTrimmed.toLowerCase())).slice(0, 5)
    : [];
  const showJobWarning = selectedJob === "otro" && customTrimmed.length >= 3 && !looksLikeJob(customTrimmed);
  const effectiveRole = selectedJob === "otro" ? customTrimmed : selectedJob;
  const canProceedStep1 = selectedJob && (selectedJob !== "otro" || customTrimmed.length >= 2);

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
      <div className="border-b-2 border-black px-4 sm:px-6 py-3 flex items-center justify-between" style={{ transition: "background 0.5s ease" }}>
        <button
          onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="font-black text-xl tracking-tight mono hover:opacity-70 transition-all"
          style={{ color: accent, transition: "color 0.5s ease" }}
        >
          MOCKMATE
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push("/stats")}
            className="mono text-xs px-2 py-1 font-bold transition-all"
            style={{ border: `1px solid ${accent}`, color: accent, transition: "color 0.5s ease, border-color 0.5s ease" }}
          >
            PROGRESO →
          </button>
          <span
            className="mono text-xs px-2 py-1 hidden sm:inline"
            style={{ border: `1px solid ${accent}`, color: accent, transition: "color 0.5s ease, border-color 0.5s ease" }}
          >
            POWERED BY GROQ
          </span>
          <UserNav />
        </div>
      </div>

      {/* Marquee */}
      <div className="border-b-2 border-black overflow-hidden py-2 text-white" style={{ background: accent, transition: "background 0.5s ease" }}>
        <div className="flex animate-marquee whitespace-nowrap">
          {Array(4).fill("SIMULADOR DE ENTREVISTAS TÉCNICAS CON IA  ·  PRACTICA · MEJORA · CONSIGUE EL TRABAJO  ·  ").map((t, i) => (
            <span key={i} className="mono text-xs px-4">{t}</span>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-14 animate-fade-in">
          <div className="mono text-xs mb-3" style={{ color: accent, transition: "color 0.5s ease" }}>
            — SIMULADOR DE ENTREVISTAS CON IA
          </div>
          <h1 className="text-[clamp(3rem,10vw,6rem)] font-black leading-none tracking-tighter mb-4 border-b-2 pb-4" style={{ borderColor: accent, transition: "border-color 0.5s ease" }}>
            PRACTICA.<br />MEJORA.<br />CONSIGUE<br />EL TRABAJO.
          </h1>
          <p className="text-base max-w-md" style={{ color: "#555" }}>
            Un entrevistador de IA te hace preguntas técnicas reales, evalúa cada respuesta y genera un informe completo al final.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-0 mb-10 border-2 border-black w-full sm:w-fit overflow-hidden" style={{ borderColor: accent, transition: "border-color 0.5s ease" }}>
          {[["01", "PUESTO"], ["02", "NIVEL"], ["03", "ENTREVISTADOR"]].map(([num, label], i) => (
            <div
              key={i}
              className="flex-1 sm:flex-none px-2 sm:px-4 py-2 mono text-xs font-bold border-r-2 last:border-r-0 text-center sm:text-left"
              style={{
                background: step === i + 1 ? accent : step > i + 1 ? accent + "99" : "white",
                color: step >= i + 1 ? "white" : "#aaa",
                borderColor: accent,
                transition: "background 0.5s ease, border-color 0.5s ease",
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

            {/* Category tabs */}
            <div className="flex overflow-x-auto border-2 border-black mb-0 bg-white">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedJob(null);
                    }}
                    className="flex-shrink-0 px-4 py-3 mono text-xs font-bold border-r-2 border-black last:border-r-0 transition-all whitespace-nowrap"
                    style={{
                      background: isActive ? "var(--black)" : "white",
                      color: isActive ? cat.accent : "#aaa",
                      borderBottom: isActive ? `3px solid ${cat.accent}` : "none",
                    }}
                  >
                    {cat.name.toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Jobs grid */}
            <div className="border-2 border-t-0 border-black mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3">
                {activeCategory.jobs.map((job, i) => {
                  const isSelected = selectedJob === job.name;
                  const cols = 3;
                  const isLastRow = i >= activeCategory.jobs.length - (activeCategory.jobs.length % cols || cols);
                  return (
                    <button
                      key={job.name}
                      onClick={() => setSelectedJob(job.name)}
                      className="p-4 text-left transition-all border-r-2 border-b-2 border-black"
                      style={{
                        background: isSelected ? "var(--black)" : "white",
                        color: isSelected ? "white" : "var(--black)",
                        borderRight: (i + 1) % 3 === 0 ? "none" : "2px solid var(--black)",
                        borderBottom: isLastRow ? "none" : "2px solid var(--black)",
                      }}
                    >
                      <div className="mono text-xs mb-2 font-bold" style={{ color: isSelected ? accent : "#bbb" }}>
                        {job.icon}
                      </div>
                      <div className="font-bold text-sm leading-tight">{job.name}</div>
                    </button>
                  );
                })}

                {/* Otro puesto */}
                <button
                  onClick={() => setSelectedJob("otro")}
                  className="p-4 text-left transition-all col-span-full border-t-2 border-black"
                  style={{
                    background: selectedJob === "otro" ? "var(--black)" : "white",
                    color: selectedJob === "otro" ? "white" : "var(--black)",
                  }}
                >
                  <div className="mono text-xs mb-2 font-bold" style={{ color: selectedJob === "otro" ? accent : "#bbb" }}>??</div>
                  <div className="font-bold text-sm">Otro puesto</div>
                  <div className="text-xs mt-1 opacity-60">Escribe el puesto que quieras</div>
                </button>
              </div>
            </div>

            {/* Custom input */}
            {selectedJob === "otro" && (
              <div className="mb-8">
                <div className="border-2 border-black bg-white">
                  <div className="px-4 py-2 border-b-2 border-black mono text-xs opacity-50">ESCRIBE EL PUESTO</div>
                  <input
                    type="text"
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    placeholder="Ej: Game Developer, Nurse, Financial Analyst..."
                    className="brutal-input w-full px-4 py-3 text-base border-0"
                    autoFocus
                    maxLength={60}
                  />
                </div>
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
                {showJobWarning && (
                  <div className="border-2 border-t-0 border-black px-4 py-3 mono text-xs flex items-start gap-2" style={{ background: "var(--red)", color: "white" }}>
                    <span>⚠️</span>
                    <span>
                      <strong>&quot;{customTrimmed}&quot;</strong> no parece un puesto. Prueba algo como <em>Game Developer</em>, <em>Nurse</em> o <em>Financial Analyst</em>.
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedJob !== "otro" && <div className="mb-8" />}

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
                    <span className="mono text-xs" style={{ color: accent }}>✓ SELECCIONADO</span>
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
                  <div className="mono text-xs mb-1" style={{ color: selectedInterviewer === iv.id ? accent : "#aaa" }}>
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
                  { id: "noFeedback", label: "Modo sin feedback", desc: "El entrevistador no comenta tus respuestas. Más realista.", value: noFeedback, toggle: () => setNoFeedback((v) => !v) },
                  { id: "softskills", label: "Incluir softskills", desc: "Añade 1-2 preguntas de trabajo en equipo y cultura.", value: softskills, toggle: () => setSoftskills((v) => !v) },
                  { id: "timer", label: "Cronómetro de respuesta", desc: "2 minutos por pregunta. Simula la presión real.", value: timerEnabled, toggle: () => setTimerEnabled((v) => !v) },
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
                    <div className="w-10 h-5 border-2 border-black relative flex-shrink-0 ml-4 transition-all" style={{ background: opt.value ? "var(--black)" : "white" }}>
                      <div className="absolute top-0 w-4 h-full border-r-2 border-black transition-all" style={{ left: opt.value ? "calc(100% - 1rem)" : "0", background: opt.value ? "white" : "#ccc" }} />
                    </div>
                  </button>
                ))}
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="font-bold text-sm">Idioma de la entrevista</div>
                    <div className="text-xs opacity-50 mt-0.5">Practica en español o en inglés.</div>
                  </div>
                  <div className="flex border-2 border-black ml-4">
                    <button onClick={() => setLang("es")} className="px-3 py-1 mono text-xs font-bold transition-all" style={{ background: lang === "es" ? "var(--black)" : "white", color: lang === "es" ? "white" : "var(--black)" }}>ES</button>
                    <button onClick={() => setLang("en")} className="px-3 py-1 mono text-xs font-bold border-l-2 border-black transition-all" style={{ background: lang === "en" ? "var(--black)" : "white", color: lang === "en" ? "white" : "var(--black)" }}>EN</button>
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
