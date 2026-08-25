import type {
  ApiResponse,
  Child,
  CreateChildInput,
  UpdateChildInput,
} from "@techquest/shared";
import { API_BASE } from "./config";

/** Error carrying the API's machine-readable failure code. */
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
 * Thin JSON fetch wrapper around the shared response envelope. Sends cookies so
 * the Better Auth session travels with every request, and unwraps `{ ok, data }`
 * — throwing an `ApiRequestError` on a failure envelope.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json()) as ApiResponse<T>;
  if (!body.ok) {
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
