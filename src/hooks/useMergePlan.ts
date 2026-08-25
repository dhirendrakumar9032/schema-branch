import { useMemo } from "react";
import { planSchemaMerge } from "../domain/planMerge";
import type { MergeChoice, Schema } from "../types/schema";

export function useMergePlan(baseSchema: Schema, targetSchema: Schema, branchSchema: Schema, decisions: Record<string, MergeChoice>) {
  return useMemo(
    () => planSchemaMerge(baseSchema, targetSchema, branchSchema, decisions),
    [baseSchema, targetSchema, branchSchema, decisions],
  );
}
