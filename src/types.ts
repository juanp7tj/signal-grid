/* =========================================================
   Signal Grid — Tipos
   ========================================================= */

/* ---------- Entrada ---------- */
export type ProfileInput = {
  name: string;
  url: string;
  niche: string;
  audience: string;
  objective: string;
};

/* ---------- Score / perfil ---------- */
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

/* ---------- Enums ---------- */
export type Priority = "Alta" | "Média" | "Baixa";
export type Impact = "Alto" | "Médio" | "Baixo";
export type AnalysisMode = "single" | "compare";

/* ---------- Plano de ação ---------- */
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

/* ---------- Oportunidades ---------- */
export type Opportunity = {
  title: string;
  description: string;
  impact: Impact;
};

/* ---------- Relatório ---------- */
export type AnalysisReport = {
  title: string;
  summary: string;
  analysisMode: AnalysisMode;
  ranking?: string[];
  profiles: ProfileScore[];
  opportunities: Opportunity[];
  actionPlan?: ActionItem[];
  actionPlanA?: ActionItem[];
  actionPlanB?: ActionItem[];
  caveats: string[];
  generatedAt: string;
  mode: "ollama" | "openai-compatible" | "demo";
};

/* ---------- Settings ---------- */
export type Settings = {
  language: string;
  tone: string;
  model: string;
};

/* ---------- Histórico ---------- */
export type HistorySummary = {
  id: string;
  createdAt: string;
  analysisMode: AnalysisMode;
  title: string;
  summary: string;
  profileNames: string[];
  overallScores: number[];
};

export type HistoryEntry = HistorySummary & {
  report: AnalysisReport;
};

/* ---------- Auth ---------- */
export type UserRole = "admin" | "user";

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
};

export type ManagedUser = AuthUser & {
  createdAt: string;
  password: string;
};