import Groq from "groq-sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";

const ROLE_LABELS: Record<string, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  data: "Data Scientist",
  devops: "DevOps / SRE",
  mobile: "Mobile Developer",
};

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior (0-2 años)",
  mid: "Mid-level (2-5 años)",
  senior: "Senior (5+ años)",
};

const TOPIC_POOLS: Record<string, string[]> = {
  frontend: ["CSS avanzado y layout", "rendimiento y Core Web Vitals", "accesibilidad web (a11y)", "TypeScript en React", "testing con Jest/RTL", "gestión de estado global", "Web APIs del navegador", "seguridad XSS/CSRF", "bundlers y optimización", "patrones de diseño en JS", "HTML semántico", "animaciones CSS/JS", "módulos ES y tree-shaking"],
  backend: ["diseño de APIs REST", "bases de datos relacionales", "caching y Redis", "autenticación y JWT", "microservicios", "testing de integración", "CI/CD", "seguridad OWASP", "manejo de errores", "escalabilidad", "mensajería async", "SQL avanzado"],
  fullstack: ["arquitectura MVC/MVP", "SSR vs CSR", "APIs GraphQL", "DevOps básico", "bases de datos NoSQL", "autenticación OAuth", "websockets", "monorepos", "testing E2E", "rendimiento full-stack"],
  data: ["limpieza de datos", "ML supervisado", "visualización", "SQL avanzado", "Python para datos", "pipelines ETL", "estadística aplicada", "feature engineering"],
  devops: ["contenedores Docker", "Kubernetes", "CI/CD pipelines", "monitoring y alertas", "IaC con Terraform", "redes y DNS", "seguridad en cloud", "scripting bash"],
  mobile: ["ciclo de vida de componentes", "navegación", "estado local vs global", "rendimiento en móvil", "APIs nativas", "testing en emuladores", "publicación en stores"],
};

function getRandomTopic(role: string): string {
  const pool = TOPIC_POOLS[role] || TOPIC_POOLS.frontend;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildSystemPrompt(
  role: string,
  level: string,
  interviewer: string,
  noFeedback = false,
  softskills = false,
  lang = "es"
): string {
  const isAlex = interviewer === "alex";

  const personality = isAlex
    ? `Eres Alex, un entrevistador técnico senior serio y directo. Vas al grano, no pierdes el tiempo con respuestas vagas y si el candidato falla, se lo dices claramente sin suavizarlo. Eres profesional pero frío. No haces chistes. Exiges precisión en las respuestas.`
    : `Eres Pau, un Tech Lead enrollado y cercano. Tratas al candidato de tú a tú, haces algún comentario gracioso de vez en cuando, y creas un ambiente relajado. Pero eso no significa que no evalúes bien: eres igual de riguroso técnicamente, solo que lo comunicas de forma más amigable y natural.`;

  const feedbackRule = noFeedback
    ? `- NO evalúes ni comentes las respuestas del candidato entre preguntas. Escucha la respuesta y pasa directamente a la siguiente pregunta sin dar feedback. Sé breve en la transición.`
    : `- Después de cada respuesta del candidato, evalúa brevemente (2-3 frases) su respuesta: qué estuvo bien, qué le faltó.`;

  const softskillsRule = softskills
    ? `- Incluye 1-2 preguntas conductuales sobre trabajo en equipo, gestión de conflictos, comunicación o adaptación. Ponlas intercaladas entre las técnicas.`
    : ``;

  return `${personality}
IDIOMA: Habla siempre en español de España. Usa "tú" (nunca "vos"). Usa expresiones y vocabulario propios de España. Evita cualquier expresión o giro latinoamericano.

Estás entrevistando a un candidato para el puesto de ${ROLE_LABELS[role] || role} con nivel ${LEVEL_LABELS[level] || level}.

REGLAS IMPORTANTES:
- Haz UNA sola pregunta a la vez. Nunca hagas varias preguntas seguidas.
${feedbackRule}
- Luego haz la siguiente pregunta. Varía entre preguntas teóricas, prácticas y de resolución de problemas.
- Adapta la dificultad al nivel indicado.
- Si la respuesta es muy vaga o incorrecta, puedes hacer una pregunta de seguimiento antes de pasar al siguiente tema.
${softskillsRule}
- TEMA OBLIGATORIO para empezar esta entrevista: "${getRandomTopic(role)}". Tu primera pregunta DEBE ser sobre este tema.
- Nunca repitas preguntas que ya hayas hecho en esta misma entrevista. Varía siempre el enfoque y el tema entre preguntas.
- Después de 6-7 preguntas, indica que la entrevista ha terminado.
- Para indicar el fin de entrevista escribe exactamente: [ENTREVISTA_FINALIZADA]

COMPORTAMIENTO ANTE INSULTOS O FALTAS DE RESPETO:
- Si el candidato te insulta, te falta al respeto o usa lenguaje ofensivo, reacciona con indignación según tu personalidad (Alex: frío y cortante; Pau: decepcionado y directo) y avísale de que tiene una última oportunidad. Añade el token [INSULTO_DETECTADO] al final de tu respuesta, después de todo el texto.
- Si el candidato vuelve a insultarte o faltarte al respeto después del aviso, reacciona furioso/decepcionado, termina la entrevista inmediatamente y añade [EXPULSADO][ENTREVISTA_FINALIZADA] al final de tu respuesta.

Empieza presentándote con tu personalidad y haciendo la primera pregunta técnica.${lang === "en" ? "\n\nIMPORTANT: Conduct the ENTIRE interview in English. All your messages must be in English." : ""}`;
}

function buildFeedbackPrompt(
  role: string,
  level: string,
  transcript: string,
  expelled = false,
  softskills = false,
  lang = "es"
): string {
  const expelledNote = expelled
    ? `\nIMPORTANTE: El candidato fue EXPULSADO de la entrevista por insultar al entrevistador. La puntuación máxima posible es 15/100. El verdict debe ser RECHAZAR. En el summary y recommendation menciona explícitamente que fue expulsado por comportamiento inapropiado.\n`
    : "";

  const softskillsCategory = softskills
    ? `,\n    { "name": "Softskills / Equipo", "score": <0-100>, "comment": "<valoración de sus respuestas conductuales>" }`
    : "";

  const langNote = lang === "en"
    ? "Write ALL report content (summary, comments, strengths, improvements, studyTopics, recommendation) in English."
    : "Escribe todo el contenido del informe en español.";

  return `Eres un evaluador de RR.HH. técnico. Analiza la siguiente transcripción de entrevista para el puesto de ${ROLE_LABELS[role] || role} (nivel ${LEVEL_LABELS[level] || level}) y genera un informe de evaluación detallado. ${langNote}
${expelledNote}
TRANSCRIPCIÓN:
${transcript}

Genera el informe en el siguiente formato JSON exacto (sin markdown, solo JSON puro):
{
  "overallScore": <número del 0 al 100>,
  "verdict": "<CONTRATAR | CONSIDERAR | RECHAZAR>",
  "summary": "<resumen ejecutivo de 2-3 frases>",
  "categories": [
    { "name": "Conocimiento Técnico", "score": <0-100>, "comment": "<comentario corto>" },
    { "name": "Comunicación", "score": <0-100>, "comment": "<comentario corto>" },
    { "name": "Resolución de Problemas", "score": <0-100>, "comment": "<comentario corto>" },
    { "name": "Profundidad de Respuestas", "score": <0-100>, "comment": "<comentario corto>" }${softskillsCategory}
  ],
  "strengths": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "improvements": ["<área de mejora 1>", "<área de mejora 2>", "<área de mejora 3>"],
  "studyTopics": ["<concepto o tecnología concreta a estudiar 1>", "<concepto 2>", "<concepto 3>", "<concepto 4>"],
  "recommendation": "<recomendación detallada de 3-4 frases para el candidato>"
}`;
}

export async function POST(req: NextRequest) {
  const {
    messages,
    role,
    level,
    mode,
    interviewer = "alex",
    expelled = false,
    noFeedback = false,
    softskills = false,
    lang = "es",
  } = await req.json();

  if (mode === "feedback") {
    const transcript = messages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Candidato" : "Entrevistador"}: ${m.content}`)
      .join("\n\n");

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        { role: "user", content: buildFeedbackPrompt(role, level, transcript, expelled, softskills, lang) },
      ],
    });

    return Response.json({ content: response.choices[0].message.content });
  }

  // Streaming para la entrevista en tiempo real
  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 600,
    temperature: 1.2,
    stream: true,
    messages: [
      { role: "system", content: buildSystemPrompt(role, level, interviewer, noFeedback, softskills, lang) },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
