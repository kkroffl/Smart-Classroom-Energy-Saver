import { useCallback, useEffect, useState } from "react";

export function useDashboard() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  // Live state pushed by the server (auto-reconnects)
  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.addEventListener("state", (e) => setData(JSON.parse(e.data)));
    return () => source.close();
  }, []);

  const control = useCallback(async (body) => {
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn("Control failed:", err.error || res.status);
      }
    } catch (err) {
      console.error("Control request failed", err);
    }
  }, []);

  const setMode = useCallback((mode) => control({ mode }), [control]);
  const toggleDevice = useCallback(
    (device, state) => control({ device, state }),
    [control],
  );

  return { data, connected, setMode, toggleDevice };
}
