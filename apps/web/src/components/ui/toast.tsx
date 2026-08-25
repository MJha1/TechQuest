import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal toast system for transient feedback (saved, error, etc.). Kept as a
 * small context provider instead of a heavy dependency; motion is a single
 * short slide-in. Wrap the app in <ToastProvider> and render <Toaster/> once.
 */
type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. Defaults to 4000. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

const VARIANT_META: Record<ToastVariant, { icon: React.ElementType; accent: string }> = {
  default: { icon: Info, accent: "text-foreground" },
  success: { icon: CheckCircle2, accent: "text-success" },
  error: { icon: XCircle, accent: "text-destructive" },
  warning: { icon: AlertTriangle, accent: "text-warning" },
  info: { icon: Info, accent: "text-info" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = Math.random().toString(36).slice(2);
      const item: ToastItem = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? "default",
        duration: options.duration ?? 4000,
      };
      setToasts((prev) => [...prev, item]);
      const timer = setTimeout(() => dismiss(id), item.duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4"
    >
      {toasts.map((t) => {
        const { icon: Icon, accent } = VARIANT_META[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg animate-toast-in"
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", accent)} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
