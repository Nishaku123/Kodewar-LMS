import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "../utils/cn.js";

const ToastContext = createContext(null);

const toneStyles = {
  info: {
    icon: "text-cyan-300",
    border: "border-cyan-400/20",
    Icon: Info,
  },
  success: {
    icon: "text-emerald-300",
    border: "border-emerald-400/20",
    Icon: CheckCircle2,
  },
  warning: {
    icon: "text-amber-300",
    border: "border-amber-300/20",
    Icon: AlertTriangle,
  },
  danger: {
    icon: "text-rose-300",
    border: "border-rose-400/20",
    Icon: XCircle,
  },
};

let nextToastId = 0;

function ToastItem({ toast, onDismiss }) {
  const style = toneStyles[toast.tone] || toneStyles.info;
  const Icon = style.Icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-ink-900/95 px-4 py-3.5 shadow-2xl shadow-black/40 backdrop-blur",
        style.border
      )}
    >
      <Icon
        size={17}
        strokeWidth={1.9}
        className={cn("mt-0.5 shrink-0", style.icon)}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs leading-5 text-mist-400">
            {toast.description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-mist-500 transition-colors hover:bg-ink-800 hover:text-white"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * App-wide notifications. Wrap the app once, then call useToast() anywhere.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description = "", tone = "info", duration = 4000 }) => {
      const id = ++nextToastId;

      // Keep at most 4 toasts on screen so the UI never gets crowded.
      setToasts((current) => [
        ...current.slice(-3),
        { id, title, description, tone },
      ]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-end gap-2 p-4 sm:p-6">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider.");
  }

  return context;
}
