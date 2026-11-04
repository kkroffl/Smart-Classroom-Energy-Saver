import { Fan, Lightbulb, Snowflake } from "lucide-react";

export const C = {
  on: "#10B981",
  off: "#334155",
  warn: "#F59E0B",
  cyan: "#06B6D4",
  indigo: "#6366F1",
  red: "#EF4444",
};

export const DARK_LUX = 400;

export const APPLIANCES = [
  { key: "light", name: "Tube Light", pin: 25, watts: 36, Icon: Lightbulb },
  { key: "fan", name: "Ceiling Fan", pin: 26, watts: 75, Icon: Fan },
  { key: "ac", name: "Air Conditioner", pin: 27, watts: 1500, Icon: Snowflake },
];

export const BASELINE_W = APPLIANCES.reduce((s, a) => s + a.watts, 0);
