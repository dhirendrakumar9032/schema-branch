import { GitBranch, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Branch } from "../types/schema";

type Props = {
  branches: Branch[];
  activeBranchId: string;
  compareBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onSelectCompare: (branchId: string) => void;
  onCreateBranch: (branchName: string) => void;
};

export function WorkspaceSidebar({ branches, activeBranchId, compareBranchId, onSelectBranch, onSelectCompare, onCreateBranch }: Props) {
  const [branchName, setBranchName] = useState("");
  const cleanBranchName = branchName.trim();
  const branchNameExists = branches.some((branch) => branch.name.toLowerCase() === cleanBranchName.toLowerCase());
  const canCreateBranch = cleanBranchName.length > 0 && !branchNameExists;

  const createBranch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateBranch) return;
    onCreateBranch(cleanBranchName);
    setBranchName("");
  };

  return (
    <aside className="branch-rail">
      <div className="rail-title">
        <GitBranch size={18} />
        <span>Workspace</span>
      </div>
      <div className="branch-list">
        {branches.map((branch) => (
          <button
            className={branch.id === activeBranchId ? "branch-button active" : "branch-button"}
            key={branch.id}
            onClick={() => onSelectBranch(branch.id)}
          >
            <span>{branch.name}</span>
            <small>{branch.schema.tables.length} tables</small>
          </button>
        ))}
      </div>
      <form className="branch-create-form" onSubmit={createBranch}>
        <label className="field-label" htmlFor="new-branch-name">
          New branch name
        </label>
        <input
          id="new-branch-name"
          value={branchName}
          onChange={(event) => setBranchName(event.target.value)}
          placeholder="Enter Branch Name"
          autoFocus
        />
        {branchNameExists ? <small className="input-hint">That branch already exists.</small> : null}
        <button className="secondary-button" type="submit" disabled={!canCreateBranch}>
          <Plus size={16} />
          Branch current
        </button>
      </form>
      <label className="field-label" htmlFor="compare-branch">
        Review changes from
      </label>
      <select id="compare-branch" value={compareBranchId} onChange={(event) => onSelectCompare(event.target.value)}>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </aside>
  );
}
