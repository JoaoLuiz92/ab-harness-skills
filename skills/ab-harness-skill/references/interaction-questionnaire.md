# Interaction Questionnaire

**Regra principal:** toda pergunta ao usuário vai pela ferramenta **AskQuestion** (caixa de seleção). Não faça listas numeradas no chat nem perguntas abertas soltas.

**Fluxo padrão** (usuário pede bootstrap / harness — modo `full`):

```
Q0 idioma → Q0b repositório (se necessário) → Q2–Q4 entrevista → Parte A (fases 1–4) → resumo → Q5 aprovação → Parte B (instalação)
```

Uma chamada AskQuestion por rodada. Espere a resposta antes de continuar.

Registre `LANGUAGE` em `context.md` (ou `.tmp-harness-context.md` em modo `plan`).

---

## Q0 — Idioma (sempre primeiro)

Antes de scan, entrevista ou instalação.

| id | prompt (English) | options |
|----|------------------|---------|
| `language` | In which language should I run this bootstrap? | `en` English · `pt` Português · `es` Español · `other` Other |

- Se `other`: uma AskQuestion de follow-up com opções comuns ou pedir o nome do idioma na opção `other` do próprio tool.
- Traduza prompts e resumos; mantenha paths, flags e comandos em inglês.

---

## Q0b — Repositório alvo (se não estiver claro)

Pule se o usuário já indicou o repo ou o workspace atual é óbvio.

| id | prompt | options |
|----|--------|---------|
| `target_repo` | Which repository should receive the harness? | `workspace` Current workspace / open folder · `other` Another path (I'll specify next) |

---

## Q1 — Modo (somente se ambíguo)

**Não pergunte Q1** quando o usuário pedir bootstrap, harness, workflow ou SDD — use `full` direto.

| id | prompt | options |
|----|--------|---------|
| `mode` | How should I proceed? | `full` Full bootstrap (prepare → **approve** → install) · `plan` Plan only (no repo writes) · `install` Install only (plan already approved) |

---

## Q2–Q4 — Entrevista (Fase 2 / Parte A)

Use [interview-questions.md](interview-questions.md). Cada rodada = uma AskQuestion com 3–5 perguntas. `allow_multiple: true` onde indicado.

**Rodada 1** (`round1`):

| id | prompt | options | multi |
|----|--------|---------|-------|
| `tools` | Which AI tools does the team use? | cursor · claude · codex | yes |
| `branch_strategy` | Branch strategy? | main + develop · trunk-based · gitflow · other | no |
| `production_risk` | Is production active? Can merges break live users? | yes active / high risk · staging only · no production yet | no |
| `merge_approver` | Who approves merge to production? | tech lead · team review · automated CI only · other | no |

**Rodada 2 — integrações** (`round2`):

| id | prompt | options |
|----|--------|---------|
| `jira_tasks` | Track work in Jira (or similar)? | ON · OFF |
| `github_pull_requests` | Use PRs via GitHub/GitLab? | ON · OFF |
| `confluence` | Team wiki on Confluence? | ON · OFF |

Se alguma integração ON: uma AskQuestion de follow-up (project key / MCP pronto ou pendente).

**Rodada 3 — qualidade** (`round3`):

| id | prompt | options |
|----|--------|---------|
| `test_confidence` | Current test confidence? | none · low · medium · high |
| `ci_blocks_merge` | Does CI block merge today? | yes · no · partial |
| `guard_rails` | Auth / payments / PII areas agents must not touch without review? | yes · no · unsure |

**Campos de texto:** inferir do README/scan primeiro. Se faltar: uma AskQuestion com opções derivadas do scan + `other`, nunca várias perguntas abertas no chat.

Exemplos: descrição do projeto em uma frase; fluxos críticos (2–5); piloto em monorepo.

---

## Q5 — Aprovação do plano (fim da Parte A — obrigatório)

Depois que existirem `harness-plan.md` e `tasks.md`, apresente um **resumo curto em linguagem simples** (o que o projeto é, pontos fracos, o que a instalação vai criar) e **uma** AskQuestion. **Não inicie a Parte B** até `approve_install`.

| id | prompt (traduzir para LANGUAGE) | options |
|----|----------------------------------|---------|
| `plan_approval` | O plano está aprovado? A instalação vai criar pastas e arquivos no repositório. | `approve_install` Aprovar — instalar estrutura completa (Parte B) · `approve_plan_only` Só guardar o plano — não instalar agora · `request_changes` Pedir ajustes · `cancel` Cancelar |

| Resposta | Ação |
|----------|------|
| `approve_install` | Parte B (Fase 5) → Parte C (Fase 6) |
| `approve_plan_only` | Parar; usuário pode voltar depois com modo `install` |
| `request_changes` | Revisar plano/tasks → perguntar Q5 de novo |
| `cancel` | Parar |

**Se pedirem para pular aprovação:** recusar Parte B; oferecer `approve_plan_only` ou modo `plan`.

---

## Q6 — Piloto (opcional, após Parte B)

Após instalação bem-sucedida:

| id | prompt | options |
|----|--------|---------|
| `start_pilot` | Want to run the first guided pilot delivery now? | `yes` Yes — walk me through it · `later` Later — I'll use pilot-guide.md myself |

---

## Fallback (AskQuestion indisponível)

Espelhe as mesmas opções como lista numerada e peça o id da opção (ex.: `approve_install`).
