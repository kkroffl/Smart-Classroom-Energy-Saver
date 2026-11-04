import { motion } from "framer-motion";
import { Clock, Cpu, Wifi, WifiOff } from "lucide-react";
import { C } from "../constants";
import { Pill } from "./ui";

export default function Header({ online, now, mode, onMode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0F17]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-white sm:text-lg">
              Smart Classroom Energy Saver
            </h1>
            <p className="text-xs text-slate-400">
              ESP32 · DHT11 · LDR · YOLOv8
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Pill color={online ? C.on : C.red}>
            <span className="relative flex h-2 w-2">
              {online && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: online ? C.on : C.red }}
              />
            </span>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            ESP32 {online ? "Online" : "Offline"}
          </Pill>

          <div className="flex items-center gap-1.5 text-sm tabular-nums text-slate-300">
            <Clock size={14} className="text-slate-500" />
            {now.toLocaleTimeString([], { hour12: false })}
          </div>

          <div className="relative flex rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold">
            {[
              ["auto", "Auto Mode"],
              ["manual", "Manual Override"],
            ].map(([id, text]) => (
              <button
                key={id}
                onClick={() => onMode(id)}
                className={`relative z-10 rounded-full px-3 py-1.5 transition-colors ${mode === id ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                {mode === id && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 -z-10 rounded-full"
                    style={{ background: id === "auto" ? C.indigo : C.warn }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
