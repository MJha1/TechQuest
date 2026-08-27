import { cn } from "@/lib/utils";
import { CHOICE_TEMPLATES, type ChoiceTemplateId } from "./templates";

/**
 * "Switch template" control (Wordwall-style): re-render the current question as
 * a different interactive game. Every template answers the same graded question,
 * so switching is purely how the child likes to play. Compact by default (icon +
 * label rows) for the mission side panel.
 */
export function TemplateSwitcher({
  value,
  onChange,
  className,
}: {
  value: ChoiceTemplateId;
  onChange: (id: ChoiceTemplateId) => void;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Switch template
      </h3>
      <ul className="grid grid-cols-2 gap-2 xl:grid-cols-1">
        {CHOICE_TEMPLATES.map((t) => {
          const active = value === t.id;
          const Icon = t.icon;
          return (
            <li key={t.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(t.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm font-medium transition-all duration-150",
                  "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md",
                    active ? "bg-primary text-primary-foreground" : "bg-secondary",
                  )}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
