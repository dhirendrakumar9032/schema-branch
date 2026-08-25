import { describe, expect, it } from "vitest";
import { commerceSchema } from "../data/demoWorkspace";
import { compareSchemas } from "./compareSchemas";

describe("compareSchemas", () => {
  it("treats compatible column rename as one semantic change", () => {
    const next = {
      ...commerceSchema,
      tables: commerceSchema.tables.map((table) =>
        table.name === "orders"
          ? {
              ...table,
              columns: table.columns.map((column) => (column.name === "total" ? { ...column, name: "subtotal" } : column)),
            }
          : table,
      ),
    };

    const changes = compareSchemas(commerceSchema, next);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: "column_renamed", from: "total", to: "subtotal" });
  });

  it("flags dropping a column as breaking", () => {
    const next = {
      ...commerceSchema,
      tables: commerceSchema.tables.map((table) =>
        table.name === "users" ? { ...table, columns: table.columns.filter((column) => column.name !== "email") } : table,
      ),
    };

    expect(compareSchemas(commerceSchema, next)).toContainEqual(
      expect.objectContaining({ kind: "column_removed", columnName: "email", severity: "breaking" }),
    );
  });
});
