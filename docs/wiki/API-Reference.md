# Referência de APIs REST & Contratos

Todos os endpoints operam sobre HTTP utilizando payloads codificados em **JSON** e schemas de validação **Zod**.

---

## 🛣️ Sumário de Rotas

### 1. Clientes (`/customers`)

| Método | Endpoint | Descrição |
| :---: | :--- | :--- |
| `GET` | `/customers` | Lista todos os clientes cadastrados com suporte a busca. |
| `GET` | `/customers/:id` | Retorna os detalhes de um cliente por ID. |
| `POST` | `/customers` | Cria um novo cliente (Validação Zod: nome, email, documento, telefone). |
| `PUT` | `/customers/:id` | Atualiza os dados cadastrais do cliente. |
| `DELETE` | `/customers/:id` | Remove o cliente (bloqueado se houver OS vinculada). |

---

### 2. Técnicos (`/technicians`)

| Método | Endpoint | Descrição |
| :---: | :--- | :--- |
| `GET` | `/technicians` | Lista todos os técnicos com filtro por especialidade e status ativo. |
| `GET` | `/technicians/:id` | Retorna o cadastro de um técnico específico. |
| `POST` | `/technicians` | Cadastra um novo técnico. |
| `PUT` | `/technicians/:id` | Atualiza dados e especialidade do técnico. |
| `DELETE` | `/technicians/:id` | Remove técnico sem OS ativas. |

---

### 3. Ordens de Serviço (`/work-orders`)

| Método | Endpoint | Descrição |
| :---: | :--- | :--- |
| `GET` | `/work-orders` | Lista ordens de serviço com filtros (status, cliente, período). |
| `GET` | `/work-orders/:id` | Retorna a OS completa com itens, dados do cliente e histórico. |
| `POST` | `/work-orders` | Cria uma nova OS calculando totais e gerando histórico inicial. |
| `PUT` | `/work-orders/:id` | Edita dados da OS e itens (permitido apenas em `ABERTA` ou `EM_ANDAMENTO`). |
| `PATCH` | `/work-orders/:id/status` | Executa transição de status validada pela máquina de estados. |

---

### 4. Indicadores & Métricas (`/metrics`)

| Método | Endpoint | Descrição |
| :---: | :--- | :--- |
| `GET` | `/metrics/summary` | Retorna contagem de OS por status, faturamento acumulado e tempo médio de conclusão. |
| `GET` | `/metrics/trends` | Série temporal de serviços concluídos por mês/semana para gráficos analíticos. |

---

## 🔒 Formato de Erro Padronizado

Em caso de falha de validação ou regra de negócio, a API responde no padrão:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "issues": [
    {
      "field": "customerEmail",
      "message": "Invalid email format"
    }
  ]
}
```
