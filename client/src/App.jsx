import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "./hooks/useDashboard";
import { APPLIANCES } from "./constants";
import Header from "./components/Header";
import {
  ClimateCard,
  EnergyCard,
  LightCard,
  PeopleCard,
} from "./components/MetricCards";
import ApplianceCard from "./components/ApplianceCard";
import TrendChart from "./components/TrendChart";
import CameraPanel from "./components/CameraPanel";
import LogPanel from "./components/LogPanel";

export default function App() {
  const { data, connected, setMode, toggleDevice } = useDashboard();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const history = useMemo(
    () =>
      (data?.history ?? []).map((p) => ({
        t: new Date(p.ts).toLocaleTimeString([], { hour12: false }),
        people: p.people,
        temp: p.temp,
      })),
    [data?.history],
  );

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0B0F17] text-slate-400">
        Connecting to the dashboard server…
      </div>
    );
  }

  const manualMode = data.mode === "manual";

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#0B0F17] text-slate-200 antialiased"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-60 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <Header
        online={data.online.esp32}
        now={now}
        mode={data.mode}
        onMode={setMode}
      />

      {!connected && (
        <div className="bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-300">
          Lost connection to the server. Reconnecting…
        </div>
      )}

      <main className="relative mx-auto max-w-7xl space-y-5 px-4 py-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PeopleCard people={data.people} yoloOnline={data.online.yolo} />
          <ClimateCard
            temp={data.sensors.temperature}
            hum={data.sensors.humidity}
            history={history}
          />
          <LightCard lux={data.sensors.lux} />
          <EnergyCard energy={data.energy} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {APPLIANCES.map((a) => (
            <ApplianceCard
              key={a.key}
              a={a}
              s={data.appliances[a.key]}
              manualMode={manualMode}
              onToggle={() => toggleDevice(a.key, !data.appliances[a.key].on)}
            />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TrendChart history={history} />
          </div>
          <div className="lg:col-span-2">
            <CameraPanel people={data.people} yoloOnline={data.online.yolo} />
          </div>
        </section>

        <LogPanel log={data.log} />
      </main>
    </div>
  );
}
