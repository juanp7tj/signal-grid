import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* =========================================================
   Config
   ========================================================= */
const app = express();
const PORT = Number(process.env.PORT || 3000);

type Provider = "ollama" | "openai-compatible";
type AnalysisMode = "single" | "compare";

const AI_PROVIDER: Provider =
  (process.env.AI_PROVIDER as Provider) === "openai-compatible"
    ? "openai-compatible"
    : "ollama";

// Ollama
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";

// OpenAI-compatible (Groq, DeepSeek, OpenAI, etc.)
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.groq.com/openai").replace(/\/+$/, "");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "openai/gpt-oss-120b";

const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 300_000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* =========================================================
   Tipos
   ========================================================= */
type ProfileInput = {
  name: string;
  url: string;
  niche: string;
  audience: string;
  objective: string;
};

type Settings = {
  language?: string;
  tone?: string;
  model?: string;
};

type ActionItem = {
  priority: "Alta" | "Média" | "Baixa";
  title: string;
  reason: string;
  steps: string[];
  metric: string;
  deadline: string;
  owner: string;
  kpi: string;
};

/* =========================================================
   Validação / sanitização
   ========================================================= */
function safeProfile(value: unknown): ProfileInput {
  const p = (value && typeof value === "object" ? value : {}) as Partial<ProfileInput>;
  return {
    name: String(p.name || "Perfil").slice(0, 100),
    url: String(p.url || "").slice(0, 500),
    niche: String(p.niche || "").slice(0, 300),
    audience: String(p.audience || "").slice(0, 300),
    objective: String(p.objective || "").slice(0, 200),
  };
}

function isInstagramUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return host === "instagram.com" || host === "www.instagram.com";
  } catch {
    return false;
  }
}

/* =========================================================
   Relatório demonstrativo (single + compare)
   ========================================================= */
function demoReport(a: ProfileInput, b: ProfileInput | null) {
  const single = !b;
  const profileB = b || a;

  const base = {
    title: single
      ? `Diagnóstico estratégico: ${a.name}`
      : `Diagnóstico competitivo: ${a.name} vs ${profileB.name}`,
    summary: single
      ? "Resultado demonstrativo. Nenhum dado real do perfil foi extraído; notas e observações são ilustrativas."
      : "Resultado demonstrativo. Nenhum dado real dos perfis foi extraído; notas e observações são ilustrativas.",
    analysisMode: single ? ("single" as const) : ("compare" as const),
    opportunities: [
      {
        title: "Organizar pilares editoriais",
        description:
          "Agrupe conteúdos em temas recorrentes alinhados ao público e objetivo.",
        impact: "Alto",
      },
      {
        title: "Padronizar chamadas para ação",
        description:
          "Defina uma ação principal por conteúdo e relacione-a ao objetivo comercial.",
        impact: "Alto",
      },
      {
        title: "Medir o desempenho com rotina",
        description: "Compare formatos e temas usando métricas disponíveis.",
        impact: "Médio",
      },
    ],
    caveats: [
      "Modo demonstrativo: as notas não são baseadas em métricas reais.",
      "O MVP não acessa Instagram nem realiza scraping. URLs são usadas como referência textual.",
      "Forneça evidências públicas ou dados autorizados para melhorar a qualidade da análise.",
    ],
    generatedAt: new Date().toISOString(),
    mode: "demo" as const,
  };

  const scoreA = {
    profileName: a.name,
    overall: 7.4,
    content: 8.0,
    consistency: 6.8,
    positioning: 7.6,
    engagement: 7.1,
    strengths: [
      "Preencha evidências concretas para identificar forças reais.",
      "Use exemplos de publicações para avaliar consistência.",
      "Dê contexto sobre formatos e frequência para notas precisas.",
    ],
    weaknesses: [
      "Dados insuficientes para confirmar diferenciais.",
      "Conversão não pode ser inferida apenas pela URL.",
    ],
    evidence: [
      "URL fornecida: " + a.url,
      "Nicho: " + (a.niche || "não informado"),
    ],
  };

  const scoreB = {
    profileName: profileB.name,
    overall: 6.5,
    content: 6.9,
    consistency: 6.1,
    positioning: 6.7,
    engagement: 6.3,
    strengths: [
      "Preencha evidências concretas para identificar forças reais.",
      "Use exemplos de publicações para avaliar consistência.",
    ],
    weaknesses: [
      "Dados insuficientes para confirmar diferenciais.",
      "Conversão não pode ser inferida apenas pela URL.",
    ],
    evidence: [
      "URL fornecida: " + profileB.url,
      "Nicho: " + (profileB.niche || "não informado"),
    ],
  };

  const actionsA: ActionItem[] = [
    {
      priority: "Alta",
      title: "Mapear conteúdos de melhor desempenho dos últimos 90 dias",
      reason: "Criar uma linha de base antes de alterar a estratégia.",
      steps: [
        "Listar os 12 conteúdos recentes",
        "Registrar formato, tema e CTA",
        "Anotar métricas públicas ou fornecidas pelo cliente",
      ],
      metric: "Planilha de auditoria preenchida",
      deadline: "7 dias",
      owner: "Social Media",
      kpi: "12 conteúdos classificados",
    },
    {
      priority: "Alta",
      title: "Definir três pilares editoriais",
      reason: "Aumentar a clareza da mensagem e a repetibilidade da produção.",
      steps: [
        "Escolher três temas ligados ao posicionamento",
        "Criar duas pautas por tema",
        "Associar cada pauta a um objetivo",
      ],
      metric: "Seis pautas aprovadas",
      deadline: "14 dias",
      owner: "Estrategista",
      kpi: "6 pautas no calendário",
    },
  ];

  const actionsB: ActionItem[] = [
    {
      priority: "Alta",
      title: "Executar testes de CTA",
      reason: "Descobrir quais chamadas levam à ação desejada.",
      steps: [
        "Criar duas variações de CTA",
        "Manter o tema comparável",
        "Revisar resultados após o período definido",
      ],
      metric: "Resultados registrados por variação",
      deadline: "30 dias",
      owner: "Social Media",
      kpi: "CTA vencedor com margem ≥ 20%",
    },
    {
      priority: "Média",
      title: "Padronizar identidade visual",
      reason: "Marca reconhecível aumenta memorização e alcance.",
      steps: ["Definir paleta e fontes", "Aplicar em 10 posts seguintes"],
      metric: "Paleta aplicada em 10 posts",
      deadline: "30 dias",
      owner: "Designer + Social Media",
      kpi: "+10% de alcance médio em 30 dias",
    },
  ];

  if (single) {
    return {
      ...base,
      profiles: [scoreA],
      actionPlan: [...actionsA, ...actionsB].slice(0, 4),
    };
  }

  return {
    ...base,
    ranking: [a.name, profileB.name],
    profiles: [scoreA, scoreB],
    actionPlanA: actionsA,
    actionPlanB: actionsB,
  };
}

/* =========================================================
   Schema — modo comparação
   ========================================================= */
const schemaCompare = {
  title: "Diagnóstico competitivo: [Perfil A] vs [Perfil B]",
  summary: "<Parágrafo de 3 a 5 frases sobre ESTES perfis, citando nomes e evidências fornecidas>",
  ranking: ["<Nome do perfil líder>", "<Nome do segundo perfil>"],
  profiles: [
    {
      profileName: "<NOME EXATO DO PERFIL A>",
      overall: 7.4,
      content: 8.0,
      consistency: 6.5,
      positioning: 7.8,
      engagement: 7.1,
      strengths: ["<Força específica do Perfil A>", "<Outra força>"],
      weaknesses: ["<Fraqueza específica do Perfil A>"],
      evidence: ["<Fato do briefing sobre Perfil A>"],
    },
    {
      profileName: "<NOME EXATO DO PERFIL B>",
      overall: 6.2,
      content: 6.5,
      consistency: 5.8,
      positioning: 6.8,
      engagement: 5.7,
      strengths: ["<Força específica do Perfil B>"],
      weaknesses: ["<Fraqueza específica do Perfil B>"],
      evidence: ["<Fato do briefing sobre Perfil B>"],
    },
  ],
  opportunities: [
    { title: "<Jogada concreta>", description: "<Descrição>", impact: "Alto" },
    { title: "<Segunda>", description: "<Descrição>", impact: "Médio" },
    { title: "<Terceira>", description: "<Descrição>", impact: "Baixo" },
  ],
  actionPlanA: [
    {
      priority: "Alta",
      title: "<Ação específica para o Perfil A>",
      reason: "<Motivo>",
      steps: ["<Passo 1>", "<Passo 2>", "<Passo 3>"],
      metric: "<Métrica>",
      deadline: "7 dias",
      owner: "<Função>",
      kpi: "<KPI mensurável>",
    },
  ],
  actionPlanB: [
    {
      priority: "Alta",
      title: "<Ação específica para o Perfil B>",
      reason: "<Motivo>",
      steps: ["<Passo 1>", "<Passo 2>", "<Passo 3>"],
      metric: "<Métrica>",
      deadline: "7 dias",
      owner: "<Função>",
      kpi: "<KPI mensurável>",
    },
  ],
  caveats: ["<Limitação>", "<Outra premissa>"],
  generatedAt: new Date().toISOString(),
  mode: "ollama",
};

/* =========================================================
   Schema — modo único
   ========================================================= */
const schemaSingle = {
  title: "Diagnóstico estratégico: [Nome do Perfil]",
  summary: "<Parágrafo de 3 a 5 frases sobre ESTE perfil, citando nome e evidências fornecidas>",
  profiles: [
    {
      profileName: "<NOME EXATO DO PERFIL>",
      overall: 7.4,
      content: 8.0,
      consistency: 6.5,
      positioning: 7.8,
      engagement: 7.1,
      strengths: ["<Força específica>", "<Outra força>", "<Terceira força>"],
      weaknesses: ["<Fraqueza específica>", "<Outra fraqueza>"],
      evidence: ["<Fato do briefing>", "<Outro fato>"],
    },
  ],
  opportunities: [
    { title: "<Jogada concreta>", description: "<Descrição>", impact: "Alto" },
    { title: "<Segunda>", description: "<Descrição>", impact: "Alto" },
    { title: "<Terceira>", description: "<Descrição>", impact: "Médio" },
  ],
  actionPlan: [
    {
      priority: "Alta",
      title: "<Ação específica começando com verbo>",
      reason: "<Motivo>",
      steps: ["<Passo 1>", "<Passo 2>", "<Passo 3>"],
      metric: "<Métrica>",
      deadline: "7 dias",
      owner: "<Função>",
      kpi: "<KPI mensurável>",
    },
    {
      priority: "Alta",
      title: "<Segunda ação>",
      reason: "<Motivo>",
      steps: ["<Passo 1>", "<Passo 2>"],
      metric: "<Métrica>",
      deadline: "14 dias",
      owner: "<Função>",
      kpi: "<KPI mensurável>",
    },
    {
      priority: "Média",
      title: "<Terceira ação>",
      reason: "<Motivo>",
      steps: ["<Passo 1>", "<Passo 2>"],
      metric: "<Métrica>",
      deadline: "30 dias",
      owner: "<Função>",
      kpi: "<KPI mensurável>",
    },
  ],
  caveats: ["<Limitação>", "<Outra premissa>"],
  generatedAt: new Date().toISOString(),
  mode: "ollama",
};

/* =========================================================
   Extração robusta de JSON
   ========================================================= */
function extractJson(raw: string): unknown {
  const clean = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw new Error("O modelo não retornou JSON válido.");
  }
}

/* =========================================================
   Health check (público) — versão minimalista
   ========================================================= */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

/* =========================================================
   Debug interno — só em desenvolvimento
   ========================================================= */
if (process.env.NODE_ENV !== "production") {
  app.get("/api/_debug/health", async (_req, res) => {
    const providerInfo = {
      provider: AI_PROVIDER,
      baseUrl: AI_PROVIDER === "ollama" ? OLLAMA_BASE_URL : OPENAI_BASE_URL,
      model: AI_PROVIDER === "ollama" ? OLLAMA_MODEL : OPENAI_MODEL,
    };

    try {
      if (AI_PROVIDER === "ollama") {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
          headers: OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {},
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`Ollama respondeu HTTP ${response.status}`);
        const body = (await response.json()) as { models?: { name: string }[] };
        return res.json({
          ok: true,
          ...providerInfo,
          models: body.models?.map((m) => m.name) || [],
        });
      } else {
        if (!OPENAI_API_KEY) {
          return res.status(503).json({
            ok: false,
            ...providerInfo,
            error: "OPENAI_API_KEY não configurada no .env",
          });
        }
        const response = await fetch(`${OPENAI_BASE_URL}/v1/models`, {
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
          throw new Error(`Provider respondeu HTTP ${response.status}`);
        }
        const body = (await response.json()) as { data?: { id: string }[] };
        return res.json({
          ok: true,
          ...providerInfo,
          models: body.data?.map((m) => m.id) || [],
        });
      }
    } catch (error) {
      return res.status(503).json({
        ok: false,
        ...providerInfo,
        error: error instanceof Error ? error.message : "Provider indisponível",
      });
    }
  });
}

/* =========================================================
   Análise
   ========================================================= */
app.post("/api/analyze", async (req, res) => {
  const analysisMode: AnalysisMode =
    req.body?.analysisMode === "single" ? "single" : "compare";

  const a = safeProfile(req.body?.profileA);
  const b = analysisMode === "compare" ? safeProfile(req.body?.profileB) : null;
  const settings = (req.body?.settings || {}) as Settings;
  const evidence = String(req.body?.evidence || "").slice(0, 12_000);
  const forceDemo = Boolean(req.body?.demoMode);

  if (!isInstagramUrl(a.url)) {
    return res
      .status(400)
      .json({ error: "Informe uma URL HTTPS válida de perfil do Instagram." });
  }
  if (analysisMode === "compare" && (!b || !isInstagramUrl(b.url))) {
    return res
      .status(400)
      .json({ error: "Informe a URL HTTPS do segundo perfil." });
  }

  if (forceDemo) {
    return res.json(demoReport(a, b));
  }

  const language = settings.language || "Português (Brasil)";
  const tone = settings.tone || "Direto e estratégico";

  const model =
    AI_PROVIDER === "ollama"
      ? String(OLLAMA_MODEL).slice(0, 100)
      : String(OPENAI_MODEL).slice(0, 100);

  console.log(`[analyze] mode=${analysisMode} provider=${AI_PROVIDER} model=${model}`);

  const schema = analysisMode === "single" ? schemaSingle : schemaCompare;

  const rulesBlock =
    analysisMode === "single"
      ? `
13. O array "profiles" deve ter EXATAMENTE 1 item.
14. NÃO inclua o campo "ranking".
15. Retorne um plano de ação no campo "actionPlan" (array) com 3 a 5 ações.
16. Cada ação deve ser específica para ESTE perfil.
17. NÃO retorne "actionPlanA" nem "actionPlanB".`
      : `
13. Você DEVE retornar DOIS planos de ação distintos: "actionPlanA" e "actionPlanB".
14. Cada plano deve ter de 2 a 4 ações ÚNICAS e ESPECÍFICAS.
15. Cada ação do "actionPlanA" resolve um problema do PERFIL A.
16. Cada ação do "actionPlanB" resolve um problema do PERFIL B.
17. NÃO gere ações genéricas.`;

  const validations =
    analysisMode === "single"
      ? `- O array "profiles" deve ter EXATAMENTE 1 item.
- O campo "actionPlan" deve ter de 3 a 5 ações.
- NÃO retorne "ranking", "actionPlanA" nem "actionPlanB".`
      : `- O array "profiles" deve ter EXATAMENTE 2 itens, na ordem fornecida.
- "ranking" contém os dois nomes ordenados por "overall" decrescente.
- "actionPlanA" e "actionPlanB" devem ter CADA UM entre 2 e 4 ações.
- As ações de A e B devem ser DIFERENTES entre si.`;

  const systemIntro =
    analysisMode === "single"
      ? "Você é um estrategista sênior de social media que assessora agências. Sua tarefa é produzir um diagnóstico ESTRATÉGICO COMPLETO de UM perfil do Instagram usando SOMENTE o briefing e as evidências fornecidas pelo usuário."
      : "Você é um estrategista sênior de social media que assessora agências. Sua tarefa é produzir um diagnóstico COMPARATIVO entre dois perfis do Instagram usando SOMENTE o briefing e as evidências fornecidas pelo usuário.";

  const system = `${systemIntro}

REGRAS INVIOLÁVEIS:
1. Nunca invente métricas, números de seguidores, curtidas ou fatos que não estejam no briefing.
2. Nunca finja ter visitado as URLs. URLs são apenas referências textuais.
3. Se um dado não foi fornecido, escreva "não informado" e reduza a nota para 5.0 explicando a baixa confiança.
4. Toda nota deve ter pelo menos UMA evidência concreta associada.
5. Hipóteses devem ser explicitamente marcadas com a palavra "Hipótese:".
6. Nunca afirme ter feito scraping.

REGRAS DE QUALIDADE:
7. PROIBIDO usar frases genéricas. Toda recomendação deve ser ESPECÍFICA e MENSURÁVEL.
8. PROIBIDO usar advérbios vagos. Use números: "4x/semana", "80% dos posts".
9. SEMPRE cite formato (Reels, Carrossel, Stories), frequência, tema e CTA.
10. Cada força/fraqueza deve ser uma FRASE COMPLETA com sujeito + verbo + dado.
11. Cada ação deve ter: título específico, razão, 3-5 etapas, métrica, PRAZO, RESPONSÁVEL e KPI.
12. Cada oportunidade deve descrever uma jogada concreta — não um tema.

REGRAS ESPECÍFICAS DO MODO (${analysisMode === "single" ? "ANÁLISE ÚNICA" : "COMPARAÇÃO"}):
${rulesBlock}

TOM: ${tone}.
IDIOMA: ${language}.

FORMATO DE SAÍDA:
Responda SOMENTE com JSON válido (sem markdown, sem texto antes ou depois):
${JSON.stringify(schema)}

VALIDAÇÕES FINAIS:
${validations}
- "summary" deve ter entre 3 e 5 frases, citando explicitamente ${analysisMode === "single" ? "o perfil" : "os dois perfis"} pelo nome.`;

  const user =
    analysisMode === "single"
      ? {
          profile: a,
          context: {
            niche: a.niche || "não informado",
            audience: a.audience || "não informado",
            objective: a.objective || "não informado",
            evidenceProvidedByUser: evidence || "Nenhuma evidência adicional fornecida.",
          },
          task: "Gere um diagnóstico estratégico completo deste perfil: forças, fraquezas, oportunidades e plano de ação específico. Não trate a URL como conteúdo acessado.",
        }
      : {
          profileA: a,
          profileB: b,
          context: {
            niche: a.niche || b?.niche || "não informado",
            audience: a.audience || b?.audience || "não informado",
            objective: a.objective || b?.objective || "não informado",
            evidenceProvidedByUser: evidence || "Nenhuma evidência adicional fornecida.",
          },
          task: "Compare os perfis, identifique diferenças e oportunidades acionáveis. Não trate a URL como conteúdo acessado.",
        };

  try {
    const content = await callProvider({ model, system, user });
    const parsed = extractJson(content);
    const report = normalizeReport(parsed, a, b, analysisMode);
    return res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[analyze] erro: ${message}`);
    return res.status(502).json({
      error: `Não foi possível concluir a análise. ${message}`,
      hint:
        AI_PROVIDER === "ollama"
          ? "Verifique se o Ollama está aberto, se o modelo foi baixado e se OLLAMA_BASE_URL está correto."
          : "Verifique sua OPENAI_API_KEY, o saldo da conta e se OPENAI_BASE_URL está correto.",
    });
  }
});

/* =========================================================
   Chamada unificada ao provider
   ========================================================= */
async function callProvider(args: {
  model: string;
  system: string;
  user: unknown;
}): Promise<string> {
  const { model, system, user } = args;

  if (AI_PROVIDER === "ollama") {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) },
        ],
        options: { temperature: 0.5 },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${details.slice(0, 400)}`);
    }
    const body = (await response.json()) as { message?: { content?: string } };
    if (!body.message?.content) {
      throw new Error("Ollama retornou uma resposta vazia.");
    }
    return body.message.content;
  }

  // OpenAI-compatible (Groq, DeepSeek, OpenAI…)
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada no .env");
  }

  const url = `${OPENAI_BASE_URL}/v1/chat/completions`;
  console.log(`[callProvider] POST ${url} model=${model}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Provider HTTP ${response.status}: ${details.slice(0, 400)}`
    );
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Provider retornou uma resposta vazia.");
  }
  return content;
}

/* =========================================================
   Normalização do relatório
   ========================================================= */
function normalizeReport(
  raw: unknown,
  a: ProfileInput,
  b: ProfileInput | null,
  analysisMode: AnalysisMode
) {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const num = (v: unknown, fallback = 5): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : fallback;
  };

  const list = (v: unknown, fallback: string[] = []): string[] =>
    Array.isArray(v) ? v.map(String).slice(0, 12) : fallback;

  const rawProfiles = Array.isArray(r.profiles) ? (r.profiles as unknown[]) : [];

  // Lista de inputs: 1 perfil (single) ou 2 perfis (compare)
  const inputs: ProfileInput[] =
    analysisMode === "single" || !b ? [a] : [a, b];

  const normalizedProfiles = inputs.map((p, i) => {
    const item = (rawProfiles[i] as Record<string, unknown>) || {};
    return {
      profileName: p.name,
      overall: num(item.overall),
      content: num(item.content),
      consistency: num(item.consistency),
      positioning: num(item.positioning),
      engagement: num(item.engagement),
      strengths: list(item.strengths, ["Dados insuficientes"]),
      weaknesses: list(item.weaknesses, ["Dados insuficientes"]),
      evidence: list(item.evidence, ["Nenhuma evidência concreta retornada."]),
    };
  });

  const opportunities = Array.isArray(r.opportunities)
    ? (r.opportunities as Record<string, unknown>[]).slice(0, 6).map((o) => ({
        title: String(o.title || "Oportunidade"),
        description: String(o.description || ""),
        impact: ["Alto", "Médio", "Baixo"].includes(String(o.impact))
          ? (o.impact as string)
          : "Médio",
      }))
    : [];

  const normalizeAction = (o: Record<string, unknown>): ActionItem => ({
    priority: ["Alta", "Média", "Baixa"].includes(String(o.priority))
      ? (o.priority as ActionItem["priority"])
      : "Média",
    title: String(o.title || "Ação"),
    reason: String(o.reason || ""),
    steps: list(o.steps),
    metric: String(o.metric || "Revisão concluída"),
    deadline: String(o.deadline || "30 dias"),
    owner: String(o.owner || "Social Media"),
    kpi: String(o.kpi || "A definir"),
  });

  // ----- MODO ÚNICO -----
  if (analysisMode === "single") {
    const actionPlan: ActionItem[] = Array.isArray(r.actionPlan)
      ? (r.actionPlan as Record<string, unknown>[]).slice(0, 6).map(normalizeAction)
      : [];

    return {
      title: String(r.title || `Diagnóstico estratégico: ${a.name}`),
      summary: String(r.summary || "Diagnóstico gerado pelo agente."),
      analysisMode: "single" as const,
      profiles: normalizedProfiles,
      opportunities,
      actionPlan,
      caveats: list(r.caveats, ["A análise depende das evidências fornecidas."]),
      generatedAt: new Date().toISOString(),
      mode: AI_PROVIDER,
    };
  }

  // ----- MODO COMPARAÇÃO -----
  const actionPlanA: ActionItem[] = Array.isArray(r.actionPlanA)
    ? (r.actionPlanA as Record<string, unknown>[]).slice(0, 5).map(normalizeAction)
    : [];

  const actionPlanB: ActionItem[] = Array.isArray(r.actionPlanB)
    ? (r.actionPlanB as Record<string, unknown>[]).slice(0, 5).map(normalizeAction)
    : [];

  if (actionPlanA.length === 0 && actionPlanB.length === 0 && Array.isArray(r.actionPlan)) {
    const all = (r.actionPlan as Record<string, unknown>[]).slice(0, 8).map(normalizeAction);
    const half = Math.ceil(all.length / 2);
    actionPlanA.push(...all.slice(0, half));
    actionPlanB.push(...all.slice(half));
  }

  const ranking = [
    normalizedProfiles[0]!.profileName,
    normalizedProfiles[1]!.profileName,
  ].sort((x, y) => {
    const px = normalizedProfiles.find((p) => p.profileName === x);
    const py = normalizedProfiles.find((p) => p.profileName === y);
    const sx = px?.overall || 0;
    const sy = py?.overall || 0;

    // 1) Maior nota primeiro
    if (sy !== sx) return sy - sx;

    // 2) Empate: Perfil A (referência) vem primeiro
    if (x === a.name) return -1;
    if (y === a.name) return 1;

    // 3) Desempate final: ordem alfabética
    return x.localeCompare(y);
  });

  return {
    title: String(r.title || "Diagnóstico competitivo"),
    summary: String(r.summary || "Comparação qualitativa gerada pelo agente."),
    analysisMode: "compare" as const,
    ranking,
    profiles: normalizedProfiles,
    opportunities,
    actionPlanA,
    actionPlanB,
    caveats: list(r.caveats, ["A análise depende das evidências fornecidas."]),
    generatedAt: new Date().toISOString(),
    mode: AI_PROVIDER,
  };
}

/* =========================================================
   Servir o frontend (produção)
   ========================================================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../dist");

app.use(express.static(clientDist));

app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (error) => {
    if (error) next();
  });
});

/* =========================================================
   Start
   ========================================================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Signal Grid em http://localhost:${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🧠 Provider: ${AI_PROVIDER}`);
  if (AI_PROVIDER === "ollama") {
    console.log(`   └ Ollama: ${OLLAMA_BASE_URL} (modelo: ${OLLAMA_MODEL})`);
  } else {
    console.log(`   └ OpenAI-compatible: ${OPENAI_BASE_URL} (modelo: ${OPENAI_MODEL})`);
    console.log(`   └ API key: ${OPENAI_API_KEY ? "configurada ✅" : "FALTANDO ❌"}`);
  }
});