import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { roleHome } from "../../utils/roles.js";

function SessionLoader() {
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

/**
 * Blocks a route until the session is known.
 *
 * - While the session is loading, a small loader is shown.
 * - Signed-out visitors are sent to /login and returned afterwards.
 * - A signed-in user without the required role is sent to their own home.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}
