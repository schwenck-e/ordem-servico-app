# Modelagem de Dados & Schema Relacional

A persistência do sistema é gerenciada pelo **Prisma ORM** sobre **SQLite**, garantindo integridade relacional e facilidade de execução local.

---

## 📊 Diagrama Entidade-Relacionamento (ERD)

```mermaid
erDiagram
    Customer ||--o{ WorkOrder : "solicita"
    Technician ||--o{ WorkOrder : "executa"
    WorkOrder ||--|{ WorkOrderItem : "contem"
    WorkOrder ||--|{ StatusHistory : "registra"

    Customer {
        string id PK
        string name
        string email
        string phone
        string document
        string address
        datetime createdAt
        datetime updatedAt
    }

    Technician {
        string id PK
        string name
        string email
        string phone
        string specialty
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    WorkOrder {
        string id PK
        string orderNumber UK
        string customerId FK
        string technicianId FK
        string status
        string description
        float totalItems
        float laborCost
        float totalAmount
        datetime startDate
        datetime completionDate
        datetime createdAt
        datetime updatedAt
    }

    WorkOrderItem {
        string id PK
        string workOrderId FK
        string description
        int quantity
        float unitPrice
        float totalPrice
    }

    StatusHistory {
        string id PK
        string workOrderId FK
        string previousStatus
        string newStatus
        string notes
        datetime createdAt
    }
```

---

## 🔍 Regras de Integridade Relacional

1. **Delete Cascading:**
   - A exclusão de uma `WorkOrder` remove em cascata todos os seus `WorkOrderItem` e `StatusHistory` correspondentes.
   - Não é permitido deletar um `Customer` ou `Technician` que possua Ordens de Serviço associadas (proteção contra perda de dados fiscais/operacionais).
2. **Cálculo de Totais:**
   - `totalItems = SUM(WorkOrderItem.totalPrice)`
   - `totalAmount = totalItems + laborCost`
   - O cálculo é validado no backend antes de qualquer persistência.
