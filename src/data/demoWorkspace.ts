import type { Branch, Column, Schema } from "../types/schema";

export const commerceSchema: Schema = {
  id: "schema_main",
  name: "Zamp AI",
  tables: [
    {
      id: "tbl_users",
      name: "users",
      columns: [
        { id: "col_users_id", name: "id", type: "uuid", nullable: false },
        { id: "col_users_email", name: "email", type: "text", nullable: false },
        { id: "col_users_name", name: "full_name", type: "text", nullable: true },
        { id: "col_users_created", name: "created_at", type: "timestamp", nullable: false },
      ],
      indexes: [{ id: "idx_users_email", name: "users_email_unique", columns: ["email"], unique: true }],
    },
    {
      id: "tbl_orders",
      name: "orders",
      columns: [
        { id: "col_orders_id", name: "id", type: "uuid", nullable: false },
        { id: "col_orders_user", name: "user_id", type: "uuid", nullable: false },
        { id: "col_orders_total", name: "total", type: "decimal", nullable: false },
        { id: "col_orders_status", name: "status", type: "text", nullable: false, defaultValue: "'draft'" },
      ],
      indexes: [{ id: "idx_orders_user", name: "orders_user_id", columns: ["user_id"], unique: false }],
    },
  ],
};

const billingBranchSchema: Schema = {
  ...commerceSchema,
  id: "schema_billing",
  tables: commerceSchema.tables.map((table) => {
    if (table.name !== "orders") return table;
    return {
      ...table,
      columns: table.columns.map((column): Column =>
        column.name === "total" ? { ...column, name: "subtotal", type: "decimal" } : column,
      ).concat({ id: "col_orders_tax", name: "tax_amount", type: "decimal", nullable: false, defaultValue: "0" }),
    };
  }),
};

export const branchesForDemo: Branch[] = [
  {
    id: "branch_main",
    name: "main",
    baseSchema: commerceSchema,
    schema: commerceSchema,
    updatedAt: new Date("2026-08-20T10:30:00Z").toISOString(),
  },
  {
    id: "branch_billing",
    name: "checkout-tax-update",
    baseBranchId: "branch_main",
    baseSchema: commerceSchema,
    schema: billingBranchSchema,
    updatedAt: new Date("2026-08-22T09:15:00Z").toISOString(),
  },
];
