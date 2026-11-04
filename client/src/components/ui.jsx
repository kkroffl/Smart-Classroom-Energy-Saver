import { motion } from "framer-motion";
import { C } from "../constants";

export const Card = ({ className = "", glow, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`relative rounded-2xl border border-white/10 bg-[#151C28]/80 p-5 backdrop-blur-xl transition-colors hover:border-cyan-400/30 ${className}`}
    style={{
      boxShadow: glow
        ? `0 0 0 1px ${glow}55, 0 0 30px ${glow}30`
        : "0 8px 32px rgba(0,0,0,.35)",
    }}
  >
    {children}
  </motion.div>
);

export const Pill = ({ color = C.cyan, children }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
    style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
  >
    {children}
  </span>
);

export const Label = ({ icon: Icon, text, color = C.cyan }) => (
  <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
    <Icon size={16} style={{ color }} /> {text}
  </div>
);

export const Switch = ({ on, disabled, onClick }) => (
  <button
    role="switch"
    aria-checked={on}
    disabled={disabled}
    onClick={onClick}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-slate-700"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
  >
    <span
      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`}
    />
  </button>
);
