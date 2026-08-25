import { Link } from "react-router-dom";
import { APP_NAME } from "@techquest/shared";
import { buttonVariants } from "@/components/ui/button";

/**
 * Public landing page — the front door of the parent journey:
 * Landing → Signup → Create Child → Child Home.
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-4 max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-lg text-muted-foreground">
          Curious kids, aged 8–12, learn how technology and AI really work — one
          short, playful mission at a time. Parents stay in control.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/signup" className={buttonVariants({ size: "lg" })}>
          Get started
        </Link>
        <Link to="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Log in
        </Link>
      </div>
    </main>
  );
}
