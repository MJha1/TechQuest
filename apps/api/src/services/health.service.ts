import { APP_NAME, HealthSchema, type Health } from "@techquest/shared";

/**
 * Health service. Kept shallow on purpose (no DB dependency) so `/api/health`
 * is a fast liveness signal. A deeper readiness check (DB ping) can be added as
 * a separate endpoint later.
 */
export async function getHealthStatus(): Promise<Health> {
  return HealthSchema.parse({ status: "ok", service: `${APP_NAME}-api` });
}
