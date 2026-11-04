import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C } from "../constants";
import { Card } from "./ui";

export default function TrendChart({ history }) {
  return (
    <Card className="h-full">
      <h2 className="font-semibold text-white">Live Analytics & Trends</h2>
      <p className="mb-3 text-xs text-slate-500">People count vs temperature</p>
      <div className="relative h-72">
        {history.length === 0 && (
          <p className="absolute inset-0 z-10 grid place-items-center text-sm text-slate-500">
            Waiting for ESP32 data…
          </p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={history}
            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="t" stroke="#64748B" fontSize={11} minTickGap={40} />
            <YAxis
              yAxisId="p"
              stroke={C.indigo}
              fontSize={11}
              allowDecimals={false}
              domain={[0, (max) => Math.max(8, max)]}
            />
            <YAxis
              yAxisId="t"
              orientation="right"
              stroke={C.cyan}
              fontSize={11}
              domain={["dataMin - 1", "dataMax + 1"]}
              tickFormatter={(v) => Math.round(v)}
            />
            <Tooltip
              contentStyle={{
                background: "#0B0F17",
                border: "1px solid #ffffff20",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="p"
              dataKey="people"
              name="People"
              fill={C.indigo}
              fillOpacity={0.6}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              yAxisId="t"
              type="monotone"
              dataKey="temp"
              name="Temp (°C)"
              stroke={C.cyan}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
