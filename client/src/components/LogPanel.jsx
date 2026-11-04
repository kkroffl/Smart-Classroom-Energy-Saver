import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Search } from "lucide-react";
import { C } from "../constants";
import { Card, Pill } from "./ui";

const FILTERS = [
  ["all", "All"],
  ["light", "Light"],
  ["fan", "Fan"],
  ["ac", "AC"],
  ["system", "System"],
];
const ACTION_COLOR = { ON: C.on, OFF: "#94A3B8", INFO: C.cyan };

export default function LogPanel({ log }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      log.filter(
        (e) =>
          (filter === "all" || e.group === filter) &&
          `${e.device} ${e.action} ${e.reason}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [log, filter, q],
  );

  const exportCsv = () => {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      ["Timestamp", "Device", "Action", "Reason"],
      ...rows.map((e) => [
        new Date(e.ts).toLocaleString(),
        e.device,
        e.action,
        e.reason,
      ]),
    ]
      .map((r) => r.map(esc).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `classroom-log-${Date.now()}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">History & Action Log</h2>
          <p className="text-xs text-slate-500">
            Last {log.length} of 50 events
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events…"
              className="w-44 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            />
          </div>
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
            {FILTERS.map(([id, text]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${filter === id ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
              >
                {text}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#0F1520] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Timestamp</th>
              <th className="px-4 py-2.5 font-medium">Device</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Automation Reason</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((e) => (
                <motion.tr
                  key={e.id}
                  initial={{
                    opacity: 0,
                    backgroundColor: "rgba(6,182,212,.18)",
                  }}
                  animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                  transition={{ duration: 0.8 }}
                  className="border-t border-white/5"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-slate-400">
                    {new Date(e.ts).toLocaleTimeString([], { hour12: false })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-200">
                    {e.device}
                  </td>
                  <td className="px-4 py-2.5">
                    <Pill color={ACTION_COLOR[e.action]}>{e.action}</Pill>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{e.reason}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            No events match your filter.
          </p>
        )}
      </div>
    </Card>
  );
}
