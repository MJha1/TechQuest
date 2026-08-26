import type {
  ApiResponse,
  Child,
  CreateChildInput,
  UpdateChildInput,
  Mission,
  MissionDetail,
  ChildMissionSummary,
  ChildMissionState,
  AnswerResult,
  CompleteResult,
  BadgeStatus,
  ParentDashboard,
  Recommendation,
  HintResult,
  ActivityInfo,
  ActivityResult,
  ParentFeedbackResult,
} from "@techquest/shared";
import { APP_NAME } from "@techquest/shared";
import { API_BASE } from "./config";

/** Error carrying a safe, machine-readable failure code. Never wraps a raw error. */
export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/**
 * Handler invoked once when a request comes back unauthorized (session expired
 * or missing). The app registers one that sends the parent to /login. Kept as a
 * module-level hook so this non-React module can react without importing the
 * router (which would create an import cycle).
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

/**
 * Thin JSON fetch wrapper around the shared response envelope. Sends cookies so
 * the Better Auth session travels with every request, and unwraps `{ ok, data }`.
 *
 * Every failure path resolves to an `ApiRequestError` with a safe message — a
 * network drop, a non-JSON response (a proxy/gateway error page), a 401, or a
 * `{ ok: false }` envelope. Raw fetch/JSON errors, statuses, stack traces, and
 * server internals are never surfaced to the caller (or the UI).
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    // Offline, DNS failure, connection reset, request aborted — no server reply.
    throw new ApiRequestError(
      "NETWORK",
      `We couldn't reach ${APP_NAME}. Please check your connection and try again.`,
    );
  }

  // A structured envelope is expected; a proxy/gateway may return HTML instead.
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  // Session expiry / missing session: notify the app (→ redirect to login) once.
  if (res.status === 401 || (body && !body.ok && body.error.code === "UNAUTHORIZED")) {
    onUnauthorized?.();
    throw new ApiRequestError("UNAUTHORIZED", "Your session has ended. Please log in again.");
  }

  if (!body) {
    // Unparseable response (e.g. a 5xx gateway page). Map by status; leak nothing.
    throw new ApiRequestError("SERVER", "Something went wrong on our end. Please try again.");
  }

  if (!body.ok) {
    // Backend error messages are already sanitized (500s are generic server-side).
    throw new ApiRequestError(body.error.code, body.error.message);
  }
  return body.data;
}

/** The authenticated parent's own children. */
export const listChildren = (): Promise<Child[]> => request<Child[]>("/api/children");

/** Create a child under the authenticated parent. */
export const createChild = (input: CreateChildInput): Promise<Child> =>
  request<Child>("/api/children", { method: "POST", body: JSON.stringify(input) });

/** Fetch one of the parent's children by id. */
export const getChild = (id: string): Promise<Child> =>
  request<Child>(`/api/children/${id}`);

/** Update one of the parent's children. */
export const updateChild = (id: string, input: UpdateChildInput): Promise<Child> =>
  request<Child>(`/api/children/${id}`, { method: "PATCH", body: JSON.stringify(input) });

// ── Mission engine ──────────────────────────────────────────────────────────

/** Published mission catalog (summaries). */
export const listMissions = (): Promise<Mission[]> => request<Mission[]>("/api/missions");

/** A single mission with its sanitized steps. */
export const getMission = (id: string): Promise<MissionDetail> =>
  request<MissionDetail>(`/api/missions/${id}`);

/** A child's missions with progress. */
export const listChildMissions = (childId: string): Promise<ChildMissionSummary[]> =>
  request<ChildMissionSummary[]>(`/api/children/${childId}/missions`);

/** A deterministic "what should I do next?" recommendation for a child. */
export const getChildRecommendation = (childId: string): Promise<Recommendation> =>
  request<Recommendation>(`/api/children/${childId}/recommendation`);

/** A child's badges (earned + locked). */
export const listChildBadges = (childId: string): Promise<BadgeStatus[]> =>
  request<BadgeStatus[]>(`/api/children/${childId}/badges`);

/** The parent's educational dashboard (all their children). */
export const getParentDashboard = (): Promise<ParentDashboard> =>
  request<ParentDashboard>("/api/parent/dashboard");

/** Ask the AI service for a short, age-appropriate hint (never the answer). */
export const requestHint = (input: {
  missionContext: string;
  learningObjective: string;
  question: string;
  attempt?: string;
}): Promise<HintResult> =>
  request<HintResult>("/api/ai/hint", { method: "POST", body: JSON.stringify(input) });

/** The catalog of controlled AI learning activities. */
export const listAiActivities = (): Promise<ActivityInfo[]> =>
  request<ActivityInfo[]>("/api/ai/activities");

/** Run one controlled AI learning activity by key. */
export const runAiActivity = (
  activity: string,
  input: Record<string, string>,
): Promise<ActivityResult> =>
  request<ActivityResult>(`/api/ai/activities/${activity}`, {
    method: "POST",
    body: JSON.stringify(input),
  });

/** Submit parent product feedback (a rating + optional comment). */
export const submitFeedback = (input: {
  rating: string;
  comment?: string;
}): Promise<ParentFeedbackResult> =>
  request<ParentFeedbackResult>("/api/feedback", { method: "POST", body: JSON.stringify(input) });

/** Start or resume a mission for a child. */
export const startMission = (missionId: string, childId: string): Promise<ChildMissionState> =>
  request<ChildMissionState>(`/api/missions/${missionId}/start`, {
    method: "POST",
    body: JSON.stringify({ childId }),
  });

/** Submit an answer to a step; the backend grades it. */
export const answerStep = (
  missionId: string,
  stepId: string,
  childId: string,
  response: unknown,
): Promise<AnswerResult> =>
  request<AnswerResult>(`/api/missions/${missionId}/steps/${stepId}/answer`, {
    method: "POST",
    body: JSON.stringify({ childId, response }),
  });

/** Complete a mission (idempotent). */
export const completeMission = (missionId: string, childId: string): Promise<CompleteResult> =>
  request<CompleteResult>(`/api/missions/${missionId}/complete`, {
    method: "POST",
    body: JSON.stringify({ childId }),
  });
