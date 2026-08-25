import { useMemo } from "react";
import { compareSchemas } from "../domain/compareSchemas";
import type { Schema } from "../types/schema";

export function useBranchComparison(baseSchema: Schema, branchSchema: Schema) {
  return useMemo(() => compareSchemas(baseSchema, branchSchema), [baseSchema, branchSchema]);
}
