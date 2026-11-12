import { useCallback, useEffect, useRef, useState } from "react";
import { getHealth } from "../services/api.js";

/**
 * Fetches the real backend status from GET /api/health.
 * Exposes loading, success and error states to the page.
 */
export function useSystemHealth() {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: null,
  });

  // Prevents an older request from overwriting a newer result.
  const latestRequest = useRef(0);

  const check = useCallback(async () => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    setState({ status: "loading", data: null, error: null });

    try {
      const response = await getHealth();
      if (latestRequest.current === requestId) {
        setState({ status: "success", data: response.data, error: null });
      }
    } catch (error) {
      if (latestRequest.current === requestId) {
        setState({
          status: "error",
          data: null,
          error: error.message || "Could not reach the API.",
        });
      }
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    check,
  };
}
