/* =========================================================
   Entrada
   ========================================================= */
export type ProfileInput = {
  name: string;
  url: string;
  niche: string;
  audience: string;
  objective: string;
};

/* =========================================================
   Score / perfil
   ========================================================= */
export type ProfileScore = {
  profileName: string;
  overall: number;
  content: number;
  consistency: number;
  positioning: number;
  engagement: number;
  strengths: string[];
  weaknesses: string[];
  evidence: string[];
};

/* =========================================================
   Enums utilitários
   ========================================================= */
export type Priority = "Alta" | "Média" | "Baixa";
export type Impact = "Alto" | "Médio" | "Baixo";

/* =========================================================
   Plano de ação — 🔥 agora com deadline, owner e kpi
   ========================================================= */
export type ActionItem = {
  priority: Priority;
  title: string;
  reason: string;
  steps: string[];
  metric: string;
  deadline: string;
  owner: string;
  kpi: string;
};

/* =========================================================
   Oportunidades
   ========================================================= */
export type Opportunity = {
  title: string;
  description: string;
  impact: Impact;
};

/* =========================================================
   Relatório completo
   ========================================================= */
export type AnalysisReport = {
  title: string;
  summary: string;
  ranking: string[];
  profiles: ProfileScore[];
  opportunities: Opportunity[];
  actionPlan: ActionItem[];
  caveats: string[];
  generatedAt: string;
  mode: "ollama" | "openai-compatible" | "demo";
};

/* =========================================================
   Configurações da sessão
   ========================================================= */
export type Settings = {
  language: string;
  tone: string;
  model: string;
};