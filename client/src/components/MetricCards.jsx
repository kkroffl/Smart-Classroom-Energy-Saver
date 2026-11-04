import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Droplets, Moon, Sun, Thermometer, Users, Zap } from "lucide-react";
import { BASELINE_W, C, DARK_LUX } from "../constants";
import { Card, Label, Pill } from "./ui";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function comfort(t) {
  if (t < 22) return { label: "Cool", color: C.cyan };
  if (t <= 26) return { label: "Comfortable", color: C.on };
  if (t <= 29) return { label: "Warm", color: C.warn };
  return { label: "Hot", color: C.red };
}

export function PeopleCard({ people, yoloOnline }) {
  const occupied = people > 0;
  return (
    <Card>
      <Label icon={Users} text="People Count" color={C.indigo} />
      <div className="mt-3 flex items-end justify-between">
        <motion.span
          key={people}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold tabular-nums text-white"
        >
          {people}
        </motion.span>
        <Pill color={occupied ? C.on : C.off}>
          {occupied ? "Occupied" : "Empty"}
        </Pill>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {yoloOnline
          ? "Live from YOLOv8 detection"
          : "YOLO feed offline · showing last count"}
      </p>
    </Card>
  );
}

export function ClimateCard({ temp, hum, history }) {
  const has = temp != null;
  const cz = has ? comfort(temp) : null;
  return (
    <Card>
      <Label icon={Thermometer} text="Temperature & Humidity" color={C.warn} />
      <div className="mt-3 flex items-end justify-between">
        <span className="text-4xl font-bold tabular-nums text-white">
          {has ? temp.toFixed(1) : "--"}
          <span className="text-xl text-slate-400">°C</span>
        </span>
        {cz && <Pill color={cz.color}>{cz.label}</Pill>}
      </div>
      <div className="mt-1 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.5} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
            <Area
              type="monotone"
              dataKey="temp"
              stroke={C.cyan}
              strokeWidth={2}
              fill="url(#spark)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Droplets size={12} className="text-cyan-400" /> Humidity{" "}
        {hum != null ? `${Math.round(hum)}%` : "--"}
      </p>
    </Card>
  );
}

export function LightCard({ lux }) {
  const has = lux != null;
  const bright = has && lux >= DARK_LUX;
  const color = bright ? C.warn : C.indigo;
  return (
    <Card>
      <Label
        icon={bright ? Sun : Moon}
        text="Ambient Light (LDR)"
        color={color}
      />
      <div className="mt-3 flex items-end justify-between">
        <span className="text-4xl font-bold tabular-nums text-white">
          {has ? Math.round(lux) : "--"}
          <span className="ml-1 text-xl text-slate-400">lux</span>
        </span>
        {has && (
          <Pill color={color}>{bright ? "Bright Day" : "Dark Room"}</Pill>
        )}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${has ? clamp(lux / 10, 0, 100) : 0}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Dark room below {DARK_LUX} lux
      </p>
    </Card>
  );
}

export function EnergyCard({ energy }) {
  return (
    <Card glow={C.on}>
      <Label icon={Zap} text="Energy Savings" color={C.on} />
      <div className="mt-3 flex items-end justify-between">
        <span className="text-4xl font-bold tabular-nums text-emerald-400">
          {energy.pct.toFixed(1)}
          <span className="text-xl">%</span>
        </span>
        <span className="text-sm font-semibold tabular-nums text-slate-300">
          {energy.savedWh.toFixed(2)} Wh saved
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          animate={{ width: `${clamp(energy.pct, 0, 100)}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        vs always-on baseline ({BASELINE_W} W)
      </p>
    </Card>
  );
}
