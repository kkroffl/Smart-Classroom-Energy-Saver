import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Video, VideoOff } from "lucide-react";
import { Card } from "./ui";

export default function CameraPanel({ people, yoloOnline }) {
  const [show, setShow] = useState(true);
  const [tick, setTick] = useState(0);
  const [hasFrame, setHasFrame] = useState(false);

  // Refresh the latest frame while the stream is visible
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setTick((t) => t + 1), 800);
    return () => clearInterval(id);
  }, [show]);

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Live Camera</h2>
          <p className="text-xs text-slate-500">YOLOv8 person detection</p>
        </div>
        <button
          onClick={() => setShow((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
        >
          {show ? <VideoOff size={14} /> : <Video size={14} />}{" "}
          {show ? "Hide" : "Show"}
        </button>
      </div>

      <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
        <AnimatePresence mode="wait">
          {show ? (
            <motion.div
              key="on"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={`/api/frame.jpg?t=${tick}`}
                alt="Live classroom feed"
                onLoad={() => setHasFrame(true)}
                onError={() => setHasFrame(false)}
                className={`h-full w-full object-cover ${hasFrame ? "" : "hidden"}`}
              />
              {!hasFrame && (
                <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-slate-500">
                  Waiting for frames from the YOLO laptop…
                </div>
              )}
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${yoloOnline ? "animate-pulse bg-red-500" : "bg-slate-500"}`}
                />
                {yoloOnline ? "LIVE" : "OFFLINE"}
              </div>
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                {people} detected
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="off"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center text-sm text-slate-500"
            >
              <div className="text-center">
                <VideoOff className="mx-auto mb-2" size={28} /> Stream hidden
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
