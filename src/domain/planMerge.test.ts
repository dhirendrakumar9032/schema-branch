import { describe, expect, it } from "vitest";
import { commerceSchema } from "../data/demoWorkspace";
import { findMergeConflicts, planSchemaMerge } from "./planMerge";

describe("planSchemaMerge", () => {
  it("blocks merge when both branches retype the same column", () => {
    const changeTotal = (type: "integer" | "text") => ({
      ...commerceSchema,
      tables: commerceSchema.tables.map((table) =>
        table.name === "orders"
          ? {
              ...table,
              columns: table.columns.map((column) => (column.name === "total" ? { ...column, type } : column)),
            }
          : table,
      ),
    });

    const conflicts = findMergeConflicts(commerceSchema, changeTotal("integer"), changeTotal("text"));

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      tableName: "orders",
      field: "type",
      targetValue: "integer",
      sourceValue: "text",
    });
  });

  it("unblocks merge after the user chooses a version", () => {
    const changeUserName = (name: string) => ({
      ...commerceSchema,
      tables: commerceSchema.tables.map((table) =>
        table.name === "users"
          ? {
              ...table,
              columns: table.columns.map((column) => (column.name === "full_name" ? { ...column, name } : column)),
            }
          : table,
      ),
    });

    const blocked = planSchemaMerge(commerceSchema, changeUserName("fullName"), changeUserName("display_name"));
    const conflict = blocked.conflicts[0];
    const resolved = planSchemaMerge(commerceSchema, changeUserName("fullName"), changeUserName("display_name"), {
      [conflict.id]: "target",
    });
    const users = resolved.schema.tables.find((table) => table.name === "users");

    expect(blocked.status).toBe("blocked");
    expect(resolved.status).toBe("resolved");
    expect(users?.columns.some((column) => column.name === "fullName")).toBe(true);
  });

  it("keeps target-only changes when the source branch did not edit that field", () => {
    const renameInUsers = {
      ...commerceSchema,
      tables: commerceSchema.tables.map((table) =>
        table.name === "users"
          ? {
              ...table,
              columns: table.columns.map((column) => (column.name === "full_name" ? { ...column, name: "fullName" } : column)),
            }
          : table,
      ),
    };
    const addBillingColumn = {
      ...commerceSchema,
      tables: commerceSchema.tables.map((table) =>
        table.name === "orders"
          ? {
              ...table,
              columns: table.columns.concat({ id: "col_orders_tax", name: "tax_amount", type: "decimal", nullable: true }),
            }
          : table,
      ),
    };

    const merged = planSchemaMerge(commerceSchema, renameInUsers, addBillingColumn);
    const users = merged.schema.tables.find((table) => table.name === "users");
    const orders = merged.schema.tables.find((table) => table.name === "orders");

    expect(merged.status).toBe("ready");
    expect(users?.columns.some((column) => column.name === "fullName")).toBe(true);
    expect(orders?.columns.some((column) => column.name === "tax_amount")).toBe(true);
  });
});
