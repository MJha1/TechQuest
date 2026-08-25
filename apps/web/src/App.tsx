import { RouterProvider } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { router } from "@/routes";
import { setUnauthorizedHandler } from "@/lib/api";

// When any API call comes back unauthorized (an expired/missing session), send
// the parent to the login screen instead of leaving them on a broken page. The
// guard on /login means an already-there user won't loop. Registered once, at
// module load, so it's in place before the first request.
setUnauthorizedHandler(() => {
  if (router.state.location.pathname !== "/login") {
    void router.navigate("/login");
  }
});

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
