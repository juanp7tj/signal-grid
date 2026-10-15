# Signal Grid

MVP de inteligência competitiva para comparar dois perfis do Instagram, com frontend React/Vite/TypeScript e backend Express integrado ao Ollama local.

## Requisitos
- Node.js 20 ou superior
- Ollama instalado e em execução
- Modelo local, por exemplo `qwen2.5:3b`

## Iniciar em desenvolvimento

1. Extraia o ZIP e abra a pasta `signal-grid` no terminal.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Baixe o modelo:

   ```bash
   ollama pull qwen2.5:3b
   ```

4. Copie `.env.example` para `.env` e ajuste se necessário.
   - PowerShell: `Copy-Item .env.example .env`
   - CMD: `copy .env.example .env`

5. Inicie o servidor e o frontend:

   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000`.

## Verificar o Ollama
Abra `http://localhost:3000/api/health`. Deve retornar `ok: true` e uma lista de modelos, se o Ollama estiver acessível.

## Como funciona
- O backend envia o briefing para `OLLAMA_BASE_URL/api/chat`.
- O Ollama local normalmente não exige `OLLAMA_API_KEY`; o projeto só envia Bearer token se essa variável for configurada.
- Para endpoint OpenAI-compatible de outro serviço, configure a URL de acordo com o serviço usado. O endpoint implementado no momento é a API nativa `/api/chat` do Ollama.
- Se a conexão falhar, a interface mostra um erro e sugere usar o modo demonstrativo. Não substitui silenciosamente uma falha por dados falsos.
- O MVP não faz scraping nem login no Instagram. As URLs servem como referência e o agente só pode analisar o contexto/evidências que o usuário fornecer.
- “Exportar PDF” abre o diálogo de impressão do navegador; selecione “Salvar como PDF”.

## Build
O comando `npm run build` compila o frontend. Para produção, compile também o backend com uma configuração de build Node dedicada antes de usar `npm start`; a execução de desenvolvimento (`npm run dev`) é o caminho pronto para teste local.

## Segurança
Não publique `.env`, não envie chaves ao frontend e não coloque credenciais em repositórios. Use o sistema apenas com dados que você tenha autorização para tratar.
