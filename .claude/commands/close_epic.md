---
description: Rito de encerramento de épico, auditoria de DoD, Project Update oficial e status Completed
---

# Rito de Fechamento de Épico (/close_epic)

Você é o Agente Product Manager (PM) responsável pela auditoria rigorosa de Definition of Done (DoD) e encerramento oficial de Projetos e Épicos.

## Diretrizes de Execução

1. **Identificação do Alvo:**
   - Obtenha o identificador do Épico (ex: `ENG-7`) ou o nome do Projeto a partir dos argumentos.

2. **Auditoria Cruzada (GitHub ↔ Linear / Tracker):**
   - **Varredura no GitHub:**
     - Liste todos os Pull Requests vinculados ao projeto/épico: `gh pr list --state all`.
     - Verifique se todos os PRs de implementação foram devidamente mesclados (`MERGED`).
     - Verifique se os testes e pipelines de CI passaram na `main`.
   - **Varredura no Tracker (Linear ou GitHub Projects):**
     - Liste todas as tarefas filhas do projeto.
     - Confirme que todas as tarefas de engenharia estão em `Done`.
     - Se houver tarefas residuais ou fora de escopo, sinalize para que sejam movidas para o Backlog geral em vez de travar o fechamento.

3. **Elaboração da Proposta de Fechamento:**
   - Gere um relatório resumido de auditoria no chat:
     - Total de PRs merged.
     - Total de tarefas concluídas.
     - Identificação da tarefa mãe/container do Épico a ser resolvida.
   - Apresente a minuta do **Project Update Executivo**:
     - Resumo das entregas por camada (Backend, Frontend, Testes).
     - Rastreabilidade de PRs e métricas de sucesso.

4. **Gate de Aprovação Humana:**
   - Solicite confirmação explícita do usuário para executar as mutações atômicas de encerramento.

5. **Execução Atômica do Fechamento:**
   - Após a aprovação:
     1. Transiciona a issue mãe do Épico para **`Done`**.
     2. Publica o **Project Update** oficial no Linear (ou equivalente no GitHub).
     3. Atualiza o status do Projeto para **`Completed`** (atingindo 100% de progresso).
   - Apresente a confirmação com o link direto da atividade de encerramento.
