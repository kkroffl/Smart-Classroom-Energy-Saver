import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 3001;
const ESP_TIMEOUT_MS = 6000; // ESP32 counts as offline after this much silence
const YOLO_TIMEOUT_MS = 10000; // same for the YOLO laptop

const APPLIANCES = [
  { key: "light", name: "Tube Light", watts: 36 },
  { key: "fan", name: "Ceiling Fan", watts: 75 },
  { key: "ac", name: "Air Conditioner", watts: 1500 },
];
const BASELINE_W = APPLIANCES.reduce((s, a) => s + a.watts, 0);
const THRESH = { darkLux: 400, fanTemp: 24.5, acTemp: 29, acPeople: 4 };

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Automation rules (used to explain each decision) ----------
function decide({ people, temp, lux }) {
  const occ = people > 0;
  const empty = { on: false, reason: "OFF: Room empty" };
  return {
    light: !occ
      ? empty
      : lux >= THRESH.darkLux
        ? { on: false, reason: "OFF: Sufficient daylight" }
        : { on: true, reason: "ON: Occupied & Dark" },
    fan: !occ
      ? empty
      : temp < THRESH.fanTemp
        ? { on: false, reason: `OFF: Temperature < ${THRESH.fanTemp}°C` }
        : { on: true, reason: `ON: Occupied & Temp ≥ ${THRESH.fanTemp}°C` },
    ac: !occ
      ? empty
      : people >= THRESH.acPeople
        ? { on: true, reason: `ON: Occupied & ${THRESH.acPeople}+ People` }
        : temp >= THRESH.acTemp
          ? { on: true, reason: `ON: Occupied & Temp ≥ ${THRESH.acTemp}°C` }
          : {
              on: false,
              reason: `OFF: <${THRESH.acPeople} People & Temp < ${THRESH.acTemp}°C`,
            },
  };
}

// ---------- State ----------
const store = {
  mode: "auto",
  manual: { light: false, fan: false, ac: false },
  esp: { temperature: null, humidity: null, lux: null, reported: null, at: 0 },
  yolo: { count: 0, at: 0 },
  energy: { usedWh: 0, baselineWh: 0, lastTick: Date.now() },
  history: [],
  log: [],
  logId: 0,
  lastApp: null,
  wasEsp: false,
  wasYolo: false,
  frame: null,
};
const clients = new Set();

const espOnline = () => Date.now() - store.esp.at < ESP_TIMEOUT_MS;
const yoloOnline = () => Date.now() - store.yolo.at < YOLO_TIMEOUT_MS;

function pushLog(group, device, action, reason) {
  store.log = [
    {
      id: ++store.logId,
      ts: new Date().toISOString(),
      group,
      device,
      action,
      reason,
    },
    ...store.log,
  ].slice(0, 50);
}
pushLog("system", "System", "INFO", "Server started");

// Current appliance states: manual commands, or what the ESP32 reported, explained by the rules
function effective() {
  if (!espOnline()) {
    const off = { on: false, reason: "OFF: ESP32 offline" };
    return { light: off, fan: off, ac: off };
  }
  const rules = decide({
    people: store.yolo.count,
    temp: store.esp.temperature ?? 0,
    lux: store.esp.lux ?? 0,
  });
  const out = {};
  for (const a of APPLIANCES) {
    if (store.mode === "manual") {
      const on = store.manual[a.key];
      out[a.key] = { on, reason: `${on ? "ON" : "OFF"}: Manual override` };
    } else {
      const reported = store.esp.reported?.[a.key];
      out[a.key] =
        typeof reported === "boolean" && reported !== rules[a.key].on
          ? { on: reported, reason: `${reported ? "ON" : "OFF"}: Set by ESP32` }
          : rules[a.key];
    }
  }
  return out;
}

function snapshot() {
  const { usedWh, baselineWh } = store.energy;
  const savedWh = Math.max(0, baselineWh - usedWh);
  return {
    online: { esp32: espOnline(), yolo: yoloOnline() },
    mode: store.mode,
    sensors: {
      temperature: store.esp.temperature,
      humidity: store.esp.humidity,
      lux: store.esp.lux,
    },
    people: store.yolo.count,
    appliances: effective(),
    energy: {
      usedWh,
      baselineWh,
      savedWh,
      pct: baselineWh > 0 ? (savedWh / baselineWh) * 100 : 0,
    },
    history: store.history,
    log: store.log,
  };
}

function broadcast() {
  const payload = `event: state\ndata: ${JSON.stringify(snapshot())}\n\n`;
  for (const res of clients) res.write(payload);
}

// Log appliance changes, then push the new state to every dashboard
function refresh() {
  const now = effective();
  if (store.lastApp) {
    for (const a of APPLIANCES) {
      if (store.lastApp[a.key].on !== now[a.key].on) {
        pushLog(a.key, a.name, now[a.key].on ? "ON" : "OFF", now[a.key].reason);
      }
    }
  }
  store.lastApp = now;
  broadcast();
}

// ---------- Hardware receivers ----------

// ESP32 -> POST every ~2 s
app.post("/api/sensors", (req, res) => {
  const { temperature, humidity, lux, appliances } = req.body ?? {};
  const t = Number(temperature);
  const l = Number(lux);
  if (!Number.isFinite(t) || !Number.isFinite(l)) {
    return res
      .status(400)
      .json({ ok: false, error: "temperature and lux are required numbers" });
  }
  const h = Number(humidity);
  store.esp = {
    temperature: t,
    humidity: Number.isFinite(h) ? h : null,
    lux: l,
    reported: appliances && typeof appliances === "object" ? appliances : null,
    at: Date.now(),
  };
  refresh();
  // The reply gives the ESP32 the YOLO people count and any manual commands
  res.json({
    ok: true,
    people: store.yolo.count,
    peopleFresh: yoloOnline(),
    mode: store.mode,
    manual: store.manual,
  });
});

// YOLO laptop -> POST about once per second
app.post("/api/people", (req, res) => {
  const count = Number(req.body?.count);
  if (!Number.isInteger(count) || count < 0 || count > 500) {
    return res
      .status(400)
      .json({ ok: false, error: "count must be a whole number 0-500" });
  }
  store.yolo = { count, at: Date.now() };
  refresh();
  res.json({ ok: true });
});

// YOLO laptop -> optional annotated JPEG frames for the camera box
app.post(
  "/api/frame",
  express.raw({ type: "image/jpeg", limit: "2mb" }),
  (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "send raw JPEG bytes with Content-Type: image/jpeg",
        });
    }
    store.frame = req.body;
    res.json({ ok: true });
  },
);

app.get("/api/frame.jpg", (_req, res) => {
  if (!store.frame) return res.status(404).end();
  res.set({ "Content-Type": "image/jpeg", "Cache-Control": "no-store" });
  res.send(store.frame);
});

// ---------- Dashboard API ----------
app.get("/api/status", (_req, res) => res.json(snapshot()));

app.post("/api/control", (req, res) => {
  const { mode, device, state: on } = req.body ?? {};

  if (mode !== undefined) {
    if (!["auto", "manual"].includes(mode)) {
      return res
        .status(400)
        .json({ ok: false, error: "mode must be auto or manual" });
    }
    if (mode !== store.mode) {
      if (mode === "manual") {
        const cur = effective();
        store.manual = Object.fromEntries(
          APPLIANCES.map((a) => [a.key, cur[a.key].on]),
        );
      }
      store.mode = mode;
      pushLog(
        "system",
        "System",
        "INFO",
        `Switched to ${mode === "auto" ? "Auto" : "Manual Override"} mode`,
      );
      refresh();
    }
    return res.json({ ok: true });
  }

  if (device !== undefined) {
    if (!APPLIANCES.some((a) => a.key === device)) {
      return res.status(404).json({ ok: false, error: "Unknown device" });
    }
    if (store.mode !== "manual") {
      return res
        .status(409)
        .json({ ok: false, error: "Switch to manual mode first" });
    }
    if (typeof on !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, error: "state must be true or false" });
    }
    store.manual[device] = on;
    refresh();
    return res.json({ ok: true });
  }

  res
    .status(400)
    .json({ ok: false, error: "Send { mode } or { device, state }" });
});

// ---------- Live updates (Server-Sent Events) ----------
app.get("/api/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write(`event: state\ndata: ${JSON.stringify(snapshot())}\n\n`);
  clients.add(res);
  const ping = setInterval(() => res.write(": ping\n\n"), 25000);
  req.on("close", () => {
    clearInterval(ping);
    clients.delete(res);
  });
});

// ---------- Background tasks ----------
// Every 2 s: accumulate energy, detect online/offline changes
setInterval(() => {
  const now = Date.now();
  const hours = (now - store.energy.lastTick) / 3.6e6;
  store.energy.lastTick = now;

  if (espOnline()) {
    const eff = effective();
    const watts = APPLIANCES.reduce(
      (s, a) => s + (eff[a.key].on ? a.watts : 0),
      0,
    );
    store.energy.usedWh += watts * hours;
    store.energy.baselineWh += BASELINE_W * hours;
  }

  const e = espOnline();
  const y = yoloOnline();
  if (e !== store.wasEsp) {
    pushLog(
      "system",
      "System",
      "INFO",
      e ? "ESP32 connected" : "ESP32 went offline",
    );
    store.wasEsp = e;
  }
  if (y !== store.wasYolo) {
    pushLog(
      "system",
      "System",
      "INFO",
      y ? "YOLO feed connected" : "YOLO feed went offline",
    );
    store.wasYolo = y;
  }
  refresh();
}, 2000);

// Every 3 s: add a point to the chart history while the ESP32 is online
setInterval(() => {
  if (!espOnline()) return;
  store.history = [
    ...store.history,
    { ts: Date.now(), people: store.yolo.count, temp: store.esp.temperature },
  ].slice(-60);
}, 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Classroom Energy server running on port ${PORT}`);
  console.log(
    `ESP32 and YOLO laptop should POST to http://<this-computer-LAN-IP>:${PORT}`,
  );
});
