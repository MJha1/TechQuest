import * as React from "react";
import { cn } from "@/lib/utils";

const DEFAULT_MAX_TILT = 8; // degrees at the corners

/**
 * Wraps content in a pointer-driven 3D tilt: the surface rotates toward the
 * cursor on a perspective plane and lifts slightly — an Animista-style "3D card"
 * built from a plain CSS transform, no animation library.
 *
 * Input- and accessibility-aware by design:
 *  - only activates for fine, hover-capable pointers (desktop mice/trackpads),
 *    so touch devices keep their flat tap/press affordances;
 *  - a no-op under `prefers-reduced-motion` — the transform stays flat.
 * It updates CSS custom properties (not React state) on pointer move, so there
 * are no re-renders while tilting.
 */
export function TiltCard({
  className,
  children,
  max = DEFAULT_MAX_TILT,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { max?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const enabled = React.useRef(false);

  React.useEffect(() => {
    // Guard matchMedia: absent in some test/SSR environments (e.g. jsdom).
    if (typeof window.matchMedia !== "function") return;
    enabled.current =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  function reset(el: HTMLDivElement) {
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tilt-lift", "0");
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !enabled.current) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 .. 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    // Rotate toward the cursor: top tilts back, cursor side comes forward.
    el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
    el.style.setProperty("--tilt-lift", "1");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => ref.current && reset(ref.current)}
      className={cn("tilt-card", className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
