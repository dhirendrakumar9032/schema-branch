export type ColumnType = "uuid" | "text" | "integer" | "decimal" | "boolean" | "timestamp";

export type Column = {
  id: string;
  name: string;
  type: ColumnType;
  nullable: boolean;
  defaultValue?: string;
};

export type Index = {
  id: string;
  name: string;
  columns: string[];
  unique: boolean;
};

export type Table = {
  id: string;
  name: string;
  columns: Column[];
  indexes: Index[];
};

export type Schema = {
  id: string;
  name: string;
  tables: Table[];
};

export type Branch = {
  id: string;
  name: string;
  baseBranchId?: string;
  baseSchema: Schema;
  schema: Schema;
  updatedAt: string;
};

export type DiffSeverity = "safe" | "review" | "breaking";

export type SchemaDiff =
  | {
      id: string;
      kind: "table_added" | "table_removed";
      severity: DiffSeverity;
      tableName: string;
      summary: string;
    }
  | {
      id: string;
      kind: "column_added" | "column_removed";
      severity: DiffSeverity;
      tableName: string;
      columnName: string;
      summary: string;
    }
  | {
      id: string;
      kind: "column_renamed";
      severity: DiffSeverity;
      tableName: string;
      from: string;
      to: string;
      summary: string;
    }
  | {
      id: string;
      kind: "column_retyped" | "column_nullability_changed";
      severity: DiffSeverity;
      tableName: string;
      columnName: string;
      from: string;
      to: string;
      summary: string;
    }
  | {
      id: string;
      kind: "index_added" | "index_removed";
      severity: DiffSeverity;
      tableName: string;
      indexName: string;
      summary: string;
    };

export type MergeConflict = {
  id: string;
  tableName: string;
  field: string;
  targetLabel: string;
  sourceLabel: string;
  targetValue: string;
  sourceValue: string;
  summary: string;
};

export type MergeChoice = "target" | "source";
