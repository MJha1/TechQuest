import { HealthSchema, type Health } from "@techquest/shared";

/**
 * Health service. Kept shallow on purpose (no DB dependency) so `/api/health`
 * is a fast liveness signal. A deeper readiness check (DB ping) can be added as
 * a separate endpoint later.
 *
 * The service id is a stable internal identifier, intentionally decoupled from
 * the user-facing product name (APP_NAME) — that rebranded to "Byte Buddies",
 * but this id stays "TechQuest-api" so monitoring/log filters don't break.
 */
const SERVICE_ID = "TechQuest-api";

export async function getHealthStatus(): Promise<Health> {
  return HealthSchema.parse({ status: "ok", service: SERVICE_ID });
}
