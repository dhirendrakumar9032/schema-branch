import { useMemo, useReducer } from "react";
import { branchesForDemo, commerceSchema } from "../data/demoWorkspace";
import type { Branch, ColumnType, Schema, Table } from "../types/schema";

type WorkspaceState = {
  branches: Branch[];
  activeBranchId: string;
  compareBranchId: string;
  selectedTableId: string;
};

type WorkspaceAction =
  | { type: "select_branch"; branchId: string }
  | { type: "select_compare_branch"; branchId: string }
  | { type: "select_table"; tableId: string }
  | { type: "create_branch"; branchName: string }
  | { type: "add_table" }
  | { type: "add_column"; tableId: string }
  | { type: "rename_column"; tableId: string; columnId: string; name: string }
  | { type: "change_column_type"; tableId: string; columnId: string; columnType: ColumnType }
  | { type: "toggle_nullable"; tableId: string; columnId: string }
  | { type: "merge_schema_into_compare"; schema: Schema };

const getTimestamp = () => new Date().toISOString();
const makeLocalId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

const initialWorkspace: WorkspaceState = {
  branches: branchesForDemo,
  activeBranchId: "branch_billing",
  compareBranchId: "branch_main",
  selectedTableId: "tbl_orders",
};

function updateBranchSchema(branches: Branch[], branchId: string, changeSchema: (schema: Schema) => Schema) {
  return branches.map((branch) =>
    branch.id === branchId ? { ...branch, schema: changeSchema(branch.schema), updatedAt: getTimestamp() } : branch,
  );
}

function updateTableInSchema(schema: Schema, tableId: string, changeTable: (table: Table) => Table): Schema {
  return {
    ...schema,
    tables: schema.tables.map((table) => (table.id === tableId ? changeTable(table) : table)),
  };
}

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  const activeBranch = state.branches.find((branch) => branch.id === state.activeBranchId);

  switch (action.type) {
    case "select_branch": {
      const branch = state.branches.find((item) => item.id === action.branchId);
      return branch
        ? {
            ...state,
            activeBranchId: branch.id,
            selectedTableId: branch.schema.tables[0]?.id ?? "",
          }
        : state;
    }
    case "select_compare_branch":
      return { ...state, compareBranchId: action.branchId };
    case "select_table":
      return { ...state, selectedTableId: action.tableId };
    case "create_branch": {
      if (!activeBranch) return state;
      const branchName = action.branchName.trim();
      const isNameTaken = state.branches.some((branch) => branch.name.toLowerCase() === branchName.toLowerCase());
      if (!branchName || isNameTaken) return state;

      const branch: Branch = {
        id: makeLocalId("branch"),
        name: branchName,
        baseBranchId: activeBranch.id,
        baseSchema: activeBranch.schema,
        schema: activeBranch.schema,
        updatedAt: getTimestamp(),
      };
      return { ...state, branches: [...state.branches, branch], activeBranchId: branch.id, selectedTableId: branch.schema.tables[0]?.id ?? "" };
    }
    case "add_table": {
      const table: Table = {
        id: makeLocalId("tbl"),
        name: `new_table_${state.branches.length}`,
        columns: [{ id: makeLocalId("col"), name: "id", type: "uuid", nullable: false }],
        indexes: [],
      };
      return {
        ...state,
        branches: updateBranchSchema(state.branches, state.activeBranchId, (schema) => ({ ...schema, tables: [...schema.tables, table] })),
        selectedTableId: table.id,
      };
    }
    case "add_column":
      return {
        ...state,
        branches: updateBranchSchema(state.branches, state.activeBranchId, (schema) =>
          updateTableInSchema(schema, action.tableId, (table) => ({
            ...table,
            columns: [...table.columns, { id: makeLocalId("col"), name: `new_column_${table.columns.length}`, type: "text", nullable: true }],
          })),
        ),
      };
    case "rename_column":
      return {
        ...state,
        branches: updateBranchSchema(state.branches, state.activeBranchId, (schema) =>
          updateTableInSchema(schema, action.tableId, (table) => ({
            ...table,
            columns: table.columns.map((column) => (column.id === action.columnId ? { ...column, name: action.name } : column)),
          })),
        ),
      };
    case "change_column_type":
      return {
        ...state,
        branches: updateBranchSchema(state.branches, state.activeBranchId, (schema) =>
          updateTableInSchema(schema, action.tableId, (table) => ({
            ...table,
            columns: table.columns.map((column) => (column.id === action.columnId ? { ...column, type: action.columnType } : column)),
          })),
        ),
      };
    case "toggle_nullable":
      return {
        ...state,
        branches: updateBranchSchema(state.branches, state.activeBranchId, (schema) =>
          updateTableInSchema(schema, action.tableId, (table) => ({
            ...table,
            columns: table.columns.map((column) => (column.id === action.columnId ? { ...column, nullable: !column.nullable } : column)),
          })),
        ),
      };
    case "merge_schema_into_compare": {
      const compare = state.branches.find((branch) => branch.id === state.compareBranchId);
      if (!compare) return state;
      return {
        ...state,
        branches: state.branches.map((branch) =>
          branch.id === state.compareBranchId ? { ...branch, schema: action.schema, baseSchema: commerceSchema, updatedAt: getTimestamp() } : branch,
        ),
      };
    }
    default:
      return state;
  }
}

export function useSchemaWorkspace() {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspace);
  const activeBranch = state.branches.find((branch) => branch.id === state.activeBranchId) ?? state.branches[0];
  const compareBranch = state.branches.find((branch) => branch.id === state.compareBranchId) ?? state.branches[0];
  const selectedTable = activeBranch.schema.tables.find((table) => table.id === state.selectedTableId) ?? activeBranch.schema.tables[0];

  return useMemo(
    () => ({
      branches: state.branches,
      activeBranch,
      compareBranch,
      selectedTable,
      selectBranch: (branchId: string) => dispatch({ type: "select_branch", branchId }),
      selectCompareBranch: (branchId: string) => dispatch({ type: "select_compare_branch", branchId }),
      selectTable: (tableId: string) => dispatch({ type: "select_table", tableId }),
      createBranch: (branchName: string) => dispatch({ type: "create_branch", branchName }),
      addTable: () => dispatch({ type: "add_table" }),
      addColumn: (tableId: string) => dispatch({ type: "add_column", tableId }),
      renameColumn: (tableId: string, columnId: string, name: string) => dispatch({ type: "rename_column", tableId, columnId, name }),
      changeColumnType: (tableId: string, columnId: string, columnType: ColumnType) =>
        dispatch({ type: "change_column_type", tableId, columnId, columnType }),
      toggleNullable: (tableId: string, columnId: string) => dispatch({ type: "toggle_nullable", tableId, columnId }),
      mergeSchemaIntoCompare: (schema: Schema) => dispatch({ type: "merge_schema_into_compare", schema }),
    }),
    [state.branches, activeBranch, compareBranch, selectedTable],
  );
}
