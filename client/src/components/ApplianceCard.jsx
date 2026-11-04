import { motion } from "framer-motion";
import { C } from "../constants";
import { Card, Switch } from "./ui";

export default function ApplianceCard({ a, s, manualMode, onToggle }) {
  const { on, reason } = s;
  const color = on ? C.on : C.off;
  return (
    <Card glow={on ? C.on : null}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-xl"
            style={{ background: `${color}22`, color: on ? C.on : "#94A3B8" }}
          >
            <a.Icon
              size={26}
              className={on && a.key === "fan" ? "animate-spin" : ""}
              style={{
                animationDuration: "1.2s",
                filter: on ? `drop-shadow(0 0 6px ${C.on})` : "none",
              }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">{a.name}</h3>
            <p className="text-xs text-slate-500">
              ESP32 GPIO {a.pin} · {a.watts} W
            </p>
          </div>
        </div>
        <motion.div
          key={String(on)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl px-4 py-1.5 text-lg font-extrabold tracking-wide"
          style={{
            background: `${color}22`,
            color: on ? C.on : "#94A3B8",
            border: `1px solid ${color}66`,
            textShadow: on ? `0 0 12px ${C.on}` : "none",
          }}
        >
          {on ? "ON" : "OFF"}
        </motion.div>
      </div>

      <p className="mt-4 rounded-lg bg-black/20 px-3 py-2 text-sm text-slate-300">
        {reason}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {manualMode
            ? "Manual override"
            : "Auto-controlled · enable Manual mode"}
        </span>
        <Switch on={on} disabled={!manualMode} onClick={onToggle} />
      </div>
    </Card>
  );
}
