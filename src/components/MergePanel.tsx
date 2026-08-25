import { ArrowRight, GitMerge, ShieldAlert, ShieldCheck } from "lucide-react";
import type { MergeChoice, MergeConflict } from "../types/schema";

type Props = {
  status: "ready" | "blocked" | "resolved";
  conflicts: MergeConflict[];
  choices: Record<string, MergeChoice>;
  resolvedCount: number;
  targetBranchName: string;
  sourceBranchName: string;
  onChoose: (conflictId: string, choice: MergeChoice) => void;
  onMerge: () => void;
};

export function MergePanel({
  status,
  conflicts,
  choices,
  resolvedCount,
  targetBranchName,
  sourceBranchName,
  onChoose,
  onMerge,
}: Props) {
  const canMerge = status === "ready" || status === "resolved";

  return (
    <section className="merge-panel">
      <div className="panel-title">
        <GitMerge size={18} />
        <div>
          <p className="eyebrow">Merge</p>
          <h2>{canMerge ? "Looks safe" : "Review first"}</h2>
        </div>
      </div>

      {canMerge ? (
        <div className="merge-state ready">
          <div className="merge-icon success">
            <ShieldCheck size={20} />
          </div>
          <div>
            <strong>{status === "resolved" ? "Decisions applied" : "No conflicts found"}</strong>
            <p>
              {status === "resolved"
                ? `Your selected versions are ready to merge into ${targetBranchName}.`
                : `This branch can be merged into ${targetBranchName} without manual cleanup.`}
            </p>
          </div>
          <button className="primary-button" onClick={onMerge}>
            <GitMerge size={16} />
            Merge into {targetBranchName}
          </button>
        </div>
      ) : (
        <div className="merge-state blocked">
          <div className="merge-icon warning">
            <ShieldAlert size={20} />
          </div>
          <div>
            <strong>{conflicts.length} item needs a decision</strong>
            <p>
              Choose what should be kept in {targetBranchName}. {resolvedCount}/{conflicts.length} selected.
            </p>
          </div>
          <div className="conflict-list">
            {conflicts.map((conflict) => (
              <div className="conflict-card" key={conflict.id}>
                <div className="conflict-title">
                  <span>{conflict.tableName}</span>
                  <ArrowRight size={14} />
                  <strong>{conflict.field}</strong>
                </div>
                <div className="choice-grid">
                  <button
                    className={choices[conflict.id] === "target" ? "choice-button selected" : "choice-button"}
                    onClick={() => onChoose(conflict.id, "target")}
                  >
                    <span>Keep {targetBranchName}</span>
                    <strong>{conflict.targetValue}</strong>
                  </button>
                  <button
                    className={choices[conflict.id] === "source" ? "choice-button selected" : "choice-button"}
                    onClick={() => onChoose(conflict.id, "source")}
                  >
                    <span>Use {sourceBranchName}</span>
                    <strong>{conflict.sourceValue}</strong>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="secondary-button" disabled={resolvedCount !== conflicts.length} onClick={onMerge}>
            {resolvedCount === conflicts.length ? `merge into ${targetBranchName}` : "merge paused"}
          </button>
        </div>
      )}
    </section>
  );
}
