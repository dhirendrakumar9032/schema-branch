import { useEffect, useMemo, useReducer } from "react";
import type { MergeChoice, MergeConflict } from "../types/schema";

type DecisionAction =
  | { type: "choose"; conflictId: string; choice: MergeChoice }
  | { type: "sync"; conflictIds: string[] };

function mergeDecisionReducer(state: Record<string, MergeChoice>, action: DecisionAction) {
  switch (action.type) {
    case "choose":
      return { ...state, [action.conflictId]: action.choice };
    case "sync":
      return Object.fromEntries(Object.entries(state).filter(([id]) => action.conflictIds.includes(id))) as Record<string, MergeChoice>;
    default:
      return state;
  }
}

export function useMergeDecisions(conflicts: MergeConflict[]) {
  const [choices, dispatch] = useReducer(mergeDecisionReducer, {});
  const conflictIds = useMemo(() => conflicts.map((conflict) => conflict.id), [conflicts]);

  useEffect(() => {
    dispatch({ type: "sync", conflictIds });
  }, [conflictIds]);

  const resolvedCount = conflicts.filter((conflict) => choices[conflict.id]).length;

  return {
    choices,
    resolvedCount,
    allResolved: conflicts.length > 0 && resolvedCount === conflicts.length,
    chooseConflict: (conflictId: string, choice: MergeChoice) => dispatch({ type: "choose", conflictId, choice }),
  };
}
