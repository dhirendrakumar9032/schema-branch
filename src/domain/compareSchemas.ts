import type { Column, Schema, SchemaDiff, Table } from "../types/schema";

const listByName = <T extends { name: string }>(items: T[]) => new Map(items.map((item) => [item.name, item]));

const describeColumnShape = (column: Column) => `${column.type}:${column.nullable}:${column.defaultValue ?? ""}`;

const makeChangeId = (...parts: string[]) => parts.join(":").toLowerCase().replace(/[^a-z0-9:]+/g, "-");

function matchLikelyRenames(removedColumns: Column[], addedColumns: Column[]) {
  const renamedColumns = new Map<string, Column>();
  const matchedNewNames = new Set<string>();

  for (const oldColumn of removedColumns) {
    const matchingColumn = addedColumns.find(
      (newColumn) => !matchedNewNames.has(newColumn.name) && describeColumnShape(newColumn) === describeColumnShape(oldColumn),
    );
    if (matchingColumn) {
      renamedColumns.set(oldColumn.name, matchingColumn);
      matchedNewNames.add(matchingColumn.name);
    }
  }

  return renamedColumns;
}

function compareColumns(beforeTable: Table, afterTable: Table): SchemaDiff[] {
  const oldColumnsByName = listByName(beforeTable.columns);
  const newColumnsByName = listByName(afterTable.columns);
  const removedColumns = beforeTable.columns.filter((column) => !newColumnsByName.has(column.name));
  const addedColumns = afterTable.columns.filter((column) => !oldColumnsByName.has(column.name));
  const renamedColumns = matchLikelyRenames(removedColumns, addedColumns);
  const renamedOldNames = new Set(renamedColumns.keys());
  const renamedNewNames = new Set([...renamedColumns.values()].map((column) => column.name));
  const changes: SchemaDiff[] = [];

  for (const [oldName, newColumn] of renamedColumns.entries()) {
    changes.push({
      id: makeChangeId(beforeTable.name, oldName, newColumn.name, "rename"),
      kind: "column_renamed",
      severity: "review",
      tableName: beforeTable.name,
      from: oldName,
      to: newColumn.name,
      summary: `${beforeTable.name}.${oldName} renamed to ${newColumn.name}`,
    });
  }

  for (const column of addedColumns.filter((item) => !renamedNewNames.has(item.name))) {
    changes.push({
      id: makeChangeId(beforeTable.name, column.name, "added"),
      kind: "column_added",
      severity: column.nullable || column.defaultValue ? "safe" : "review",
      tableName: beforeTable.name,
      columnName: column.name,
      summary: `${beforeTable.name}.${column.name} added as ${column.type}`,
    });
  }

  for (const column of removedColumns.filter((item) => !renamedOldNames.has(item.name))) {
    changes.push({
      id: makeChangeId(beforeTable.name, column.name, "removed"),
      kind: "column_removed",
      severity: "breaking",
      tableName: beforeTable.name,
      columnName: column.name,
      summary: `${beforeTable.name}.${column.name} removed`,
    });
  }

  for (const beforeColumn of beforeTable.columns) {
    const afterColumn = newColumnsByName.get(beforeColumn.name);
    if (!afterColumn) continue;

    if (beforeColumn.type !== afterColumn.type) {
      changes.push({
        id: makeChangeId(beforeTable.name, beforeColumn.name, "type"),
        kind: "column_retyped",
        severity: "breaking",
        tableName: beforeTable.name,
        columnName: beforeColumn.name,
        from: beforeColumn.type,
        to: afterColumn.type,
        summary: `${beforeTable.name}.${beforeColumn.name} changed from ${beforeColumn.type} to ${afterColumn.type}`,
      });
    }

    if (beforeColumn.nullable !== afterColumn.nullable) {
      changes.push({
        id: makeChangeId(beforeTable.name, beforeColumn.name, "nullable"),
        kind: "column_nullability_changed",
        severity: afterColumn.nullable ? "safe" : "review",
        tableName: beforeTable.name,
        columnName: beforeColumn.name,
        from: beforeColumn.nullable ? "nullable" : "required",
        to: afterColumn.nullable ? "nullable" : "required",
        summary: `${beforeTable.name}.${beforeColumn.name} changed from ${beforeColumn.nullable ? "nullable" : "required"} to ${afterColumn.nullable ? "nullable" : "required"}`,
      });
    }
  }

  return changes;
}

function compareIndexes(beforeTable: Table, afterTable: Table): SchemaDiff[] {
  const oldIndexesByName = listByName(beforeTable.indexes);
  const newIndexesByName = listByName(afterTable.indexes);
  const changes: SchemaDiff[] = [];

  for (const index of afterTable.indexes) {
    if (!oldIndexesByName.has(index.name)) {
      changes.push({
        id: makeChangeId(beforeTable.name, index.name, "index-added"),
        kind: "index_added",
        severity: "safe",
        tableName: beforeTable.name,
        indexName: index.name,
        summary: `${beforeTable.name}.${index.name} index added`,
      });
    }
  }

  for (const index of beforeTable.indexes) {
    if (!newIndexesByName.has(index.name)) {
      changes.push({
        id: makeChangeId(beforeTable.name, index.name, "index-removed"),
        kind: "index_removed",
        severity: "review",
        tableName: beforeTable.name,
        indexName: index.name,
        summary: `${beforeTable.name}.${index.name} index removed`,
      });
    }
  }

  return changes;
}

export function compareSchemas(before: Schema, after: Schema): SchemaDiff[] {
  const oldTablesByName = listByName(before.tables);
  const newTablesByName = listByName(after.tables);
  const changes: SchemaDiff[] = [];

  for (const table of after.tables) {
    const beforeTable = oldTablesByName.get(table.name);
    if (!beforeTable) {
      changes.push({
        id: makeChangeId(table.name, "table-added"),
        kind: "table_added",
        severity: "safe",
        tableName: table.name,
        summary: `${table.name} table added`,
      });
      continue;
    }

    changes.push(...compareColumns(beforeTable, table), ...compareIndexes(beforeTable, table));
  }

  for (const table of before.tables) {
    if (!newTablesByName.has(table.name)) {
      changes.push({
        id: makeChangeId(table.name, "table-removed"),
        kind: "table_removed",
        severity: "breaking",
        tableName: table.name,
        summary: `${table.name} table removed`,
      });
    }
  }

  return changes;
}
