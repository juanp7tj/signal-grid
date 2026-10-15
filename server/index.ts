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
   Relatório demonstrativo
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
        description:
          "Compare formatos e temas usando métricas disponíveis.",
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

  const profileA_Score = {
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

  const profileB_Score = {
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
      profiles: [profileA_Score],
      actionPlan: [...actionsA, ...actionsB].slice(0, 4),
    };
  }

  return {
    ...base,
    ranking: [a.name, profileB.name],
    profiles: [profileA_Score, profileB_Score],
    actionPlanA: actionsA,
    actionPlanB: actionsB,
  };
}

/* =========================================================
   Schema de exemplo para o prompt
   ========================================================= */
const schemaExample = {
  title: "<Título curto: 'Diagnóstico [estratégico/competitivo]: [Nome A] [vs [Nome B]]'>",
  summary:
    "<Parágrafo de 3 a 5 frases sobre ESTES perfis, citando nomes e evidências fornecidas>",
  ranking: ["<Nome do perfil líder>", "<Nome do segundo perfil (APENAS no modo compare)>"],
  profiles: [
    {
      profileName: "<NOME EXATO do perfil fornecido>",
      overall: 7.4,
      content: 8.0,
      consistency: 6.5,
      positioning: 7.8,
      engagement: 7.1,
      strengths: [
        "<Frase sobre o perfil citando formato/frequência/número do briefing>",
        "<Outra força específica>",
      ],
      weaknesses: [
        "<Fraqueza específica com dado concreto>",
        "<Outra fraqueza específica>",
      ],
      evidence: [
        "<Fato do briefing>",
        "<Outro fato do briefing>",
      ],
    },
  ],
  opportunities: [
    {
      title: "<Jogada concreta para estes perfis>",
      description: "<Descrição específica citando contexto do briefing>",
      impact: "Alto",
    },
    {
      title: "<Segunda oportunidade>",
      description: "<Descrição específica>",
      impact: "Alto",
    },
    {
      title: "<Terceira oportunidade>",
      description: "<Descrição específica>",
      impact: "Médio",
    },
  ],
  actionPlan: [
    {
      priority: "Alta",
      title: "<Ação específica, começando com verbo no infinitivo>",
      reason: "<Por que essa ação faz sentido>",
      steps: ["<Passo 1>", "<Passo 2>", "<Passo 3>"],
      metric: "<Como medir a conclusão>",
      deadline: "7 dias",
      owner: "<Função responsável>",
      kpi: "<KPI mensurável com número>",
    },
  ],
  actionPlanA: [
    {
      priority: "Alta",
      title: "<Ação específica para o PERFIL A>",
      reason: "<Motivo específico para o Perfil A>",
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
      title: "<Ação específica para o PERFIL B>",
      reason: "<Motivo específico para o Perfil B>",
      steps: ["<Passo 1>", "<Passo 2>", "<Passo 3>"],
      metric: "<Métrica>",
      deadline: "7 dias",
      owner: "<Função>",
      kpi: "<KPI mensurável>",
    },
  ],
  caveats: [
    "<Limitação específica desta análise>",
    "<Outra premissa importante>",
  ],
  generatedAt: new Date().toISOString(),
  mode: AI_PROVIDER,
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
   Health check
   ========================================================= */
app.get("/api/health", async (_req, res) => {
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

/* =========================================================
   Análise
   ========================================================= */
type AnalysisMode = "single" | "compare";
   app.post("/api/analyze", async (req, res) => {
  const analysisMode: AnalysisMode =
    req.body?.analysisMode === "single" ? "single" : "compare";

  const a = safeProfile(req.body?.profileA);
  const b = analysisMode === "compare" ? safeProfile(req.body?.profileB) : null;

    if (!isInstagramUrl(a.url)) {
    return res
      .status(400)
      .json({ error: "Informe uma URL HTTPS válida de perfil do Instagram." });
  }
  if (analysisMode === "compare" && b && !isInstagramUrl(b.url)) {
    return res
      .status(400)
      .json({ error: "Informe a URL HTTPS do segundo perfil." });
  }

  const language = settings.language || "Português (Brasil)";
  const tone = settings.tone || "Direto e estratégico";

  const model =
    AI_PROVIDER === "ollama"
      ? String(OLLAMA_MODEL).slice(0, 100)
      : String(OPENAI_MODEL).slice(0, 100);

  console.log(`[analyze] provider=${AI_PROVIDER} model=${model}`);

    const systemIntro =
    analysisMode === "single"
      ? "Você é um estrategista sênior de social media que assessora agências. Sua tarefa é produzir um diagnóstico ESTRATÉGICO COMPLETO de UM perfil do Instagram usando SOMENTE o briefing e as evidências fornecidas pelo usuário."
      : "Você é um estrategista sênior de social media que assessora agências. Sua tarefa é produzir um diagnóstico COMPARATIVO entre dois perfis do Instagram usando SOMENTE o briefing e as evidências fornecidas pelo usuário.";

  const systemRules =
    analysisMode === "single"
      ? `
13. O array "profiles" deve ter EXATAMENTE 1 item.
14. NÃO inclua o campo "ranking" no JSON.
15. Retorne um único plano de ação no campo "actionPlan" (array) com 3 a 5 ações.
16. Cada ação deve ser específica para ESTE perfil, citando formato, frequência ou evidência fornecida.
17. NÃO retorne "actionPlanA" nem "actionPlanB".`
      : `
13. Você DEVE retornar DOIS planos de ação distintos: "actionPlanA" (específico para o Perfil A) e "actionPlanB" (específico para o Perfil B).
14. Cada plano deve ter de 2 a 4 ações ÚNICAS e ESPECÍFICAS para aquele perfil. NÃO repita as mesmas ações nos dois planos.
15. Cada ação do "actionPlanA" deve resolver um problema ou explorar uma oportunidade IDENTIFICADA NO PERFIL A.
16. Cada ação do "actionPlanB" deve resolver um problema ou explorar uma oportunidade IDENTIFICADA NO PERFIL B.
17. NÃO gere ações genéricas que sirvam para os dois.`;

  const system = `${systemIntro}

REGRAS INVIOLÁVEIS:
1. Nunca invente métricas, números de seguidores, curtidas ou fatos que não estejam no briefing.
2. Nunca finja ter visitado as URLs. URLs são apenas referências textuais.
3. Se um dado não foi fornecido, escreva "não informado" e reduza a nota para 5.0 explicando a baixa confiança na evidência.
4. Toda nota deve ter pelo menos UMA evidência concreta associada.
5. Hipóteses devem ser explicitamente marcadas com a palavra "Hipótese:".
6. Nunca afirme ter feito scraping.

REGRAS DE QUALIDADE (violação = resposta ruim):
7. PROIBIDO usar frases genéricas como: "invista em conteúdo de qualidade", "aumente o engajamento", "melhore a comunicação", "poste com consistência". Toda recomendação deve ser ESPECÍFICA e MENSURÁVEL.
8. PROIBIDO usar advérbios vagos: "muito", "bastante", "consideravelmente", "significativamente". Use números: "4x/semana", "80% dos posts", "+15% em 30 dias".
9. SEMPRE cite formato (Reels, Carrossel, Stories, IGTV), frequência, tema e presença de CTA quando estiver avaliando conteúdo.
10. Cada força/fraqueza deve ser uma FRASE COMPLETA com sujeito + verbo + dado concreto.
11. Cada ação do plano deve ter: título específico (começa com verbo de ação), razão estratégica, 3-5 etapas executáveis, métrica de conclusão, PRAZO em dias, RESPONSÁVEL (função) e KPI final mensurável.
12. Cada oportunidade deve descrever uma jogada concreta — não um tema.
${systemRules}

TOM: ${tone}.
IDIOMA: ${language}.

FORMATO DE SAÍDA:
Responda SOMENTE com JSON válido (sem markdown, sem texto antes ou depois), seguindo exatamente este esquema:
${JSON.stringify(schemaExample)}

VALIDAÇÕES FINAIS:
${analysisMode === "single" ? "- O array \"profiles\" deve ter EXATAMENTE 1 item.\n- O campo \"actionPlan\" deve ter de 3 a 5 ações.\n- NÃO retorne \"ranking\", \"actionPlanA\" nem \"actionPlanB\"." : "- O array \"profiles\" deve ter EXATAMENTE 2 itens, na ordem fornecida.\n- \"ranking\" contém os dois nomes ordenados por \"overall\" decrescente.\n- \"actionPlanA\" e \"actionPlanB\" devem ter CADA UM entre 2 e 4 ações.\n- As ações de A e B devem ser DIFERENTES entre si."}
- \"summary\" deve ter entre 3 e 5 frases, citando explicitamente ${analysisMode === "single" ? "o perfil" : "os dois perfis"} pelo nome.`;

  const user = {
    profileA: a,
    profileB: b,
    context: {
      niche: a.niche || b.niche || "não informado",
      audience: a.audience || b.audience || "não informado",
      objective: a.objective || b.objective || "não informado",
      evidenceProvidedByUser: evidence || "Nenhuma evidência adicional fornecida.",
    },
    task: "Compare os perfis, identifique diferenças e oportunidades acionáveis. Não trate a URL como se fosse conteúdo acessado. Cite formatos, frequências e números específicos fornecidos no briefing.",
  };

  try {
    const content = await callProvider({ model, system, user });
    const parsed = extractJson(content);
    const report = normalizeReport(parsed, a, b);
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
function normalizeReport(raw: unknown, a: ProfileInput, b: ProfileInput) {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const num = (v: unknown, fallback = 5): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : fallback;
  };

  const list = (v: unknown, fallback: string[] = []): string[] =>
    Array.isArray(v) ? v.map(String).slice(0, 12) : fallback;

  const rawProfiles = Array.isArray(r.profiles) ? (r.profiles as unknown[]) : [];

  const normalizedProfiles = [a, b].map((p, i) => {
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