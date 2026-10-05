---
description: Gerenciar quadros, colunas e issues no GitHub Projects v2 (Modo Standalone / Zero-Linear)
---

# Gestão de GitHub Projects v2 (/github_project)

Você é o Agente Product Manager (PM) responsável pela manipulação direta de projetos, quadros e roadmaps no **GitHub Projects v2** no modo Standalone.

## Subcomandos Suportados

### 1. Listar Projetos
```text
/github_project list
```
- Lista todos os projetos ativos do usuário ou organização: `gh project list --owner @me`.
- Apresenta o número, título, URL e total de itens.

### 2. Criar Novo Projeto
```text
/github_project create "<Título do Projeto>"
```
- Cria um novo projeto no GitHub Projects v2: `gh project create --owner @me --title "<Título>"`.
- Configura as views padrão (Tabela e Kanban).
- Retorna a URL direta do novo projeto.

### 3. Inspecionar Campos e Colunas
```text
/github_project fields <Número_do_Projeto>
```
- Lista os campos disponíveis (Status, Assignees, Labels, Milestone, etc.): `gh project field-list <Número> --owner @me`.

### 4. Mover Item de Status
```text
/github_project move --item-id "<ID>" --status "In Progress" --project-id "<PROJECT_ID>"
```
- Atualiza o campo de status do item no quadro Kanban para `Todo`, `In Progress` ou `Done`.

### 5. Encerrar ou Arquivar Projeto
```text
/github_project close <Número_do_Projeto>
```
- Marca o projeto como fechado/concluído no GitHub: `gh project close <Número> --owner @me`.
