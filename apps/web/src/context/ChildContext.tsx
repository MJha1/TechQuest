import * as React from "react";
import type { Child } from "@techquest/shared";
import { listChildren } from "@/lib/api";

/**
 * Active-child context.
 *
 * Children have no login; a parent "operates" one child at a time. This context
 * holds the parent's children (fetched once — the API scopes them to the parent,
 * so membership here *is* the ownership check) and which child is currently
 * active. The active child id is persisted per browser so a refresh keeps the
 * learning session; if that id is not among the parent's children (deleted, or a
 * different parent signed in) it is cleared. `RequireChild` reads this to gate
 * the learning routes — no page re-implements the check.
 */
const STORAGE_KEY = "techquest.activeChildId";

type Status = "loading" | "ready" | "error";

interface ChildContextValue {
  status: Status;
  children: Child[];
  activeChild: Child | null;
  setActiveChild: (child: Child) => void;
  /** Make a child active by id (e.g. from the parent dashboard). */
  enterChild: (childId: string) => void;
  clearActiveChild: () => void;
  /** Re-fetch the child list (e.g. after adding a child). */
  refresh: () => Promise<void>;
}

const ChildContext = React.createContext<ChildContextValue | null>(null);

function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function writeStoredId(id: string | null): void {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode) — fall back to in-memory only */
  }
}

export function ChildProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = React.useState<Child[] | null>(null);
  const [error, setError] = React.useState<boolean>(false);
  const [activeChildId, setActiveChildId] = React.useState<string | null>(() => readStoredId());

  const refresh = React.useCallback(async () => {
    try {
      setError(false);
      const data = await listChildren();
      setList(data);
    } catch {
      setError(true);
      setList((prev) => prev ?? []);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // Drop a stored id that no longer belongs to the signed-in parent.
  React.useEffect(() => {
    if (list && activeChildId && !list.some((c) => c.id === activeChildId)) {
      writeStoredId(null);
      setActiveChildId(null);
    }
  }, [list, activeChildId]);

  const setActiveChild = React.useCallback((child: Child) => {
    writeStoredId(child.id);
    setActiveChildId(child.id);
  }, []);

  const enterChild = React.useCallback((childId: string) => {
    writeStoredId(childId);
    setActiveChildId(childId);
  }, []);

  const clearActiveChild = React.useCallback(() => {
    writeStoredId(null);
    setActiveChildId(null);
  }, []);

  const activeChild = React.useMemo(
    () => list?.find((c) => c.id === activeChildId) ?? null,
    [list, activeChildId],
  );

  const status: Status = list === null ? "loading" : error ? "error" : "ready";

  const value = React.useMemo<ChildContextValue>(
    () => ({
      status,
      children: list ?? [],
      activeChild,
      setActiveChild,
      enterChild,
      clearActiveChild,
      refresh,
    }),
    [status, list, activeChild, setActiveChild, enterChild, clearActiveChild, refresh],
  );

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>;
}

export function useChildContext(): ChildContextValue {
  const ctx = React.useContext(ChildContext);
  if (!ctx) throw new Error("useChildContext must be used within a <ChildProvider>");
  return ctx;
}
