# Smart Classroom Energy Saver

A real-time IoT dashboard that reduces classroom energy waste. An ESP32 reads temperature, humidity, and ambient light, a YOLOv8 script counts people from a webcam, and the system switches the tube light, fan, and air conditioner only when they are needed. A React dashboard shows everything live and lets you override the automation manually.

<!-- Add a screenshot: ![Dashboard](docs/dashboard.png) -->

## Features

- **Live metrics:** people count, temperature and humidity with a trend sparkline, ambient light, and energy savings.
- **Automatic appliance control:** each appliance shows its ON/OFF state and the reason behind it (for example, "ON: Occupied & Dark").
- **Manual override:** switch between Auto and Manual mode and control each appliance from the dashboard.
- **Energy savings tracking:** actual consumption is compared against an always-on baseline.
- **Live analytics:** a dual-axis chart of people count and temperature over time.
- **Camera view:** annotated YOLOv8 frames streamed from the detection laptop.
- **Event log:** the last 50 events with search, device filters, and CSV export.
- **Connection awareness:** ESP32 and YOLO online/offline status is detected automatically.

## System Architecture

```
┌──────────────────┐   POST /api/sensors    ┌─────────────────────────┐
│  ESP32           │ ─────────────────────▶ │  Node.js server         │
│  DHT11 · LDR     │ ◀───────────────────── │  (Express, port 3001)   │
│  3 LEDs          │   people, mode, manual │                         │
└──────────────────┘                        │  • receives hardware    │
                                            │    data                 │
┌──────────────────┐   POST /api/people     │  • holds system state   │
│  YOLOv8 laptop   │ ─────────────────────▶ │  • logs events          │
│  (Python)        │   POST /api/frame      │  • tracks energy        │
└──────────────────┘                        └────────────┬────────────┘
                                                         │ Server-Sent Events
                                                         ▼
                                            ┌─────────────────────────┐
                                            │  React dashboard        │
                                            │  (Vite, port 5173)      │
                                            └─────────────────────────┘
```

The ESP32 posts sensor readings every ~2 seconds. The server's reply gives it the latest YOLO people count and any manual commands from the dashboard. The server pushes every state change to the dashboard in real time.

## Tech Stack

| Layer     | Technology                                                       |
| --------- | ---------------------------------------------------------------- |
| Dashboard | React 18, Vite, Tailwind CSS v4, Recharts, Framer Motion, Lucide |
| Server    | Node.js, Express (REST + Server-Sent Events)                     |
| Hardware  | ESP32, DHT11, LDR, 3 LEDs                                        |
| Detection | Python, YOLOv8, OpenCV                                           |

## Hardware

| Component            | Purpose                                                          | Connection                   |
| -------------------- | ---------------------------------------------------------------- | ---------------------------- |
| ESP32                | Reads sensors, drives appliances, talks to the server over Wi-Fi | n/a                          |
| DHT11                | Temperature and humidity                                         | Your chosen GPIO             |
| LDR                  | Ambient light                                                    | Your chosen analog pin       |
| LED: Tube Light      | Appliance indicator                                              | GPIO 25                      |
| LED: Ceiling Fan     | Appliance indicator                                              | GPIO 26                      |
| LED: Air Conditioner | Appliance indicator                                              | GPIO 27                      |
| Webcam               | People counting                                                  | Connected to the YOLO laptop |

## Project Structure

```
classroom-energy/
├── server/
│   ├── package.json
│   └── server.js            # API, state, automation explanations, SSE
└── client/
    ├── package.json
    ├── vite.config.js       # Tailwind plugin + /api proxy to the server
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx
        ├── constants.js
        ├── hooks/useDashboard.js
        └── components/
            ├── ui.jsx
            ├── Header.jsx
            ├── MetricCards.jsx
            ├── ApplianceCard.jsx
            ├── TrendChart.jsx
            ├── CameraPanel.jsx
            └── LogPanel.jsx
```

## Getting Started

### Prerequisites

- Node.js 18 or newer (check with `node -v`)
- The ESP32 and the YOLO laptop on the **same Wi-Fi network** as the computer running the server (the ESP32 supports 2.4 GHz only)

### Installation

```bash
# Server
cd server
npm install

# Dashboard
cd ../client
npm install
```

### Running

Use two terminals:

```bash
# Terminal 1: server
cd server
npm run dev

# Terminal 2: dashboard
cd client
npm run dev
```

Open **http://localhost:5173**. The dashboard shows "Connecting to the dashboard server…" until the server is running.

### Network setup

1. Find the server computer's IP address with `ipconfig` (use the IPv4 address of the Wi-Fi adapter, for example `192.168.17.42`).
2. Use that IP as the server address in the ESP32 firmware and in the YOLO script.
3. Allow port **3001** through the firewall. On Windows, run this in an Administrator Command Prompt:
   ```
   netsh advfirewall firewall add rule name="ClassroomEnergy" dir=in action=allow protocol=TCP localport=3001
   ```
4. To verify the path, open `http://<server-ip>:3001/api/status` in a browser on another device on the same network. You should see JSON.

The server computer's IP can change when it reconnects to Wi-Fi. If the hardware stops connecting, check the IP again.

## Hardware Integration

### ESP32 → server

Send a `POST` to `http://<server-ip>:3001/api/sensors` about every 2 seconds:

```json
{
  "temperature": 27.4,
  "humidity": 55,
  "lux": 620,
  "appliances": { "light": true, "fan": false, "ac": false }
}
```

`temperature` and `lux` are required. `humidity` and `appliances` are optional.

The server replies with what the ESP32 needs to act on:

```json
{
  "ok": true,
  "people": 3,
  "peopleFresh": true,
  "mode": "auto",
  "manual": { "light": false, "fan": false, "ac": false }
}
```

- In **auto** mode, the ESP32 applies the automation rules (below) using `people`.
- In **manual** mode, the ESP32 copies the `manual` states onto its LEDs.

### YOLO laptop → server

Send the person count about once per second:

```python
import requests, cv2

SERVER = "http://192.168.17.XXX:3001"  # server computer's IP

requests.post(f"{SERVER}/api/people", json={"count": person_count}, timeout=2)

# Optional: send the annotated frame for the dashboard's camera box
ok, jpg = cv2.imencode(".jpg", annotated_frame)
requests.post(
    f"{SERVER}/api/frame",
    data=jpg.tobytes(),
    headers={"Content-Type": "image/jpeg"},
    timeout=2,
)
```

## Automation Rules

| Appliance       | Turns ON when                                                       | Otherwise                                    |
| --------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| Tube Light      | Room occupied **and** light below 400 lux                           | OFF ("Room empty" or "Sufficient daylight")  |
| Ceiling Fan     | Room occupied **and** temperature ≥ 24.5 °C                         | OFF ("Room empty" or "Temperature < 24.5°C") |
| Air Conditioner | Room occupied **and** (4 or more people **or** temperature ≥ 29 °C) | OFF                                          |

The ESP32 firmware must use the same thresholds so the dashboard and hardware agree. If the ESP32 reports a state that differs from these rules, the dashboard shows it as "Set by ESP32".

Thresholds are defined in `THRESH` in `server/server.js` (and `DARK_LUX` in `client/src/constants.js` for the light display). The `lux` value should be on a roughly 0 to 1000 scale, so map your raw LDR reading accordingly.

**Energy model:** appliance power is 36 W (light), 75 W (fan), and 1500 W (AC). Savings are measured against an always-on baseline of 1611 W, accumulated while the ESP32 is online since the server started.

## API Reference

| Method | Endpoint         | Used by     | Description                                                                       |
| ------ | ---------------- | ----------- | --------------------------------------------------------------------------------- |
| `POST` | `/api/sensors`   | ESP32       | Report temperature, humidity, lux, and appliance states                           |
| `POST` | `/api/people`    | YOLO laptop | Report the current people count (`{"count": 3}`)                                  |
| `POST` | `/api/frame`     | YOLO laptop | Upload the latest JPEG frame (`Content-Type: image/jpeg`)                         |
| `GET`  | `/api/frame.jpg` | Dashboard   | Fetch the latest camera frame                                                     |
| `GET`  | `/api/status`    | Any client  | Current full system state as JSON                                                 |
| `POST` | `/api/control`   | Dashboard   | `{"mode":"auto"\|"manual"}` or `{"device":"fan","state":true}` (manual mode only) |
| `GET`  | `/api/events`    | Dashboard   | Live state stream (Server-Sent Events)                                            |

## Behavior Notes

- The ESP32 is marked **offline** after 6 seconds without a post, and the YOLO feed after 10 seconds. These are logged as system events.
- State, event history, and energy totals are held in server memory and reset when the server restarts.
- The chart keeps the last 60 data points (one every 3 seconds), and the log keeps the last 50 events.
- There is no authentication, so run the server on a trusted local network only.

## Troubleshooting

| Problem                                                      | Likely cause and fix                                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `'vite' is not recognized`                                   | Dependencies aren't installed. Run `npm install` in the `client` folder.                    |
| Dashboard stuck on "Connecting…"                             | The server isn't running. Start it with `npm run dev` in `server`.                          |
| ESP32 gets `HTTP -1` / connection refused                    | Wrong server IP, server not running, or the firewall is blocking port 3001.                 |
| ESP32 can't join Wi-Fi                                       | Wrong credentials, or the network is 5 GHz only.                                            |
| Everything shows OFF with "ESP32 offline"                    | No sensor data has arrived in the last 6 seconds. Check the ESP32's Serial Monitor.         |
| Camera box says "Waiting for frames"                         | The YOLO script isn't posting to `/api/frame`, or the laptop can't reach the server.        |
| Hardware connects on a hotspot but not on college/home Wi-Fi | The network may isolate devices from each other. Use a phone hotspot for all three devices. |

## Roadmap

- Persist history and energy totals to a database
- Add authentication for the control endpoint
- Add multi-classroom support
- Add daily and weekly energy reports
