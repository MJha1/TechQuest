import { z } from "zod";

/**
 * JSON value type + schema, reused for free-form payload fields (mission step
 * content, child responses, event payloads). Keeps those fields validated
 * without resorting to `any`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(JsonSchema),
  ]),
);
