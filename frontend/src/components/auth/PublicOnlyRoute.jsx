import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { roleHome } from "../../utils/roles.js";

/**
 * Used by the public auth pages (login, register).
 * A signed-in visitor is sent straight to their workspace instead of
 * seeing a form they do not need.
 */
export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-ink-950"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={22}
            className="animate-spin text-brand-400"
            aria-hidden="true"
          />
          <p className="text-xs text-mist-400">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}
