# Signal Grid

> Inteligência competitiva para Instagram — MVP que compara dois perfis e gera diagnóstico estratégico com plano de ação separado por perfil.

![Status](https://img.shields.io/badge/status-MVP-brightgreen)
![Node](https://img.shields.io/badge/node-%E2%89%A520-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📖 Sobre

**Signal Grid** é uma ferramenta para agências e profissionais de social media que precisam comparar dois perfis do Instagram e transformar sinais em decisões estratégicas.

O sistema recebe um **briefing** (nome, URL, nicho, público e evidências) dos dois perfis e usa **IA** para gerar:

- **Diagnóstico comparativo** com notas em 4 pilares (Conteúdo, Consistência, Posicionamento, Engajamento)
- **Ranking** com vantagem do líder
- **Oportunidades prioritárias** com impacto estimado
- **Plano de ação separado** para cada perfil, com etapas, prazo, responsável e KPI
- **Exportação em PDF** do relatório completo

---

## ✨ Funcionalidades

- 🎨 **Interface dark** inspirada no Instagram, com glassmorphism e gradientes
- 📱 **Responsiva** — funciona em desktop, tablet e mobile (bottom navigation)
- 🧠 **Múltiplos providers de IA** — Groq, DeepSeek, OpenAI, Ollama (local)
- 📊 **Comparação visual** com barras de score por pilar
- 🗂️ **Planos de ação em tabs** — um plano específico para cada perfil
- 📄 **Exportação em PDF** formatada para consultoria
- 🔒 **Modo demonstrativo** para testar a interface sem chamar a IA
- 💾 **Configurações persistentes** na sessão do navegador

---

## 🚀 Começando

### Pré-requisitos

- **Node.js 20 ou superior** — [baixar](https://nodejs.org/)
- **Conta em um provider de IA** (recomendado: **Groq** — grátis)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/juanp7tj/signal-grid.git
cd signal-grid

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de variáveis de ambiente
# Windows (PowerShell):
Copy-Item .env.example .env
# Linux/Mac:
cp .env.example .env

# 4. Edite o .env e configure seu provider (veja abaixo)

# 5. Inicie o servidor de desenvolvimento
npm run dev
