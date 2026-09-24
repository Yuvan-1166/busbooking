import { useCallback, useEffect, useState } from "react";
import { api } from "../../../api";
import { defaultRange, PRESETS } from "./dateRange";

/**
 * Owns all analytics state: date range, active preset, admin operator scope,
 * operators list, fetch lifecycle and reload.
 */
export function useAnalytics(role = "operator") {
  const isAdmin = role === "admin";

  const [range, setRange] = useState(() => defaultRange());
  const [operatorId, setOperatorId] = useState("all");
  const [operators, setOperators] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return undefined;
    api
      .getOperators()
      .then(setOperators)
      .catch(() => setOperators([]));
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const effectiveOperator =
        isAdmin && operatorId !== "all" ? Number(operatorId) : undefined;
      const payload = await api.getAnalytics(
        range.from,
        range.to,
        effectiveOperator,
      );
      setData(payload);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, operatorId, range]);

  useEffect(() => {
    load();
  }, [load]);

  const setPreset = (key) => {
    const preset = PRESETS.find((entry) => entry.key === key);
    if (!preset) return;
    setRange(preset.range());
  };

  return {
    isAdmin,
    range,
    setRange,
    setPreset,
    operatorId,
    setOperatorId,
    operators,
    data,
    loading,
    error,
    reload: load,
  };
}