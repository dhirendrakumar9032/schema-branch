import { Plus, Table2 } from "lucide-react";
import type { ColumnType, Schema, Table } from "../types/schema";

const columnTypes: ColumnType[] = ["uuid", "text", "integer", "decimal", "boolean", "timestamp"];

type Props = {
  schema: Schema;
  selectedTable?: Table;
  onSelectTable: (tableId: string) => void;
  onAddTable: () => void;
  onAddColumn: (tableId: string) => void;
  onRenameColumn: (tableId: string, columnId: string, name: string) => void;
  onChangeColumnType: (tableId: string, columnId: string, type: ColumnType) => void;
  onToggleNullable: (tableId: string, columnId: string) => void;
};

export function SchemaEditor({
  schema,
  selectedTable,
  onSelectTable,
  onAddTable,
  onAddColumn,
  onRenameColumn,
  onChangeColumnType,
  onToggleNullable,
}: Props) {
  return (
    <section className="editor">
      <div className="section-header">
        <div>
          <p className="eyebrow">Schema workspace</p>
          <h2>{schema.name}</h2>
        </div>
        <button className="primary-button" onClick={onAddTable}>
          <Plus size={16} />
          Table
        </button>
      </div>

      <div className="editor-grid">
        <div className="table-list">
          {schema.tables.map((table) => (
            <button
              key={table.id}
              className={selectedTable?.id === table.id ? "table-button active" : "table-button"}
              onClick={() => onSelectTable(table.id)}
            >
              <Table2 size={16} />
              <span>{table.name}</span>
            </button>
          ))}
        </div>

        <div className="table-detail">
          {selectedTable ? (
            <>
              <div className="detail-title">
                <h3>{selectedTable.name}</h3>
                <button className="secondary-button" onClick={() => onAddColumn(selectedTable.id)}>
                  <Plus size={16} />
                  Column
                </button>
              </div>
              <div className="column-grid column-grid-header">
                <span>Name</span>
                <span>Type</span>
                <span>Nullable</span>
              </div>
              {selectedTable.columns.map((column) => (
                <div className="column-grid" key={column.id}>
                  <input value={column.name} onChange={(event) => onRenameColumn(selectedTable.id, column.id, event.target.value)} />
                  <select value={column.type} onChange={(event) => onChangeColumnType(selectedTable.id, column.id, event.target.value as ColumnType)}>
                    {columnTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <label className="toggle-label">
                    <input type="checkbox" checked={column.nullable} onChange={() => onToggleNullable(selectedTable.id, column.id)} />
                    <span>{column.nullable ? "Yes" : "No"}</span>
                  </label>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state">Create a table to start evolving this branch.</div>
          )}
        </div>
      </div>
    </section>
  );
}
