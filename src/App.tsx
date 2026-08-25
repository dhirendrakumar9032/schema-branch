import { GitCompareArrows, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar";
import { DiffPanel } from "./components/DiffPanel";
import { MergePanel } from "./components/MergePanel";
import { SchemaEditor } from "./components/SchemaEditor";
import { useBranchComparison } from "./hooks/useBranchComparison";
import { useMergeDecisions } from "./hooks/useMergeDecisions";
import { useMergePlan } from "./hooks/useMergePlan";
import { useSchemaWorkspace } from "./hooks/useSchemaWorkspace";
import { useTheme } from "./hooks/useTheme";
import type { MergeChoice } from "./types/schema";
import "./styles.css";

const noMergeDecisions: Record<string, MergeChoice> = {};

export default function App() {
  const workspace = useSchemaWorkspace();
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const branchChanges = useBranchComparison(workspace.compareBranch.schema, workspace.activeBranch.schema);
  const unresolvedMergePlan = useMergePlan(
    workspace.activeBranch.baseSchema,
    workspace.compareBranch.schema,
    workspace.activeBranch.schema,
    noMergeDecisions,
  );
  const mergeDecisions = useMergeDecisions(unresolvedMergePlan.conflicts);
  const mergePlan = useMergePlan(
    workspace.activeBranch.baseSchema,
    workspace.compareBranch.schema,
    workspace.activeBranch.schema,
    mergeDecisions.choices,
  );

  const openWorkspace = () => {
    document.getElementById("schema-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMenuOpen(false);
  };

  return (
    <main className="app-shell">
      <div className="binary-field" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index}>1 0 1 1 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0 1 0 0 1 1 0 1 1 0</span>
        ))}
      </div>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
          </div>
          <div>
            <h1>Schema Branch</h1>
          </div>
        </div>
        <button
          className="menu-button"
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="site-navigation"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav
          id="site-navigation"
          className={isMenuOpen ? "topbar-actions open" : "topbar-actions"}
          aria-label="Primary navigation"
        >
          <div className="nav-pill">
            <GitCompareArrows size={15} />
            <span>
              {workspace.compareBranch.name} / {workspace.activeBranch.name}
            </span>
          </div>
          <div className="nav-pill nav-pill-short">Assignment</div>
          <button className="nav-button" type="button" onClick={openWorkspace}>
            Open Branches
          </button>
          <button
            className={theme.isDark ? "theme-toggle dark" : "theme-toggle"}
            type="button"
            aria-label={theme.isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme.isDark}
            onClick={theme.toggleTheme}
          >
            <Sun className="theme-icon sun-icon" size={14} />
            <span className="theme-knob" />
            <Moon className="theme-icon moon-icon" size={14} />
          </button>
        </nav>
      </header>

      <section className="hero-strip">
        <p>• SCHEMA VERSION CONTROL · BRANCH · DIFF · MERGE</p>
        <h2>
          Make database changes <mark>reviewable</mark> before they ship.
        </h2>
      </section>

      <div className="workspace" id="schema-workspace">
        <WorkspaceSidebar
          branches={workspace.branches}
          activeBranchId={workspace.activeBranch.id}
          compareBranchId={workspace.compareBranch.id}
          onSelectBranch={workspace.selectBranch}
          onSelectCompare={workspace.selectCompareBranch}
          onCreateBranch={workspace.createBranch}
        />

        <SchemaEditor
          schema={workspace.activeBranch.schema}
          selectedTable={workspace.selectedTable}
          onSelectTable={workspace.selectTable}
          onAddTable={workspace.addTable}
          onAddColumn={workspace.addColumn}
          onRenameColumn={workspace.renameColumn}
          onChangeColumnType={workspace.changeColumnType}
          onToggleNullable={workspace.toggleNullable}
        />

        <div className="inspector-column">
          <DiffPanel from={workspace.compareBranch.name} to={workspace.activeBranch.name} changes={branchChanges} />
          <MergePanel
            status={mergePlan.status}
            conflicts={mergePlan.conflicts}
            choices={mergeDecisions.choices}
            resolvedCount={mergeDecisions.resolvedCount}
            targetBranchName={workspace.compareBranch.name}
            sourceBranchName={workspace.activeBranch.name}
            onChoose={mergeDecisions.chooseConflict}
            onMerge={() => workspace.mergeSchemaIntoCompare(mergePlan.schema)}
          />
        </div>
      </div>
    </main>
  );
}
