"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Report from "@/components/Report";
import { saveEntry } from "@/lib/history";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ROLE_LABELS: Record<string, string> = {
  frontend: "Frontend Dev",
  backend: "Backend Dev",
  fullstack: "Full Stack",
  data: "Data Scientist",
  devops: "DevOps / SRE",
  mobile: "Mobile Dev",
};

function InterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") || "backend";
  const level = searchParams.get("level") || "mid";
  const interviewer = searchParams.get("interviewer") || "alex";
  const noFeedback = searchParams.get("noFeedback") === "true";
  const softskills = searchParams.get("softskills") === "true";
  const timerEnabled = searchParams.get("timer") === "true";
  const lang = searchParams.get("lang") || "es";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Voz
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [insultoWarning, setInsultoWarning] = useState(false);
  const [expelled, setExpelled] = useState(false);

  // Cronómetro de respuesta
  const RESPONSE_TIME = 120;
  const [timeLeft, setTimeLeft] = useState(RESPONSE_TIME);
  const [timeExpired, setTimeExpired] = useState(false);
  const responseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullTextRef = useRef("");
  const displayedRef = useRef(0);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const liveRecognitionRef = useRef<any>(null);
  const speakResolveRef = useRef<(() => void) | null>(null);
  const audioUnlockedRef = useRef(false);

  // Desbloquear audio en móvil: crear AudioContext durante el gesto del usuario
  // AudioContext se mantiene desbloqueado aunque el fetch sea async
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {}
    // Fallback silencioso para compatibilidad
    const silence = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
    silence.play().catch(() => {});
  };

  useEffect(() => {
    if (interviewStarted && !isFinished) {
      timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [interviewStarted, isFinished]);

  // Cronómetro de respuesta — arranca cuando el AI termina, se resetea al enviar
  useEffect(() => {
    if (!timerEnabled || !interviewStarted || isFinished) return;
    if (responseTimerRef.current) clearInterval(responseTimerRef.current);
    if (isLoading || isSpeaking) return;
    setTimeLeft(RESPONSE_TIME);
    setTimeExpired(false);
    responseTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(responseTimerRef.current!);
          setTimeExpired(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (responseTimerRef.current) clearInterval(responseTimerRef.current); };
  }, [isLoading, isSpeaking, interviewStarted, isFinished, timerEnabled]);

  // Parar audio al salir (botón atrás del navegador, etc.)
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
      if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch {} audioSourceRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
      window.speechSynthesis?.cancel();
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakFallback = useCallback((text: string): Promise<void> => {
    return new Promise((res) => {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`]/g, "");

      let done = false;
      const safeRes = () => {
        if (!done) { done = true; res(); }
      };
      // Safety timeout: if speechSynthesis never fires onend (common on mobile), resolve after 18s
      const safetyTimeout = setTimeout(() => {
        setStreamingText(clean);
        setIsSpeaking(false);
        safeRes();
      }, 18000);

      const doSpeak = (voices: SpeechSynthesisVoice[]) => {
        const utt = new SpeechSynthesisUtterance(clean);
        utt.lang = "es-ES";
        utt.rate = interviewer === "pau" ? 1.08 : 1.0;
        utt.pitch = interviewer === "pau" ? 1.05 : 0.82;
        const maleNames = ["pablo", "diego", "jorge", "carlos", "miguel", "juan", "alberto", "male"];
        const priority = [
          (v: SpeechSynthesisVoice) => v.lang === "es-ES" && maleNames.some(n => v.name.toLowerCase().includes(n)),
          (v: SpeechSynthesisVoice) => v.lang.startsWith("es") && maleNames.some(n => v.name.toLowerCase().includes(n)),
          (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes("microsoft") && v.lang.startsWith("es"),
          (v: SpeechSynthesisVoice) => v.lang === "es-ES",
          (v: SpeechSynthesisVoice) => v.lang.startsWith("es"),
        ];
        for (const fn of priority) {
          const found = voices.find(fn);
          if (found) { utt.voice = found; break; }
        }
        utt.onboundary = (event) => {
          const shown = event.charIndex + (event.charLength ?? 1);
          setStreamingText(clean.slice(0, shown));
        };
        utt.onstart = () => setIsSpeaking(true);
        utt.onend = () => { clearTimeout(safetyTimeout); setStreamingText(clean); setIsSpeaking(false); safeRes(); };
        utt.onerror = () => { clearTimeout(safetyTimeout); setStreamingText(clean); setIsSpeaking(false); safeRes(); };
        window.speechSynthesis.speak(utt);
      };

      // Esperar a que las voces estén cargadas (pueden llegar async)
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          doSpeak(window.speechSynthesis.getVoices());
        };
        // If voices never load either, the safetyTimeout will still fire
      }
    });
  }, [interviewer]);

  const speak = useCallback(async (text: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, interviewer }),
      });
      if (!res.ok) {
        // Sin saldo o error → fallback a voz del navegador
        speakFallback(text);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); currentAudioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); speakFallback(text); };
      const p = audio.play();
      if (p) p.catch(() => { setIsSpeaking(false); speakFallback(text); });
    } catch {
      speakFallback(text);
    }
  }, [interviewer, speakFallback]);

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
      audioSourceRef.current = null;
    }
    window.speechSynthesis.cancel();
    stopTypewriter();
    if (fullTextRef.current) {
      displayedRef.current = fullTextRef.current.length;
      setStreamingText(fullTextRef.current);
    }
    setIsSpeaking(false);
    if (speakResolveRef.current) {
      speakResolveRef.current();
      speakResolveRef.current = null;
    }
  };

  // Mic con MediaRecorder → Groq Whisper + SpeechRecognition en vivo para preview
  const startListening = async () => {
    stopSpeaking();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (liveRecognitionRef.current) {
          try { liveRecognitionRef.current.stop(); } catch {}
          liveRecognitionRef.current = null;
        }
        setIsListening(false);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "audio.webm");
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await res.json();
          if (data.text) setInput(data.text);
        } catch (err) {
          console.error("Transcripción fallida", err);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);

      // Preview en tiempo real mientras graba (SpeechRecognition interim)
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.lang = "es-ES";
        recognition.continuous = true;
        recognition.interimResults = true;
        let finalTranscript = "";
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInput(finalTranscript + interim);
        };
        recognition.onerror = () => {};
        recognition.start();
        liveRecognitionRef.current = recognition;
      }
    } catch {
      alert("No se pudo acceder al micrófono. Permite el acceso en el navegador.");
    }
  };

  const stopListening = () => {
    if (liveRecognitionRef.current) {
      try { liveRecognitionRef.current.stop(); } catch {}
      liveRecognitionRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  };

  const startTypewriter = () => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    let pauseFor = 0;
    typewriterRef.current = setInterval(() => {
      if (pauseFor > 0) { pauseFor--; return; }
      const full = fullTextRef.current;
      const shown = displayedRef.current;
      if (shown >= full.length) return;
      const next = shown + 1;
      displayedRef.current = next;
      setStreamingText(full.slice(0, next));
      const ch = full[next - 1];
      if (ch === "." || ch === "?" || ch === "!") pauseFor = 6;
      else if (ch === ",") pauseFor = 2;
    }, 22);
  };

  const stopTypewriter = () => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    typewriterRef.current = null;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const runStream = async (fetchBody: object, skipTypewriter = false): Promise<string> => {
    fullTextRef.current = "";
    displayedRef.current = 0;
    setStreamingText("");

    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fetchBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error ${res.status}: ${errorText}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    if (!skipTypewriter) startTypewriter();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullTextRef.current += decoder.decode(value);
    }

    if (!skipTypewriter) {
      if (fullTextRef.current.length > 0) {
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (displayedRef.current >= fullTextRef.current.length) {
              clearInterval(check);
              resolve();
            }
          }, 30);
        });
      }
      stopTypewriter();
      setStreamingText("");
    }

    return fullTextRef.current;
  };

  // En modo voz: typewriter inmediato + new Audio() en PC + AudioContext en móvil si falla autoplay
  const speakSynced = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        speakResolveRef.current = null;
        stopTypewriter();
        displayedRef.current = fullTextRef.current.length;
        setStreamingText(fullTextRef.current);
        setIsSpeaking(false);
        resolve();
      };
      const cleanupAndFinish = (clearPoll: () => void) => { clearPoll(); finish(); };

      speakResolveRef.current = finish;
      displayedRef.current = 0;
      setStreamingText("");
      setIsSpeaking(true);

      // Typewriter arranca siempre — texto animado aunque el audio falle
      startTypewriter();

      // Poll: si no hay audio, resolver cuando typewriter termine
      const poll = setInterval(() => {
        if (settled) { clearInterval(poll); return; }
        if (fullTextRef.current.length > 0 && displayedRef.current >= fullTextRef.current.length) {
          clearInterval(poll);
          finish();
        }
      }, 100);

      const cap = setTimeout(() => { clearInterval(poll); finish(); }, 35000);
      const stopPoll = () => { clearTimeout(cap); clearInterval(poll); };

      // Reajustar velocidad typewriter a la duración del audio
      const resyncTypewriter = (durationSec: number) => {
        if (settled) return;
        const total = fullTextRef.current.length;
        const shown = displayedRef.current;
        const remaining = total - shown;
        if (remaining <= 0) return;
        const targetMs = durationSec * 950 - shown * 22;
        const msPerChar = Math.max(16, targetMs / remaining);
        const pauseDot = Math.round(280 / msPerChar);
        const pauseComma = Math.round(100 / msPerChar);
        stopTypewriter();
        let pauseFor = 0;
        typewriterRef.current = setInterval(() => {
          if (settled) { stopTypewriter(); return; }
          if (pauseFor > 0) { pauseFor--; return; }
          const s = displayedRef.current;
          if (s >= total) { stopTypewriter(); return; }
          displayedRef.current = s + 1;
          setStreamingText(fullTextRef.current.slice(0, s + 1));
          const ch = fullTextRef.current[s];
          if (ch === "." || ch === "?" || ch === "!") pauseFor = pauseDot;
          else if (ch === ",") pauseFor = pauseComma;
        }, msPerChar);
      };

      fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, interviewer }),
      })
        .then((res) => { if (!res.ok) throw new Error("TTS failed"); return res.arrayBuffer(); })
        .then((arrayBuffer) => {
          if (settled) return;

          // Intentar new Audio() → funciona en PC directamente
          const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudioRef.current = audio;

          audio.addEventListener("loadedmetadata", () => resyncTypewriter(audio.duration));

          audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudioRef.current = null;
            cleanupAndFinish(stopPoll);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            currentAudioRef.current = null;
            // poll resolverá vía typewriter
          };

          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch(() => {
              // Autoplay bloqueado (móvil) → probar AudioContext pre-desbloqueado
              URL.revokeObjectURL(url);
              currentAudioRef.current = null;
              const ctx = audioCtxRef.current;
              if (!ctx) return; // poll gestiona la resolución
              ctx.decodeAudioData(arrayBuffer.slice(0))
                .then((audioBuffer) => {
                  if (settled) return;
                  resyncTypewriter(audioBuffer.duration);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  audioSourceRef.current = source;
                  source.onended = () => {
                    audioSourceRef.current = null;
                    cleanupAndFinish(stopPoll);
                  };
                  source.start();
                })
                .catch(() => {
                  // AudioContext también falló → poll gestiona la resolución
                });
            });
          }
        })
        .catch(() => {
          // Fetch TTS falló → poll gestiona la resolución vía typewriter
        });
    });
  }, [interviewer]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    unlockAudio(); // desbloquear audio en móvil antes del async
    if (responseTimerRef.current) clearInterval(responseTimerRef.current);
    setTimeLeft(RESPONSE_TIME);
    setTimeExpired(false);
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const fullText = await runStream({ messages: newMessages, role, level, mode: "chat", interviewer, noFeedback, softskills, lang }, voiceMode);
      const isExpelled = fullText.includes("[EXPULSADO]");
      const finished = fullText.includes("[ENTREVISTA_FINALIZADA]") || isExpelled;
      const cleanText = fullText
        .replace("[EXPULSADO]", "")
        .replace("[INSULTO_DETECTADO]", "")
        .replace("[ENTREVISTA_FINALIZADA]", "")
        .trim();

      // Limpiar tokens de fullTextRef para que el typewriter no los muestre
      fullTextRef.current = cleanText;

      if (fullText.includes("[INSULTO_DETECTADO]")) setInsultoWarning(true);
      if (isExpelled) { setInsultoWarning(false); setExpelled(true); }

      if (voiceMode) await speakSynced(cleanText);

      setStreamingText("");
      setMessages([...newMessages, { role: "assistant", content: cleanText }]);
      setQuestionCount((q) => q + 1);

      if (finished) {
        setIsFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
        generateReport([...newMessages, { role: "assistant", content: cleanText }], isExpelled, elapsedTime);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = async () => {
    unlockAudio(); // desbloquear audio en móvil antes del async
    setInterviewStarted(true);
    setIsLoading(true);
    setApiError(null);

    try {
      const fullText = await runStream({ messages: [], role, level, mode: "chat", interviewer, noFeedback, softskills, lang }, voiceMode);
      const clean = fullText.trim();

      if (voiceMode) await speakSynced(clean);

      setStreamingText("");
      setMessages([{ role: "assistant", content: clean }]);
    } catch (err) {
      console.error(err);
      setInterviewStarted(false);
      setApiError(err instanceof Error ? err.message : "Error al conectar con la API. Revisa la consola.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (finalMessages: Message[], isExpelled = false, finalDuration = 0) => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: finalMessages, role, level, mode: "feedback", interviewer, expelled: isExpelled, softskills, lang }),
      });
      const data = await res.json();
      const clean = data.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(clean);
      saveEntry({
        role,
        level,
        interviewer,
        score: parsed.overallScore,
        verdict: parsed.verdict,
        duration: finalDuration,
        categories: (parsed.categories || []).map((c: { name: string; score: number }) => ({ name: c.name, score: c.score })),
      });
      setReportData(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (reportData) {
    return <Report data={reportData} role={role} level={level} duration={elapsedTime} interviewer={interviewer} onRestart={() => router.push("/")} />;
  }

  const ivName = interviewer === "alex" ? "ALEX" : "PAU";
  const ivEmoji = interviewer === "alex" ? "🧑‍💼" : "😎";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b-2 border-black px-3 sm:px-6 py-3 flex items-center justify-between bg-white gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => { stopSpeaking(); router.push("/"); }} className="mono text-xs hover:underline shrink-0">
            ← SALIR
          </button>
          <div className="h-4 w-px bg-black opacity-20 hidden sm:block" />
          <span className="font-black text-xs sm:text-sm uppercase truncate hidden sm:block">{ROLE_LABELS[role] || role}</span>
          <span className="border border-black px-2 py-0.5 mono text-xs uppercase shrink-0">{level}</span>
          <span className="mono text-xs opacity-50 shrink-0">{ivEmoji} {ivName}</span>
          {lang === "en" && <span className="mono text-xs border border-black px-2 py-0.5 hidden sm:inline">🇬🇧 EN</span>}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 mono text-xs shrink-0">
          <button
            onClick={() => { setVoiceMode(v => !v); stopSpeaking(); }}
            className="flex items-center gap-1 sm:gap-2 border-2 border-black px-2 sm:px-3 py-1 font-bold transition-all"
            style={{ background: voiceMode ? "var(--black)" : "white", color: voiceMode ? "white" : "var(--black)" }}
            title={voiceMode ? "Desactivar voz" : "Activar voz"}
          >
            {voiceMode ? "🔊 VOZ ON" : "🔇 VOZ OFF"}
          </button>
          <span className="hidden sm:inline">PREG. <strong>{questionCount}</strong></span>
          {interviewStarted && <span>{formatTime(elapsedTime)}</span>}
          {isFinished && <span style={{ color: "var(--red)" }} className="animate-pulse hidden sm:inline">GENERANDO...</span>}
        </div>
      </header>

      {/* Banner insulto - advertencia */}
      {insultoWarning && !expelled && (
        <div className="border-b-2 border-black px-6 py-3 mono text-xs flex items-center gap-3" style={{ background: "var(--red)", color: "white" }}>
          <span className="text-base">⚠️</span>
          <span className="font-black">ADVERTENCIA — El entrevistador ha notado tu comportamiento. Una más y la entrevista termina.</span>
          <button onClick={() => setInsultoWarning(false)} className="ml-auto opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Banner expulsado */}
      {expelled && (
        <div className="border-b-4 border-black px-6 py-4 mono flex items-center gap-4" style={{ background: "var(--black)", color: "white" }}>
          <span className="text-2xl">🚫</span>
          <div>
            <div className="font-black text-sm uppercase tracking-widest">EXPULSADO DE LA ENTREVISTA</div>
            <div className="text-xs opacity-60 mt-0.5">Tu comportamiento ha sido inapropiado. El informe refleja lo ocurrido.</div>
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="border-b-2 border-black bg-black text-white px-6 py-2 mono text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
          {ivName} ESTÁ HABLANDO...
          <button onClick={stopSpeaking} className="ml-auto underline hover:no-underline">PARAR</button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto w-full">
        {!interviewStarted ? (
          <div className="animate-fade-in">
            <div className="border-2 border-black bg-white p-4 sm:p-8 mb-6">
              <div className="mono text-xs mb-4" style={{ color: "var(--red)" }}>— ENTREVISTADOR ASIGNADO</div>
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="text-4xl sm:text-6xl">{ivEmoji}</div>
                <div>
                  <div className="font-black text-4xl mb-1">{ivName}</div>
                  <div className="mono text-xs opacity-50 mb-3">
                    {interviewer === "alex" ? "SERIO · DIRECTO · SIN FILTROS" : "ENROLLADO · CERCANO · HONESTO"}
                  </div>
                  <div className="text-sm opacity-70 mb-4">
                    {interviewer === "alex"
                      ? "Va al grano. Si la respuesta es vaga, te lo dirá sin rodeos."
                      : "Ambiente relajado, puede hacer algún chiste. Pero evalúa igual de duro."}
                  </div>
                  <div className="border-2 border-black p-3 bg-white inline-block">
                    <div className="mono text-xs opacity-50 mb-2">MODO VOZ</div>
                    <button
                      onClick={() => setVoiceMode(v => !v)}
                      className="flex items-center gap-2 font-bold text-sm"
                      style={{ color: voiceMode ? "var(--red)" : "#aaa" }}
                    >
                      <div className="w-10 h-5 border-2 border-black relative transition-all" style={{ background: voiceMode ? "var(--black)" : "white" }}>
                        <div className="absolute top-0 w-4 h-full border-r-2 border-black transition-all" style={{ left: voiceMode ? "calc(100% - 1rem)" : "0", background: voiceMode ? "white" : "#ccc" }} />
                      </div>
                      {voiceMode ? "ACTIVADO — el entrevistador hablará en voz alta" : "DESACTIVADO — solo texto"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-black bg-white p-6 mb-6">
              <div className="mono text-xs mb-3 opacity-50">SOBRE ESTA ENTREVISTA</div>
              <div className="grid grid-cols-3 gap-4 text-center border-t border-black pt-4">
                <div>
                  <div className="font-black text-2xl">6–7</div>
                  <div className="mono text-xs opacity-50 mt-1">PREGUNTAS</div>
                </div>
                <div className="border-x border-black">
                  <div className="font-black text-2xl uppercase">{level}</div>
                  <div className="mono text-xs opacity-50 mt-1">NIVEL</div>
                </div>
                <div>
                  <div className="font-black text-2xl uppercase">{ROLE_LABELS[role] || role}</div>
                  <div className="mono text-xs opacity-50 mt-1">PUESTO</div>
                </div>
              </div>
            </div>

            {apiError && (
              <div className="border-2 border-black p-4 mb-4 mono text-xs" style={{ background: "var(--red)", color: "white" }}>
                <div className="font-black mb-1">ERROR DE CONEXIÓN</div>
                <div className="opacity-80">{apiError}</div>
              </div>
            )}

            <button onClick={startInterview} className="brutal-btn w-full py-4 text-base uppercase tracking-widest">
              Iniciar entrevista →
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`animate-fade-in border-2 border-black mb-3 ${msg.role === "user" ? "ml-8 sm:ml-24 mr-0" : "mr-8 sm:mr-24 ml-0"}`}
                style={{
                  background: msg.role === "assistant" ? "white" : "var(--black)",
                  color: msg.role === "assistant" ? "var(--black)" : "white",
                }}
              >
                <div
                  className="px-4 py-2 border-b-2 border-black mono text-xs flex items-center gap-2"
                  style={{
                    background: msg.role === "assistant" ? "var(--black)" : "var(--red)",
                    color: "white",
                  }}
                >
                  {msg.role === "assistant" ? `${ivEmoji} ${ivName}` : "👤 TÚ"}
                  {msg.role === "assistant" && voiceMode && (
                    <button
                      onClick={() => speak(msg.content)}
                      className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                      title="Reproducir"
                    >🔊</button>
                  )}
                  <span className="opacity-50 ml-auto">{i + 1}</span>
                </div>
                <div className="px-5 py-5 text-base leading-relaxed">
                  {msg.content}
                </div>
              </div>
            ))}

            {streamingText && (
              <div className="animate-fade-in border-2 border-black mb-3 mr-8 sm:mr-24" style={{ background: "white" }}>
                <div className="px-4 py-2 border-b-2 border-black mono text-xs bg-black text-white flex items-center gap-2">
                  {ivEmoji} {ivName}
                  <span className="ml-2 w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
                </div>
                <div className="px-5 py-5 text-base leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-2 h-4 ml-1 animate-blink align-middle" style={{ background: "var(--red)" }} />
                </div>
              </div>
            )}

            {isLoading && !streamingText && (
              <div className="border-2 border-black mb-3 mr-8 sm:mr-24" style={{ background: "white" }}>
                <div className="px-4 py-2 border-b-2 border-black mono text-xs bg-black text-white">
                  {ivEmoji} {ivName}
                </div>
                <div className="px-4 py-4 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {isGeneratingReport && (
              <div className="border-2 border-black p-6 text-center mono text-sm" style={{ background: "white" }}>
                <div className="font-black text-lg mb-1">ANALIZANDO ENTREVISTA</div>
                <div className="opacity-50 text-xs">Generando informe de evaluación...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {interviewStarted && !isFinished && (
        <div className="border-t-2 border-black bg-white px-4 py-4">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <div className="flex-1">
              <div className="mono text-xs mb-1 flex items-center justify-between">
                <span className="opacity-40">
                  TU RESPUESTA — ENTER PARA ENVIAR
                  {voiceMode && " · MICRÓFONO DISPONIBLE"}
                </span>
                {timerEnabled && !isLoading && (
                  <span
                    className="font-black tabular-nums"
                    style={{
                      color: timeExpired ? "var(--red)" : timeLeft <= 30 ? "var(--red)" : timeLeft <= 60 ? "#ca8a04" : "var(--black)",
                      animation: timeExpired ? "blink 0.5s step-end infinite" : "none",
                    }}
                  >
                    {timeExpired ? "⏱ TIEMPO" : `⏱ ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`}
                  </span>
                )}
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voiceMode ? "Escribe o usa el micrófono..." : "Escribe tu respuesta aquí..."}
                rows={3}
                disabled={isLoading && !isSpeaking}
                className="brutal-input w-full px-4 py-3 text-base"
                style={timeExpired ? { borderColor: "var(--red)", boxShadow: "3px 3px 0 var(--red)" } : {}}
              />
            </div>

            {/* Botón micrófono (solo en modo voz) */}
            {voiceMode && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className="brutal-btn px-4 py-3 text-xl h-fit disabled:opacity-30"
                style={{ background: isListening ? "var(--red)" : "var(--black)" }}
                title={isListening ? "Parar grabación" : "Hablar"}
              >
                {isListening ? "⏹" : "🎙"}
              </button>
            )}

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading || isSpeaking}
              className="brutal-btn px-5 py-3 text-sm uppercase tracking-widest h-fit"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center mono text-sm" style={{ background: "var(--bg)" }}>
        CARGANDO...
      </div>
    }>
      <InterviewContent />
    </Suspense>
  );
}
