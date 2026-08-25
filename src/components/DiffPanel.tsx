import { AlertTriangle, CheckCircle2, GitCompareArrows } from "lucide-react";
import type { SchemaDiff } from "../types/schema";

type Props = {
  from: string;
  to: string;
  changes: SchemaDiff[];
};

function severityLabel(severity: SchemaDiff["severity"]) {
  return severity === "breaking" ? "Breaking" : severity === "review" ? "Review" : "Safe";
}

export function DiffPanel({ from, to, changes }: Props) {
  return (
    <section className="side-panel">
      <div className="panel-title">
        <GitCompareArrows size={18} />
        <div>
          <p className="eyebrow">Change review</p>
          <h2>
            {from} → {to}
          </h2>
        </div>
      </div>
      <div className="diff-list">
        {changes.length === 0 ? (
          <div className="empty-state">These branches currently match.</div>
        ) : (
          changes.map((change) => (
            <article className={`diff-card ${change.severity}`} key={change.id}>
              {change.severity === "breaking" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <div>
                <strong>{change.summary}</strong>
                <span>{severityLabel(change.severity)}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
