import type { Column, MergeChoice, MergeConflict, Schema, Table } from "../types/schema";

type ColumnField = "name" | "type" | "nullable";

type ColumnEdit = {
  id: string;
  tableId: string;
  tableName: string;
  columnId: string;
  field: ColumnField;
  value: string;
};

const listById = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item]));

const formatColumnValue = (value: Column[ColumnField]) => (typeof value === "boolean" ? (value ? "nullable" : "required") : value);

function listColumnEdits(base: Schema, changedSchema: Schema) {
  const editsByColumnField = new Map<string, ColumnEdit>();
  const changedTables = listById(changedSchema.tables);

  for (const baseTable of base.tables) {
    const changedTable = changedTables.get(baseTable.id);
    if (!changedTable) continue;

    const changedColumns = listById(changedTable.columns);
    for (const baseColumn of baseTable.columns) {
      const changedColumn = changedColumns.get(baseColumn.id);
      if (!changedColumn) continue;

      (["name", "type", "nullable"] as ColumnField[]).forEach((field) => {
        if (baseColumn[field] === changedColumn[field]) return;
        const id = `${baseTable.id}:${baseColumn.id}:${field}`;
        editsByColumnField.set(id, {
          id,
          tableId: baseTable.id,
          tableName: changedTable.name,
          columnId: baseColumn.id,
          field,
          value: formatColumnValue(changedColumn[field]),
        });
      });
    }
  }

  return editsByColumnField;
}

export function findMergeConflicts(
  base: Schema,
  target: Schema,
  source: Schema,
  targetLabel = "main",
  sourceLabel = "this branch",
): MergeConflict[] {
  const targetEdits = listColumnEdits(base, target);
  const sourceEdits = listColumnEdits(base, source);
  const conflicts: MergeConflict[] = [];

  for (const [id, sourceEdit] of sourceEdits.entries()) {
    const targetEdit = targetEdits.get(id);
    if (!targetEdit || targetEdit.value === sourceEdit.value) continue;

    conflicts.push({
      id,
      tableName: sourceEdit.tableName,
      field: sourceEdit.field === "name" ? "column name" : sourceEdit.field,
      targetLabel,
      sourceLabel,
      targetValue: targetEdit.value,
      sourceValue: sourceEdit.value,
      summary: `${sourceEdit.tableName} ${sourceEdit.field} changed in both branches.`,
    });
  }

  return conflicts;
}

function applyChoiceToColumn(schema: Schema, conflict: MergeConflict, value: string): Schema {
  return {
    ...schema,
    tables: schema.tables.map((table): Table => {
      if (table.name !== conflict.tableName) return table;

      return {
        ...table,
        columns: table.columns.map((column) => {
          const field = conflict.field === "column name" ? "name" : conflict.field;

          if (field === "name" && (column.name === conflict.targetValue || column.name === conflict.sourceValue)) {
            return { ...column, name: value };
          }

          if (field === "type" && (column.type === conflict.targetValue || column.type === conflict.sourceValue)) {
            return { ...column, type: value as Column["type"] };
          }

          if (
            field === "nullable" &&
            (formatColumnValue(column.nullable) === conflict.targetValue || formatColumnValue(column.nullable) === conflict.sourceValue)
          ) {
            return { ...column, nullable: value === "nullable" };
          }

          return column;
        }),
      };
    }),
  };
}

function mergeNonConflictingChanges(base: Schema, target: Schema, source: Schema, conflicts: MergeConflict[]) {
  const baseTables = listById(base.tables);
  const targetTables = listById(target.tables);
  const sourceTables = listById(source.tables);
  const conflictIds = new Set(conflicts.map((conflict) => conflict.id));
  const sourceOnlyTables = source.tables.filter((sourceTable) => !targetTables.has(sourceTable.id));

  return {
    ...target,
    tables: target.tables.map((targetTable): Table => {
      const sourceTable = sourceTables.get(targetTable.id);
      if (!sourceTable) return targetTable;

      const baseTable = baseTables.get(sourceTable.id);
      if (!baseTable) return targetTable;

      const baseColumns = listById(baseTable.columns);
      const targetColumns = listById(targetTable.columns);

      return {
        ...targetTable,
        columns: sourceTable.columns.map((sourceColumn) => {
          const baseColumn = baseColumns.get(sourceColumn.id);
          const targetColumn = targetColumns.get(sourceColumn.id);

          if (!baseColumn || !targetColumn) return sourceColumn;

          let mergedColumn = targetColumn;

          (["name", "type", "nullable"] as ColumnField[]).forEach((field) => {
            const conflictId = `${baseTable.id}:${baseColumn.id}:${field}`;
            const sourceChanged = baseColumn[field] !== sourceColumn[field];
            const targetChanged = baseColumn[field] !== targetColumn[field];

            if (sourceChanged && !targetChanged && !conflictIds.has(conflictId)) {
              mergedColumn = { ...mergedColumn, [field]: sourceColumn[field] };
            }
          });

          return mergedColumn;
        }),
        indexes: sourceTable.indexes,
      };
    }).concat(sourceOnlyTables),
  };
}

export function applyMergeDecisions(base: Schema, target: Schema, source: Schema, conflicts: MergeConflict[], choices: Record<string, MergeChoice>) {
  let resolvedSchema = mergeNonConflictingChanges(base, target, source, conflicts);

  for (const conflict of conflicts) {
    if (choices[conflict.id] === "target") {
      resolvedSchema = applyChoiceToColumn(resolvedSchema, conflict, conflict.targetValue);
    } else if (choices[conflict.id] === "source") {
      resolvedSchema = applyChoiceToColumn(resolvedSchema, conflict, conflict.sourceValue);
    }
  }

  return resolvedSchema;
}

export function planSchemaMerge(base: Schema, target: Schema, source: Schema, choices: Record<string, MergeChoice> = {}) {
  const conflicts = findMergeConflicts(base, target, source);
  const unresolved = conflicts.filter((conflict) => !choices[conflict.id]);

  if (unresolved.length > 0) {
    return { status: "blocked" as const, conflicts, schema: target };
  }

  if (conflicts.length > 0) {
    return { status: "resolved" as const, conflicts, schema: applyMergeDecisions(base, target, source, conflicts, choices) };
  }

  return { status: "ready" as const, conflicts, schema: mergeNonConflictingChanges(base, target, source, conflicts) };
}
