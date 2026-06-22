// ArduinoWidget component extracted from AppBuilder.jsx
import React from 'react';
import {
    Cpu, Wifi, Bluetooth, Activity, Zap, Terminal, Thermometer,
    ToggleRight, Gauge, Eye, Power, Radio, Crosshair, RotateCcw,
    Magnet, Clock, Timer, Disc, Grid3X3, Code, Copy, Download,
    Play, StopCircle, Send, ChevronDown, ChevronUp, AlertTriangle,
    CheckCircle2, Settings, RefreshCw, Layers, X, SlidersHorizontal,
    PanelTop, Binary, Hexagon, Target, Waves, Snowflake, Flame,
    Container, Factory, Droplets, Wind, ArrowDownUp, Percent,
    ListOrdered, BarChartHorizontal, CircleDot, Cog, PlaySquare,
    Circle, PenTool
} from 'lucide-react';
import iotConnector from '../../utils/iotConnector';
import { translations } from '../../i18n/translations';

export const getFirmwareCode = (connectionType, boardType, baudRate, mqttUrl, wifiIp) => {
    const conn = connectionType || 'SERIAL';
    const board = boardType || 'UNO';
    const baud = baudRate || 9600;
    const mqttHost = mqttUrl ? mqttUrl.replace('wss://', '').replace('ws://', '').split(':')[0] : 'broker.emqx.io';
    
    if (conn === 'MQTT') {
        return `/*
  Mavi Integration Sketch - MQTT Protocol
  Device: ${board}
  MQTT Broker: ${mqttHost}
*/

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#elif defined(ESP32)
#include <WiFi.h>
#else
#include <SPI.h>
#include <Ethernet.h>
#endif
#include <PubSubClient.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "${mqttHost}";
const int mqtt_port = 1883;

#if defined(ESP8266) || defined(ESP32)
WiFiClient espClient;
#else
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
EthernetClient espClient;
#endif
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup_wifi() {
#if defined(ESP8266) || defined(ESP32)
  delay(10);
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi connected");
#else
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Failed to configure Ethernet using DHCP");
  }
#endif
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(msg);

  // Parse custom control commands, e.g. "13:1"
  int colonIdx = msg.indexOf(':');
  if (colonIdx != -1) {
    int targetPin = msg.substring(0, colonIdx).toInt();
    int targetVal = msg.substring(colonIdx + 1).toInt();
    pinMode(targetPin, OUTPUT);
    digitalWrite(targetPin, targetVal);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("MaviArduinoClient")) {
      Serial.println("connected");
      client.subscribe("arduino/write/#");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 1000) {
    lastMsg = now;
    int sensorVal = analogRead(A0);
    String payload = String(sensorVal);
    client.publish("arduino/read/A0", payload.c_str());
  }
}`;
    }

    if (conn === 'WIFI') {
        return `/*
  Mavi Integration Sketch - WiFi HTTP API Server
  Device: ${board}
  Expected IP Address: ${wifiIp || '192.168.1.100'}
*/

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
typedef ESP8266WebServer WebServer;
#elif defined(ESP32)
#include <WiFi.h>
#include <WebServer.h>
#endif

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

WebServer server(80);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  server.on("/read", HTTP_GET, []() {
    String pin = server.arg("pin");
    int val = 0;
    if (pin.equalsIgnoreCase("A0")) {
      val = analogRead(A0);
    } else {
      int pinNum = pin.toInt();
      pinMode(pinNum, INPUT);
      val = digitalRead(pinNum);
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", String(val));
  });

  server.on("/write", []() {
    String pinStr = server.arg("pin");
    String valStr = server.arg("val");
    int pin = pinStr.toInt();
    int val = valStr.toInt();
    pinMode(pin, OUTPUT);
    digitalWrite(pin, val);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", "OK");
  });

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}`;
    }

    return `/*
  Mavi Integration Sketch - USB Serial Protocol
  Device: ${board}
  Baud Rate: ${baud}
*/

const int ANALOG_PIN = A0;
const int OUT_PIN = 13;

void setup() {
  Serial.begin(${baud});
  pinMode(OUT_PIN, OUTPUT);
}

void loop() {
  int sensorVal = analogRead(ANALOG_PIN);
  Serial.print("A0:");
  Serial.println(sensorVal);
  
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\\n');
    command.trim();
    if (command.startsWith("d") || command.startsWith("p")) {
      int colonIdx = command.indexOf(':');
      if (colonIdx != -1) {
        String pinStr = command.substring(1, colonIdx);
        String valStr = command.substring(colonIdx + 1);
        int targetPin = pinStr.toInt();
        int targetVal = valStr.toInt();
        if (command.startsWith("d")) {
          digitalWrite(targetPin, targetVal);
        } else if (command.startsWith("p")) {
          analogWrite(targetPin, targetVal);
        }
      }
    }
  }
  delay(200);
}`;
};

export const ArduinoWidget = ({ comp, viewMode, onWidgetInteraction, setPreviewFormValues, updateComponentProps, language = 'en', isDark = false }) => {
    const [status, setStatus] = React.useState(comp.props.status || 'disconnected');
    const [liveValue, setLiveValue] = React.useState(0);
    const [graphData, setGraphData] = React.useState([]);
    const [showCodeModal, setShowCodeModal] = React.useState(false);
    
    // Phase 3 States
    const [logs, setLogs] = React.useState([]);
    const [cmdInput, setCmdInput] = React.useState('');
    const consoleEndRef = React.useRef(null);

    // 6 New Widgets States
    const [lastCardId, setLastCardId] = React.useState('');
    const [rfidStatus, setRfidStatus] = React.useState('Awaiting Card Scan...');
    const [lcdText1, setLcdText1] = React.useState(comp.props.line1 || 'Hello World');
    const [lcdText2, setLcdText2] = React.useState(comp.props.line2 || 'Mavi MES System');
    const [joyX, setJoyX] = React.useState(512);
    const [joyY, setJoyY] = React.useState(512);
    const [joyZ, setJoyZ] = React.useState(1);
    const [lastKeyPressed, setLastKeyPressed] = React.useState('');
    const [matrixState, setMatrixState] = React.useState(() => Array(8).fill(0).map(() => Array(8).fill(false)));
    const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString());

    // 7 New Pro Widget States
    const [radarAngle, setRadarAngle] = React.useState(0);
    const [radarDots, setRadarDots] = React.useState([]);
    const [tankLevel, setTankLevel] = React.useState(0);
    const [modbusRegs, setModbusRegs] = React.useState(Array(8).fill({ addr: 0, val: 0 }));
    const [statusPins, setStatusPins] = React.useState({});
    const [oscData, setOscData] = React.useState(Array(80).fill(128));
    const [thermalGrid, setThermalGrid] = React.useState(Array(64).fill(20));
    const [thermoValue, setThermoValue] = React.useState(0);
    const radarAnimRef = React.useRef(null);

    // SCADA Widgets States
    const [scadaValveState, setScadaValveState] = React.useState(comp.props.state !== undefined ? comp.props.state : false);
    const [scadaPumpState, setScadaPumpState] = React.useState(comp.props.state !== undefined ? comp.props.state : false);
    const [scadaPumpSpeed, setScadaPumpSpeed] = React.useState(comp.props.speed || 0);
    const [scadaPipeFlow, setScadaPipeFlow] = React.useState(comp.props.flowRate || 0);
    const [scadaEstopActive, setScadaEstopActive] = React.useState(comp.props.state !== undefined ? comp.props.state : false);
    const [scadaAlarms, setScadaAlarms] = React.useState([
        { id: 1, tag: 'SYS-01', msg: 'SCADA System initialized and ready', time: new Date().toLocaleTimeString(), severity: 'INFO', ack: true }
    ]);
    const [pidSp, setPidSp] = React.useState(comp.props.sp || 50);
    const [pidPv, setPidPv] = React.useState(comp.props.pv || 45);
    const [pidOp, setPidOp] = React.useState(comp.props.op || 30);

    React.useEffect(() => {
        if (viewMode !== 'PREVIEW') return;
        
        const unsubStatus = hardwareService.subscribeStatus((s) => {
            setStatus(s);
        });

        let telemetryUnsub = () => {};
        if (comp.type === 'ARDUINO_PIN_MONITOR' || comp.type === 'ARDUINO_GRAPH' || comp.type === 'ARDUINO_GAUGE') {
            const pin = comp.props.pin || 'A0';
            
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }

            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const multiplier = comp.props.multiplier !== undefined ? parseFloat(comp.props.multiplier) : 1;
                const offset = comp.props.offset !== undefined ? parseFloat(comp.props.offset) : 0;
                const val = (rawVal * multiplier) + offset;

                setLiveValue(val);
                if (comp.props.targetVariable) {
                    setPreviewFormValues(prev => ({ ...prev, [comp.id]: val }));
                }
                
                if (comp.type === 'ARDUINO_GRAPH') {
                    setGraphData(prev => {
                        const next = [...prev, val];
                        if (next.length > (comp.props.maxSamples || 50)) {
                            next.shift();
                        }
                        return next;
                    });
                }
                onWidgetInteraction(comp, 'ValueReceived', { value: val });
            });
        } else if (comp.type === 'ARDUINO_RFID') {
            const pin = comp.props.pin || '10';
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const cardId = String(rawVal).trim().toUpperCase();
                setLastCardId(cardId);
                const allowed = (comp.props.allowedCards || '').split(',').map(s => s.trim().toUpperCase());
                const isOk = allowed.includes(cardId);
                setRfidStatus(isOk ? 'ACCESS GRANTED' : 'ACCESS DENIED');
                if (comp.props.targetVariable) {
                    setPreviewFormValues(prev => ({ ...prev, [comp.id]: cardId }));
                }
                onWidgetInteraction(comp, 'CardScanned', { cardId, verified: isOk });
            });
        } else if (comp.type === 'ARDUINO_JOYSTICK') {
            const pinX = comp.props.pinX || 'A0';
            const pinY = comp.props.pinY || 'A1';
            const pinZ = comp.props.pinSel || '2';

            const unsubX = hardwareService.onPinData(pinX, (val) => setJoyX(parseInt(val)));
            const unsubY = hardwareService.onPinData(pinY, (val) => setJoyY(parseInt(val)));
            const unsubZ = hardwareService.onPinData(pinZ, (val) => setJoyZ(parseInt(val)));
            telemetryUnsub = () => {
                unsubX();
                unsubY();
                unsubZ();
            };
        } else if (comp.type === 'ARDUINO_KEYPAD') {
            telemetryUnsub = hardwareService.onPinData('KEYPAD', (rawVal) => {
                const key = String(rawVal);
                setLastKeyPressed(key);
                if (comp.props.targetVariable) {
                    setPreviewFormValues(prev => ({ ...prev, [comp.id]: key }));
                }
                onWidgetInteraction(comp, 'KeyClicked', { key });
            });
        } else if (comp.type === 'ARDUINO_LCD') {
            const unsubLCD = hardwareService.onData((val, rawLine) => {
                if (rawLine) {
                    if (rawLine.startsWith('l1:')) {
                        setLcdText1(rawLine.substring(3));
                    } else if (rawLine.startsWith('l2:')) {
                        setLcdText2(rawLine.substring(3));
                    }
                }
            });
            telemetryUnsub = unsubLCD;
        } else if (comp.type === 'ARDUINO_RTC') {
            const interval = setInterval(() => {
                setCurrentTime(new Date().toLocaleTimeString());
            }, 1000);
            telemetryUnsub = () => clearInterval(interval);
        } else if (comp.type === 'ARDUINO_RADAR') {
            const pin = comp.props.pin || 'A0';
            // Setup connection for real radar distance sensor (HC-SR04, RCWL, etc.)
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 200);
            }
            // Real hardware: emit detected objects when distance data arrives on pin
            const pinUnsub = hardwareService.onPinData(pin, (distCm) => {
                const maxD = comp.props.maxDistance || 200;
                const normalizedDist = Math.min(1, Math.max(0, parseFloat(distCm) / maxD));
                setRadarDots(prev => {
                    const next = [...prev, { angle: radarAngle, dist: normalizedDist }];
                    return next.slice(-30);
                });
                if (comp.props.targetVariable) setPreviewFormValues(prev => ({ ...prev, [comp.id]: distCm }));
                onWidgetInteraction(comp, 'ObjectDetected', { distanceCm: distCm, angle: radarAngle });
            });
            // Sweep animation always runs (servo-driven or simulated)
            let angle = 0;
            let dir = 1;
            const sweepInterval = setInterval(() => {
                angle += dir * 2;
                if (angle >= (comp.props.angleSweep || 180)) { dir = -1; angle = comp.props.angleSweep || 180; }
                if (angle <= 0) { dir = 1; angle = 0; }
                setRadarAngle(angle);
            }, 50);
            radarAnimRef.current = sweepInterval;
            telemetryUnsub = () => { clearInterval(sweepInterval); pinUnsub(); };
        } else if (comp.type === 'ARDUINO_TANK') {
            const pin = comp.props.pin || 'A0';
            // Setup transport (MQTT, WiFi HTTP, or Serial)
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                // rawVal can be 0-1023 (ADC) or a direct percentage (0-100)
                const rawNum = parseFloat(rawVal);
                const pct = rawNum > 100 ? Math.min(100, (rawNum / 1023) * 100) : Math.min(100, Math.max(0, rawNum));
                setTankLevel(pct);
                if (comp.props.targetVariable) setPreviewFormValues(prev => ({ ...prev, [comp.id]: pct }));
                onWidgetInteraction(comp, 'LevelChanged', { level: pct });
            });
        } else if (comp.type === 'ARDUINO_STATUS_GRID') {
            const pins = (comp.props.pins || 'D2,D3,D4,D5').split(',').map(p => p.trim());
            // Subscribe each pin - works with Serial (D2:1\n), MQTT (topic/D2 → 1), or WiFi
            if (comp.props.connectionType === 'MQTT') {
                pins.forEach(pin => hardwareService.subscribeMqttPin(pin, `${(comp.props.mqttSubscribeTopic || 'arduino/read').replace('/#','')  }/${pin}`));
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                pins.forEach(pin => hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, 500));
            }
            const unsubs = pins.map(pin => hardwareService.onPinData(pin, (val) => {
                setStatusPins(prev => ({ ...prev, [pin]: parseInt(val) > 0 }));
            }));
            telemetryUnsub = () => {
                unsubs.forEach(fn => fn());
                if (comp.props.connectionType === 'WIFI') {
                    const pinArr = (comp.props.pins || 'D2,D3,D4,D5').split(',').map(p => p.trim());
                    pinArr.forEach(p => hardwareService.stopWifiPolling(p));
                }
            };
        } else if (comp.type === 'ARDUINO_OSCILLOSCOPE') {
            const pin = comp.props.pin || 'A0';
            // High-speed sampling: WiFi/MQTT preferred for fast ADC streaming
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 100);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                // Accept 0-1023 ADC or 0-255 normalized
                const raw = parseFloat(rawVal);
                const mapped = raw > 255 ? Math.min(255, Math.max(0, Math.round((raw / 1023) * 255))) : Math.min(255, Math.max(0, Math.round(raw)));
                setOscData(prev => { const n = [...prev.slice(1), mapped]; return n; });
                onWidgetInteraction(comp, 'SampleReceived', { value: rawVal });
            });
        } else if (comp.type === 'ARDUINO_THERMAL') {
            // AMG8833 sends 64 comma-separated float values over Serial/MQTT
            // Serial format: "THERMAL:20.1,21.5,22.3,..." (64 values)
            // MQTT: topic arduino/thermal/frame, payload JSON array or CSV
            if (comp.props.connectionType === 'MQTT') {
                if (hardwareService.mqttClient && hardwareService.mqttClient.connected) {
                    hardwareService.mqttClient.subscribe(comp.props.mqttSubscribeTopic || 'arduino/thermal/frame');
                    hardwareService.mqttClient.on('message', (topic, message) => {
                        if (topic === (comp.props.mqttSubscribeTopic || 'arduino/thermal/frame')) {
                            try {
                                const vals = JSON.parse(message.toString());
                                if (Array.isArray(vals) && vals.length === 64) setThermalGrid(vals);
                            } catch { /* ignore parse errors */ }
                        }
                    });
                }
            }
            // Serial fallback + demo animation
            const thermalDataUnsub = hardwareService.onData((val, rawLine) => {
                if (rawLine && rawLine.startsWith('THERMAL:')) {
                    const nums = rawLine.substring(8).split(',').map(Number).filter(n => !isNaN(n));
                    if (nums.length === 64) setThermalGrid(nums);
                }
            });
            // Always run simulation animation when no real data arrives
            const simInterval = setInterval(() => {
                setThermalGrid(prev => prev.map(v => Math.min(comp.props.maxTemp || 80, Math.max(15, v + (Math.random() - 0.49) * 1.5))));
            }, 400);
            telemetryUnsub = () => { thermalDataUnsub(); clearInterval(simInterval); };
        } else if (comp.type === 'ARDUINO_THERMOMETER') {
            const pin = comp.props.pin || 'A0';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const mn = parseFloat(comp.props.minVal ?? 0);
                const mx = parseFloat(comp.props.maxVal ?? 100);
                const raw = parseFloat(rawVal);
                // Accept raw ADC (0-1023) or direct temp value (in range)
                const val = raw > mx ? mn + ((raw / 1023) * (mx - mn)) : Math.min(mx, Math.max(mn, raw));
                setThermoValue(val);
                if (comp.props.targetVariable) setPreviewFormValues(prev => ({ ...prev, [comp.id]: val }));
                onWidgetInteraction(comp, 'TempChanged', { value: val });
            });
        } else if (comp.type === 'ARDUINO_SCADA_VALVE') {
            const pin = comp.props.pin || 'D2';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const active = parseInt(rawVal) > 0;
                setScadaValveState(active);
                if (comp.props.targetVariable) setPreviewFormValues(prev => ({ ...prev, [comp.id]: active }));
                onWidgetInteraction(comp, 'ValveStateChanged', { state: active });
            });
        } else if (comp.type === 'ARDUINO_SCADA_PUMP') {
            const pin = comp.props.pin || 'D3';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const active = parseInt(rawVal) > 0;
                setScadaPumpState(active);
                if (comp.props.targetVariable) setPreviewFormValues(prev => ({ ...prev, [comp.id]: active }));
                onWidgetInteraction(comp, 'PumpStateChanged', { state: active });
            });
        } else if (comp.type === 'ARDUINO_SCADA_PIPE') {
            const pin = comp.props.pin || 'A0';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const flow = parseFloat(rawVal) || 0;
                setScadaPipeFlow(flow);
                if (comp.props.targetVariable) setPreviewFormValues(prev => ({ ...prev, [comp.id]: flow }));
                onWidgetInteraction(comp, 'FlowChanged', { flowRate: flow });
            });
        } else if (comp.type === 'ARDUINO_SCADA_ESTOP') {
            const pin = comp.props.pin || 'D4';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const active = parseInt(rawVal) > 0;
                setScadaEstopActive(active);
                if (comp.props.targetVariable) setPreviewFormValues(prev => ({ ...prev, [comp.id]: active }));
                onWidgetInteraction(comp, 'EmergencyStop', { active });
            });
        } else if (comp.type === 'ARDUINO_SCADA_ALARM_BANNER') {
            telemetryUnsub = hardwareService.onData((val, rawLine) => {
                if (rawLine && rawLine.startsWith('ALARM:')) {
                    const msg = rawLine.substring(6);
                    setScadaAlarms(prev => {
                        const newAlarm = {
                            id: Date.now(),
                            tag: comp.props.tag || 'ALM',
                            msg,
                            time: new Date().toLocaleTimeString(),
                            severity: 'CRITICAL',
                            ack: false
                        };
                        return [newAlarm, ...prev].slice(0, 50);
                    });
                    onWidgetInteraction(comp, 'AlarmTriggered', { message: msg });
                }
            });
        } else if (comp.type === 'ARDUINO_SCADA_PID') {
            const pin = comp.props.pin || 'A0';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const pv = parseFloat(rawVal) || 0;
                setPidPv(pv);
                if (comp.props.targetVariable) setPreviewFormValues(prev => ({ ...prev, [comp.id]: pv }));
                onWidgetInteraction(comp, 'PidUpdated', { pv, sp: pidSp, op: pidOp });
            });
        }

        let consoleUnsub = () => {};
        if (comp.type === 'ARDUINO_CONSOLE') {
            if (status !== 'connected') {
                const interval = setInterval(() => {
                    const simulatedValues = ["INFO: System initialized", "SENSOR A0: 450", "SENSOR A1: 120", "DEBUG: Keep-alive sent", "WARNING: High temp alert"];
                    const randomLine = simulatedValues[Math.floor(Math.random() * simulatedValues.length)];
                    setLogs(prev => {
                        const timeStr = new Date().toLocaleTimeString();
                        const next = [...prev, { type: 'rx', text: randomLine, time: timeStr }];
                        if (next.length > (comp.props.maxLines || 100)) next.shift();
                        return next;
                    });
                }, 4000);
                consoleUnsub = () => clearInterval(interval);
            } else {
                consoleUnsub = hardwareService.onData((val, rawLine) => {
                    setLogs(prev => {
                        const timeStr = new Date().toLocaleTimeString();
                        const next = [...prev, { type: 'rx', text: rawLine || String(val), time: timeStr }];
                        if (next.length > (comp.props.maxLines || 100)) next.shift();
                        return next;
                    });
                });
            }
        }

        return () => {
            unsubStatus();
            telemetryUnsub();
            consoleUnsub();
            if (comp.type === 'ARDUINO_PIN_MONITOR' || comp.type === 'ARDUINO_GRAPH' || comp.type === 'ARDUINO_GAUGE') {
                if (comp.props.connectionType === 'WIFI') {
                    hardwareService.stopWifiPolling(comp.props.pin || 'A0');
                }
            }
        };
    }, [viewMode, comp, status]);

    React.useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const handleConnect = async () => {
        if (viewMode !== 'PREVIEW') return;
        if (status === 'connected') {
            await hardwareService.disconnect();
        } else {
            if (comp.props.connectionType === 'MQTT') {
                const options = {};
                if (comp.props.mqttUsername) options.username = comp.props.mqttUsername;
                if (comp.props.mqttPassword) options.password = comp.props.mqttPassword;
                await hardwareService.connectMqtt(comp.props.mqttBrokerUrl || 'wss://broker.emqx.io:8084/mqtt', options);
            } else if (comp.props.connectionType === 'WIFI') {
                hardwareService.wifiIpAddress = comp.props.wifiIpAddress || '192.168.1.100';
                hardwareService._updateStatus('connected');
            } else {
                await hardwareService.connectSerial(comp.props.baudRate || 9600);
            }
        }
    };

    const handleControlChange = async (val) => {
        if (viewMode !== 'PREVIEW') return;
        setLiveValue(val);
        const prefix = comp.props.controlType === 'SLIDER' ? 'p' : 'd';
        const pin = comp.props.pin || '13';
        const cmd = `${prefix}${pin}:${val}\n`;

        if (comp.props.connectionType === 'MQTT') {
            const topic = comp.props.mqttPublishTopic || `arduino/write/${pin}`;
            await hardwareService.publishMqtt(topic, { pin, value: val, cmd });
        } else if (comp.props.connectionType === 'WIFI') {
            const ip = hardwareService.wifiIpAddress || '192.168.1.100';
            await hardwareService.writeWifi(ip, pin, val);
        } else {
            await hardwareService.writeSerial(cmd);
        }
        
        onWidgetInteraction(comp, 'PinChanged', { pin, value: val });
    };

    const handleSendConsoleCmd = async () => {
        if (!cmdInput.trim() || viewMode !== 'PREVIEW') return;
        const text = cmdInput.trim();
        const timeStr = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type: 'tx', text, time: timeStr }]);
        setCmdInput('');

        const cmd = `${text}\n`;
        if (comp.props.connectionType === 'MQTT') {
            const topic = comp.props.mqttPublishTopic || `arduino/write/console`;
            await hardwareService.publishMqtt(topic, { cmd });
        } else if (comp.props.connectionType === 'WIFI') {
            const ip = hardwareService.wifiIpAddress || '192.168.1.100';
            await hardwareService.writeWifi(ip, 'console', text);
        } else {
            await hardwareService.writeSerial(cmd);
        }
    };

    const handleMotorControl = async (val, cmdType) => {
        if (viewMode !== 'PREVIEW') return;
        const pin = comp.props.pin || '9';
        
        let cmd = '';
        if (cmdType === 'SERVO') {
            cmd = `s${pin}:${val}\n`;
        } else if (cmdType === 'STEPPER') {
            cmd = `m${pin}:${val}\n`;
        } else if (cmdType === 'DC') {
            cmd = `d${pin}:${val}\n`;
        }

        if (comp.props.connectionType === 'MQTT') {
            const topic = comp.props.mqttPublishTopic || `arduino/write/${pin}`;
            await hardwareService.publishMqtt(topic, { pin, value: val, cmd });
        } else if (comp.props.connectionType === 'WIFI') {
            const ip = hardwareService.wifiIpAddress || '192.168.1.100';
            await hardwareService.writeWifi(ip, pin, val);
        } else {
            await hardwareService.writeSerial(cmd);
        }
        onWidgetInteraction(comp, 'MotorTriggered', { pin, value: val, cmdType });
    };

    const handleColorChange = async (hexColor) => {
        if (viewMode !== 'PREVIEW') return;
        
        const r = parseInt(hexColor.slice(1, 3), 16) || 0;
        const g = parseInt(hexColor.slice(3, 5), 16) || 0;
        const b = parseInt(hexColor.slice(5, 7), 16) || 0;
        
        const pin = comp.props.pin || '6';
        const cmd = `c${pin}:${r},${g},${b}\n`;

        if (comp.props.connectionType === 'MQTT') {
            const topic = comp.props.mqttPublishTopic || `arduino/write/${pin}`;
            await hardwareService.publishMqtt(topic, { pin, r, g, b, cmd });
        } else if (comp.props.connectionType === 'WIFI') {
            const ip = hardwareService.wifiIpAddress || '192.168.1.100';
            await hardwareService.writeWifi(ip, `${pin}/r`, r);
            await hardwareService.writeWifi(ip, `${pin}/g`, g);
            await hardwareService.writeWifi(ip, `${pin}/b`, b);
        } else {
            await hardwareService.writeSerial(cmd);
        }
        onWidgetInteraction(comp, 'ColorChanged', { pin, hexColor, r, g, b });
    };

    const tealColor = '#00979D';

    if (comp.type === 'ARDUINO_BOARD') {
        const connected = status === 'connected';
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '12px', border: `2px solid ${connected ? '#10b981' : '#334155'}`,
                padding: '12px', display: 'flex', flexDirection: 'column', color: '#f8fafc', fontFamily: 'monospace', boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={18} color={tealColor} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{comp.props.label || 'Arduino Uno'}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: connected ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        {connected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                </div>
                <div style={{ flex: 1, position: 'relative', border: '1px solid #1e293b', borderRadius: '8px', backgroundColor: '#020617', overflow: 'hidden', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#475569' }}>
                        <span>{"[AREF] [GND] [13] [12] [~11] [~10] [~9] [8]"}</span>
                        <span>{"[7] [~6] [~5] [4] [~3] [2] [TX>1] [RX<0]"}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                        <div style={{ width: '20px', height: '14px', backgroundColor: '#64748b', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '12px', height: '8px', backgroundColor: '#334155' }} />
                        </div>
                        <div style={{ width: '120px', height: '24px', backgroundColor: '#1e293b', borderRadius: '4px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.55rem', fontWeight: 'bold' }}>
                            ATMEGA328P-PU
                        </div>
                        <div style={{ width: '16px', height: '20px', backgroundColor: '#1e293b', borderRadius: '2px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#475569' }}>
                        <span>{"[5V] [GND] [RST] [3.3V]"}</span>
                        <span>{"[A0] [A1] [A2] [A3] [A4] [A5]"}</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {viewMode === 'PREVIEW' && (
                        <button
                            onClick={handleConnect}
                            style={{
                                flex: 1, padding: '6px 12px', borderRadius: '6px', border: 'none',
                                backgroundColor: connected ? '#ef4444' : tealColor, color: 'white',
                                fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {connected ? 'Disconnect' : `Connect ${comp.props.connectionType || 'Serial'}`}
                        </button>
                    )}
                    <button
                        onClick={() => setShowCodeModal(true)}
                        style={{
                            flex: 1, padding: '6px 12px', borderRadius: '6px', border: `1px solid ${tealColor}`,
                            backgroundColor: 'transparent', color: tealColor,
                            fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        View Firmware Code
                    </button>
                </div>

                {showCodeModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 9999, padding: '24px'
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155',
                            width: '100%', maxWidth: '640px', maxHeight: '80vh', display: 'flex',
                            flexDirection: 'column', color: '#f8fafc', overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #334155' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Cpu size={20} color={tealColor} />
                                    Arduino/ESP32 Firmware Generator
                                </h3>
                                <button
                                    onClick={() => setShowCodeModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: '#020617', color: '#38bdf8' }}>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {getFirmwareCode(comp.props.connectionType, comp.props.boardType, comp.props.baudRate, comp.props.mqttBrokerUrl, comp.props.wifiIpAddress)}
                                </pre>
                            </div>
                            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #334155', backgroundColor: '#0f172a' }}>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(getFirmwareCode(comp.props.connectionType, comp.props.boardType, comp.props.baudRate, comp.props.mqttBrokerUrl, comp.props.wifiIpAddress));
                                        toast.success('Firmware sketch copied to clipboard!');
                                    }}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                                        backgroundColor: tealColor, color: 'white', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    Copy Code
                                </button>
                                <button
                                    onClick={() => setShowCodeModal(false)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569',
                                        backgroundColor: 'transparent', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (comp.type === 'ARDUINO_PIN_MONITOR') {
        const valStr = comp.props.pinMode === 'DIGITAL_INPUT' 
            ? (liveValue > 0 ? 'HIGH' : 'LOW') 
            : (typeof liveValue === 'number' ? liveValue.toFixed(comp.props.precision ?? 0) : liveValue);
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{comp.props.label || 'Pin Monitor'}</span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || 'A0'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {viewMode === 'PREVIEW' ? valStr : (comp.props.pinMode === 'DIGITAL_INPUT' ? 'LOW' : '512')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{comp.props.unit}</span>
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-quaternary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {comp.props.pinMode || 'ANALOG_INPUT'} {comp.props.targetVariable ? `→ @${comp.props.targetVariable}` : ''}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_CONTROLLER') {
        const isToggle = comp.props.controlType === 'TOGGLE' || !comp.props.controlType;
        const isSlider = comp.props.controlType === 'SLIDER';
        const isButton = comp.props.controlType === 'BUTTON';

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{comp.props.label || 'Pin Controller'}</span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || '13'}
                    </span>
                </div>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isToggle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={viewMode === 'PREVIEW' ? liveValue > 0 : false}
                                disabled={viewMode !== 'PREVIEW'}
                                onChange={(e) => handleControlChange(e.target.checked ? 1 : 0)}
                                style={{ width: '40px', height: '20px', cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default' }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {viewMode === 'PREVIEW' ? (liveValue > 0 ? 'HIGH' : 'LOW') : 'LOW'}
                            </span>
                        </div>
                    )}

                    {isButton && (
                        <button
                            onMouseDown={() => handleControlChange(1)}
                            onMouseUp={() => handleControlChange(0)}
                            onTouchStart={() => handleControlChange(1)}
                            onTouchEnd={() => handleControlChange(0)}
                            disabled={viewMode !== 'PREVIEW'}
                            style={{
                                padding: '8px 16px', backgroundColor: tealColor, color: 'white', border: 'none',
                                borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default'
                            }}
                        >
                            HOLD FOR HIGH
                        </button>
                    )}

                    {isSlider && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input
                                type="range"
                                min={comp.props.min || 0}
                                max={comp.props.max || 255}
                                value={viewMode === 'PREVIEW' ? liveValue : 0}
                                disabled={viewMode !== 'PREVIEW'}
                                onChange={(e) => handleControlChange(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: tealColor }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                <span>Min: {comp.props.min || 0}</span>
                                <span style={{ fontWeight: 'bold', color: tealColor }}>Val: {viewMode === 'PREVIEW' ? liveValue : 0}</span>
                                <span>Max: {comp.props.max || 255}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_GRAPH') {
        const samples = viewMode === 'PREVIEW' ? graphData : [100, 200, 150, 300, 250, 400, 350, 500, 450, 600, 550, 700];
        const maxVal = Math.max(...samples, 1023);
        const minVal = 0;
        
        const width = 360, height = 110;
        let pointsStr = '';
        if (samples.length > 1) {
            const stepX = width / (samples.length - 1);
            pointsStr = samples.map((v, i) => {
                const x = i * stepX;
                const y = height - ((v - minVal) / (maxVal - minVal)) * height;
                return `${x},${y}`;
            }).join(' ');
        }

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={16} color={comp.props.color || tealColor} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{comp.props.label || 'Real-time Graph'}</span>
                    </div>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || 'A0'}
                    </span>
                </div>
                <div style={{ flex: 1, position: 'relative', border: '1px solid var(--border-secondary)', borderRadius: '6px', backgroundColor: isDark ? '#020617' : '#f8fafc', overflow: 'hidden' }}>
                    {samples.length > 1 ? (
                        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }}>
                            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4" />
                            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4" />
                            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4" />
                            <polyline
                                fill="none"
                                stroke={comp.props.color || tealColor}
                                strokeWidth="2"
                                points={pointsStr}
                            />
                        </svg>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-quaternary)', fontSize: '0.75rem' }}>
                            Awaiting serial data...
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_CONSOLE') {
        const showTs = comp.props.showTimestamp !== false;
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: '#020617', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Terminal size={14} color={tealColor} />
                        {comp.props.label || 'Console Terminal'}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: '#475569' }}>
                        Buffer: {logs.length}/{comp.props.maxLines || 100}
                    </span>
                </div>
                <div style={{
                    flex: 1, overflowY: 'auto', backgroundColor: '#090d16', border: '1px solid #1e293b',
                    borderRadius: '8px', padding: '8px', fontFamily: 'monospace', fontSize: '0.7rem',
                    color: '#38bdf8', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px'
                }}>
                    {logs.map((log, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', color: log.type === 'tx' ? '#10b981' : '#38bdf8' }}>
                            {showTs && <span style={{ color: '#475569' }}>[{log.time}]</span>}
                            <span>{log.type === 'tx' ? 'TX>' : 'RX<'}</span>
                            <span style={{ wordBreak: 'break-all' }}>{log.text}</span>
                        </div>
                    ))}
                    <div ref={consoleEndRef} />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                        type="text"
                        placeholder="Send command..."
                        value={cmdInput}
                        disabled={viewMode !== 'PREVIEW'}
                        onChange={(e) => setCmdInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendConsoleCmd()}
                        style={{
                            flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px',
                            color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem', fontFamily: 'monospace'
                        }}
                    />
                    <button
                        onClick={handleSendConsoleCmd}
                        disabled={viewMode !== 'PREVIEW'}
                        style={{
                            backgroundColor: tealColor, color: 'white', border: 'none', borderRadius: '6px',
                            padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_GAUGE') {
        const val = viewMode === 'PREVIEW' ? liveValue : 45;
        const minVal = comp.props.min !== undefined ? parseFloat(comp.props.min) : 0;
        const maxVal = comp.props.max !== undefined ? parseFloat(comp.props.max) : 100;
        const color = comp.props.color || tealColor;
        const unit = comp.props.unit || '°C';
        
        const pct = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
        const r = 40;
        const c = 2 * Math.PI * r;
        const arcLength = c * 0.75;
        const dashOffset = arcLength * (1 - pct);

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    <span>{comp.props.label || 'Circular Gauge'}</span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px' }}>
                        PIN {comp.props.pin || 'A0'}
                    </span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
                    <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-45deg)', transformOrigin: '50% 50%' }}>
                        <circle
                            cx="50"
                            cy="50"
                            r={r}
                            fill="transparent"
                            stroke={isDark ? '#1e293b' : '#e2e8f0'}
                            strokeWidth="8"
                            strokeDasharray={`${arcLength} ${c}`}
                            strokeLinecap="round"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r={r}
                            fill="transparent"
                            stroke={color}
                            strokeWidth="8"
                            strokeDasharray={`${arcLength} ${c}`}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.35s ease' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
                    }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                            {typeof val === 'number' ? val.toFixed(0) : val}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{unit}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                    <span>Min: {minVal}</span>
                    <span>Max: {maxVal}</span>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_COLOR_PICKER') {
        const activeColor = viewMode === 'PREVIEW' ? (comp.props.color || '#ff0000') : '#ff0000';
        const presets = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#a855f7', '#06b6d4', '#ffffff', '#000000'];
        
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Palette size={14} color={tealColor} />
                        {comp.props.label || 'RGB Color Picker'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || '6'}
                    </span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '12px', backgroundColor: activeColor,
                        border: '2px solid var(--border-secondary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                            type="color"
                            value={activeColor}
                            disabled={viewMode !== 'PREVIEW'}
                            onChange={(e) => {
                                updateComponentProps(comp.id, { color: e.target.value });
                                handleColorChange(e.target.value);
                            }}
                            style={{
                                width: '70px', height: '32px', border: '1px solid var(--border-secondary)',
                                borderRadius: '6px', cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default', padding: 0, backgroundColor: 'transparent'
                            }}
                        />
                        <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-primary)', textAlign: 'center' }}>
                            {activeColor.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '4px', marginTop: '6px' }}>
                    {presets.map((color, i) => (
                        <button
                            key={i}
                            disabled={viewMode !== 'PREVIEW'}
                            onClick={() => {
                                updateComponentProps(comp.id, { color });
                                handleColorChange(color);
                            }}
                            style={{
                                height: '18px', backgroundColor: color, border: activeColor === color ? '2px solid var(--text-primary)' : '1px solid var(--border-secondary)',
                                borderRadius: '4px', cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default', padding: 0
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_MOTOR') {
        const motorType = comp.props.motorType || 'SERVO';
        
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RotateCw size={14} color={tealColor} />
                        {comp.props.label || 'Motor Controller'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || '9'}
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {motorType === 'SERVO' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                <span>Angle: {viewMode === 'PREVIEW' ? liveValue : 90}°</span>
                                <span>Max: 180°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="180"
                                value={viewMode === 'PREVIEW' ? liveValue : 90}
                                disabled={viewMode !== 'PREVIEW'}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLiveValue(val);
                                    handleMotorControl(val, 'SERVO');
                                }}
                                style={{ width: '100%', accentColor: tealColor }}
                            />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                {[0, 45, 90, 135, 180].map((angle) => (
                                    <button
                                        key={angle}
                                        disabled={viewMode !== 'PREVIEW'}
                                        onClick={() => {
                                            setLiveValue(angle);
                                            handleMotorControl(angle, 'SERVO');
                                        }}
                                        style={{
                                            padding: '2px 6px', fontSize: '0.55rem', border: '1px solid var(--border-secondary)',
                                            borderRadius: '4px', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer'
                                        }}
                                    >
                                        {angle}°
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {motorType === 'STEPPER' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <button
                                    disabled={viewMode !== 'PREVIEW'}
                                    onClick={() => handleMotorControl(-(comp.props.stepSize || 10), 'STEPPER')}
                                    style={{
                                        flex: 1, padding: '8px 12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px',
                                        color: '#0f172a', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer'
                                    }}
                                >
                                    ◀ JOG -{comp.props.stepSize || 10}
                                </button>
                                <button
                                    disabled={viewMode !== 'PREVIEW'}
                                    onClick={() => handleMotorControl((comp.props.stepSize || 10), 'STEPPER')}
                                    style={{
                                        flex: 1, padding: '8px 12px', backgroundColor: tealColor, border: 'none', borderRadius: '6px',
                                        color: 'white', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer'
                                    }}
                                >
                                    JOG +{comp.props.stepSize || 10} ▶
                                </button>
                            </div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                                Step size configured in properties.
                            </span>
                        </div>
                    )}

                    {motorType === 'DC' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                <span>Speed (PWM): {viewMode === 'PREVIEW' ? liveValue : 0}</span>
                                <span>Max: 255</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="255"
                                value={viewMode === 'PREVIEW' ? liveValue : 0}
                                disabled={viewMode !== 'PREVIEW'}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLiveValue(val);
                                    handleMotorControl(val, 'DC');
                                }}
                                style={{ width: '100%', accentColor: tealColor }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    disabled={viewMode !== 'PREVIEW'}
                                    onClick={() => {
                                        setLiveValue(0);
                                        handleMotorControl(0, 'DC');
                                    }}
                                    style={{
                                        flex: 1, padding: '4px', fontSize: '0.65rem', backgroundColor: '#ef4444', color: 'white',
                                        border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    STOP
                                </button>
                                <button
                                    disabled={viewMode !== 'PREVIEW'}
                                    onClick={() => {
                                        setLiveValue(255);
                                        handleMotorControl(255, 'DC');
                                    }}
                                    style={{
                                        flex: 1, padding: '4px', fontSize: '0.65rem', backgroundColor: '#22c55e', color: 'white',
                                        border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_RFID') {
        const allowedList = (comp.props.allowedCards || '').split(',').map(s => s.trim().toUpperCase());
        
        const simulateScan = (cardId) => {
            if (viewMode !== 'PREVIEW') return;
            const pin = comp.props.pin || '10';
            hardwareService._emitPinData(pin, cardId, `${pin}:${cardId}`);
            toast.success(`Simulated scan of card: ${cardId}`);
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Nfc size={16} color={tealColor} />
                        {comp.props.label || 'RFID Scanner'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        SDA PIN {comp.props.pin || '10'}
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        backgroundColor: rfidStatus === 'ACCESS GRANTED' ? 'rgba(16,185,129,0.15)' : rfidStatus === 'ACCESS DENIED' ? 'rgba(239,68,68,0.15)' : 'var(--bg-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
                        border: `2px solid ${rfidStatus === 'ACCESS GRANTED' ? '#10b981' : rfidStatus === 'ACCESS DENIED' ? '#ef4444' : 'var(--border-secondary)'}`
                    }}>
                        <CreditCard size={24} color={rfidStatus === 'ACCESS GRANTED' ? '#10b981' : rfidStatus === 'ACCESS DENIED' ? '#ef4444' : 'var(--text-secondary)'} />
                    </div>
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 'bold',
                        color: rfidStatus === 'ACCESS GRANTED' ? '#10b981' : rfidStatus === 'ACCESS DENIED' ? '#ef4444' : 'var(--text-primary)'
                    }}>
                        {rfidStatus}
                    </span>
                    {lastCardId && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                            UID: {lastCardId}
                        </span>
                    )}
                </div>

                {viewMode === 'PREVIEW' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={() => simulateScan(allowedList[0] || 'A1B2C3D4')}
                            style={{
                                flex: 1, padding: '6px 4px', fontSize: '0.6rem', backgroundColor: 'rgba(16,185,129,0.15)',
                                color: '#10b981', border: '1px solid #10b981', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            Simulate Valid
                        </button>
                        <button
                            onClick={() => simulateScan('BAD99999')}
                            style={{
                                flex: 1, padding: '6px 4px', fontSize: '0.6rem', backgroundColor: 'rgba(239,68,68,0.15)',
                                color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            Simulate Invalid
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (comp.type === 'ARDUINO_LCD') {
        const backlightColor = comp.props.backlightColor || '#00979d';
        
        const handleSendLCD = () => {
            if (viewMode !== 'PREVIEW') return;
            // Send both lines
            hardwareService.writeSerial(`LCD_L1:${lcdText1}\n`);
            hardwareService.writeSerial(`LCD_L2:${lcdText2}\n`);
            toast.success('LCD text updated and sent!');
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tv size={16} color={tealColor} />
                        {comp.props.label || 'I2C LCD 16x2'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {comp.props.pin || 'I2C (SDA/SCL)'}
                    </span>
                </div>

                <div style={{
                    flex: 1, backgroundColor: '#020617', padding: '10px', borderRadius: '8px',
                    border: `3px solid ${backlightColor}`, boxShadow: `inset 0 0 10px ${backlightColor}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: 'monospace',
                    color: backlightColor, textShadow: `0 0 3px ${backlightColor}`, letterSpacing: '1px', minHeight: '50px'
                }}>
                    <div style={{ fontSize: '0.8rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {lcdText1.padEnd(16, ' ')}
                    </div>
                    <div style={{ fontSize: '0.8rem', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {lcdText2.padEnd(16, ' ')}
                    </div>
                </div>

                {viewMode === 'PREVIEW' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                                type="text"
                                maxLength={16}
                                value={lcdText1}
                                onChange={(e) => setLcdText1(e.target.value)}
                                placeholder="Line 1"
                                style={{ flex: 1, fontSize: '0.65rem', padding: '4px', border: '1px solid var(--border-secondary)', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                            <input
                                type="text"
                                maxLength={16}
                                value={lcdText2}
                                onChange={(e) => setLcdText2(e.target.value)}
                                placeholder="Line 2"
                                style={{ flex: 1, fontSize: '0.65rem', padding: '4px', border: '1px solid var(--border-secondary)', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <button
                            onClick={handleSendLCD}
                            style={{
                                width: '100%', padding: '4px 8px', fontSize: '0.65rem', backgroundColor: tealColor,
                                color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            Update Display
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (comp.type === 'ARDUINO_JOYSTICK') {
        const handleDrag = (e) => {
            if (viewMode !== 'PREVIEW') return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(0, Math.min(1023, Math.round(((e.clientX - rect.left) / rect.width) * 1023)));
            const y = Math.max(0, Math.min(1023, Math.round(((e.clientY - rect.top) / rect.height) * 1023)));
            
            setJoyX(x);
            setJoyY(y);

            const pinX = comp.props.pinX || 'A0';
            const pinY = comp.props.pinY || 'A1';
            hardwareService._emitPinData(pinX, x, `${pinX}:${x}`);
            hardwareService._emitPinData(pinY, y, `${pinY}:${y}`);
            
            if (comp.props.targetVariable) {
                setPreviewFormValues(prev => ({ ...prev, [comp.id]: `${x},${y}` }));
            }
            onWidgetInteraction(comp, 'CoordinatesChanged', { x, y });
        };

        const toggleButton = () => {
            if (viewMode !== 'PREVIEW') return;
            const nextZ = joyZ === 1 ? 0 : 1;
            setJoyZ(nextZ);
            const pinZ = comp.props.pinSel || '2';
            hardwareService._emitPinData(pinZ, nextZ, `${pinZ}:${nextZ}`);
            onWidgetInteraction(comp, 'ButtonStateChanged', { buttonPressed: nextZ === 0 });
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Gamepad2 size={16} color={tealColor} />
                        {comp.props.label || '2-Axis Joystick'}
                    </span>
                    <span style={{ fontSize: '0.55rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        X:{comp.props.pinX || 'A0'} Y:{comp.props.pinY || 'A1'} SW:{comp.props.pinSel || '2'}
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '6px 0' }}>
                    <div
                        onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
                        onMouseDown={handleDrag}
                        style={{
                            width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)',
                            border: '2px solid var(--border-primary)', position: 'relative', cursor: viewMode === 'PREVIEW' ? 'crosshair' : 'default'
                        }}
                    >
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444',
                            position: 'absolute', top: `${(joyY / 1023) * 100}%`, left: `${(joyX / 1023) * 100}%`,
                            transform: 'translate(-50%, -50%)', pointerEvents: 'none'
                        }} />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>X: {joyX}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>Y: {joyY}</span>
                        <button
                            onClick={toggleButton}
                            disabled={viewMode !== 'PREVIEW'}
                            style={{
                                padding: '4px 6px', fontSize: '0.6rem',
                                backgroundColor: joyZ === 0 ? '#10b981' : 'transparent',
                                color: joyZ === 0 ? 'white' : 'var(--text-primary)',
                                border: '1px solid var(--border-secondary)', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            SW: {joyZ === 0 ? 'ACTIVE' : 'RELEASED'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_KEYPAD') {
        const keys = [
            ['1', '2', '3', 'A'],
            ['4', '5', '6', 'B'],
            ['7', '8', '9', 'C'],
            ['*', '0', '#', 'D']
        ];

        const handleKeyPress = (key) => {
            if (viewMode !== 'PREVIEW') return;
            setLastKeyPressed(key);
            hardwareService._emitPinData('KEYPAD', key, `KEYPAD:${key}`);
            if (comp.props.targetVariable) {
                setPreviewFormValues(prev => ({ ...prev, [comp.id]: key }));
            }
            onWidgetInteraction(comp, 'KeyClicked', { key });
            toast.success(`Key Pressed: ${key}`);
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        {comp.props.label || '4x4 Keypad'}
                    </span>
                    {lastKeyPressed && (
                        <span style={{ fontSize: '0.65rem', color: tealColor, fontFamily: 'monospace', fontWeight: 'bold' }}>
                            LAST: {lastKeyPressed}
                        </span>
                    )}
                </div>

                <div style={{
                    display: 'grid', gridTemplateRows: 'repeat(4, 1fr)', gap: '4px', flex: 1
                }}>
                    {keys.map((row, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', gap: '4px' }}>
                            {row.map((k) => (
                                <button
                                    key={k}
                                    disabled={viewMode !== 'PREVIEW'}
                                    onClick={() => handleKeyPress(k)}
                                    style={{
                                        flex: 1, padding: '4px 0', border: '1px solid var(--border-secondary)',
                                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                                        backgroundColor: lastKeyPressed === k ? 'rgba(0,151,157,0.2)' : 'var(--bg-primary)',
                                        color: lastKeyPressed === k ? tealColor : 'var(--text-primary)',
                                        cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default', transition: 'all 0.1s'
                                    }}
                                >
                                    {k}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_MATRIX') {
        const toggleLED = (r, c) => {
            if (viewMode !== 'PREVIEW') return;
            const next = matrixState.map((row, rIdx) =>
                row.map((val, cIdx) => (rIdx === r && cIdx === c ? !val : val))
            );
            setMatrixState(next);
            
            // Format into hex array
            const hexArray = next.map(row => {
                let byte = 0;
                row.forEach((led, idx) => {
                    if (led) byte |= (1 << (7 - idx));
                });
                return '0x' + byte.toString(16).padStart(2, '0').toUpperCase();
            });
            
            const payload = hexArray.join(',');
            hardwareService.writeSerial(`MATRIX:${payload}\n`);
            onWidgetInteraction(comp, 'MatrixChanged', { matrix: payload });
        };

        const clearMatrix = () => {
            if (viewMode !== 'PREVIEW') return;
            const empty = Array(8).fill(0).map(() => Array(8).fill(false));
            setMatrixState(empty);
            hardwareService.writeSerial(`MATRIX:0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00\n`);
            onWidgetInteraction(comp, 'MatrixChanged', { matrix: '0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00' });
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Grid3X3 size={16} color={tealColor} />
                        {comp.props.label || '8x8 LED Matrix'}
                    </span>
                    <button
                        onClick={clearMatrix}
                        disabled={viewMode !== 'PREVIEW'}
                        style={{
                            fontSize: '0.55rem', border: 'none', backgroundColor: 'rgba(239,68,68,0.1)',
                            color: '#ef4444', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        CLEAR
                    </button>
                </div>

                <div style={{
                    display: 'grid', gridTemplateRows: 'repeat(8, 1fr)', gap: '2px', flex: 1,
                    backgroundColor: '#020617', padding: '6px', borderRadius: '6px', aspectRatio: '1/1',
                    alignSelf: 'center', border: '1px solid var(--border-primary)'
                }}>
                    {matrixState.map((row, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', gap: '2px' }}>
                            {row.map((led, cIdx) => (
                                <div
                                    key={cIdx}
                                    onClick={() => toggleLED(rIdx, cIdx)}
                                    style={{
                                        width: '12px', height: '12px', borderRadius: '2px',
                                        backgroundColor: led ? '#ef4444' : '#1e293b',
                                        boxShadow: led ? '0 0 6px #ef4444' : 'none',
                                        cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default',
                                        transition: 'all 0.15s'
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_RTC') {
        const handleSyncTime = () => {
            if (viewMode !== 'PREVIEW') return;
            const epoch = Math.floor(Date.now() / 1000);
            hardwareService.writeSerial(`RTC_SET:${epoch}\n`);
            toast.success(`RTC Synced with Epoch: ${epoch}`);
            onWidgetInteraction(comp, 'TimeSynced', { epoch });
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)',
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Timer size={16} color={tealColor} />
                        {comp.props.label || 'RTC DS3231 Clock'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        I2C
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                        {currentTime}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                {viewMode === 'PREVIEW' && (
                    <button
                        onClick={handleSyncTime}
                        style={{
                            width: '100%', padding: '6px', fontSize: '0.65rem', backgroundColor: tealColor,
                            color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        Sync with System Time
                    </button>
                )}
            </div>
        );
    }

    // --- ARDUINO_RADAR ---
    if (comp.type === 'ARDUINO_RADAR') {
        const sweep = comp.props.angleSweep || 180;
        const size = 220;
        const cx = size / 2, cy = size / 2, r = size / 2 - 8;
        const sweepRad = (radarAngle * Math.PI) / 180;
        const sweepX = cx + r * Math.cos(Math.PI - sweepRad);
        const sweepY = cy - r * Math.sin(sweepRad) * (sweep === 360 ? 1 : 1);
        const toXY = (ang, dist) => ({
            x: cx + r * dist * Math.cos(Math.PI - (ang * Math.PI) / 180),
            y: cy - r * dist * Math.sin((ang * Math.PI) / 180)
        });
        const rings = [0.25, 0.5, 0.75, 1.0];
        const spokeAngles = sweep === 360
            ? [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
            : [0, 30, 60, 90, 120, 150, 180];
        return (
            <div style={{ width: '100%', height: '100%', background: '#000e00', borderRadius: '12px', padding: '8px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00ff41', fontFamily: 'monospace', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>⬡ {comp.props.label || 'Radar Sweep'}</span>
                    <span style={{ color: '#4ade80', fontSize: '0.6rem' }}>MAX: {comp.props.maxDistance || 200}cm | SWEEP: {sweep}°</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={size} height={size * (sweep === 360 ? 1 : 0.6)} viewBox={`0 0 ${size} ${sweep === 360 ? size : size * 0.55}`} style={{ overflow: 'visible' }}>
                        {rings.map((f, i) => (
                            <ellipse key={i} cx={cx} cy={cy} rx={r * f} ry={sweep === 360 ? r * f : r * f * 0.55}
                                fill="none" stroke="#00ff4130" strokeWidth="1" />
                        ))}
                        {spokeAngles.map((a, i) => {
                            const rad = (a * Math.PI) / 180;
                            return <line key={i} x1={cx} y1={cy}
                                x2={cx + r * Math.cos(Math.PI - rad)}
                                y2={cy - r * 0.55 * Math.sin(rad)}
                                stroke="#00ff4120" strokeWidth="1" />;
                        })}
                        <defs>
                            <radialGradient id={`rg-${comp.id}`} cx="50%" cy="100%" r="100%">
                                <stop offset="0%" stopColor="#00ff41" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        <line x1={cx} y1={cy} x2={sweepX} y2={cy - (cy - sweepY) * 0.55}
                            stroke="#00ff41" strokeWidth="2" opacity="0.9" />
                        <circle cx={cx} cy={cy} r="3" fill="#00ff41" />
                        {radarDots.map((d, i) => {
                            const { x, y } = toXY(d.angle, d.dist);
                            return <circle key={i} cx={x} cy={cy - (cy - y) * 0.55} r="3"
                                fill="#00ff41" opacity={0.3 + (i / radarDots.length) * 0.7} />;
                        })}
                    </svg>
                </div>
            </div>
        );
    }

    // --- ARDUINO_TANK ---
    if (comp.type === 'ARDUINO_TANK') {
        const pct = viewMode === 'PREVIEW' ? tankLevel : 45;
        const warningPct = comp.props.warningThreshold || 80;
        const liqColor = pct >= warningPct ? '#ef4444' : (comp.props.liquidColor || '#3b82f6');
        const tankH = 180;
        const fillH = (pct / 100) * tankH;
        return (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-panel)', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', width: '100%', textAlign: 'left' }}>
                    💧 {comp.props.label || 'Liquid Tank'}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <svg width="80" height={tankH + 20} viewBox={`0 0 80 ${tankH + 20}`} style={{ overflow: 'visible' }}>
                        <rect x="5" y="0" width="70" height={tankH} rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                        <rect x="5" y={tankH - fillH} width="70" height={fillH} rx="0"
                            fill={liqColor} opacity="0.8"
                            style={{ transition: 'height 0.6s ease, y 0.6s ease' }} />
                        <rect x="5" y="0" width="70" height={tankH} rx="8" fill="none" stroke="#475569" strokeWidth="2" />
                        {[0.25, 0.5, 0.75].map((f, i) => (
                            <line key={i} x1="5" y1={tankH * (1 - f)} x2="15" y2={tankH * (1 - f)}
                                stroke="#64748b" strokeWidth="1" />
                        ))}
                        <rect x="30" y={tankH} width="20" height="8" rx="3" fill="#475569" />
                    </svg>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: liqColor, fontFamily: 'monospace' }}>{pct.toFixed(1)}%</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Capacity: {comp.props.capacity || 1000}L</div>
                        <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: liqColor, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                        </div>
                        {pct >= warningPct && <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>⚠ HIGH LEVEL ALERT</div>}
                    </div>
                </div>
            </div>
        );
    }

    // --- ARDUINO_MODBUS ---
    if (comp.type === 'ARDUINO_MODBUS') {
        const regs = viewMode === 'PREVIEW' ? modbusRegs : [
            { addr: '40001', val: 1234 }, { addr: '40002', val: 5678 }, { addr: '40003', val: 910 },
            { addr: '40004', val: 11 }, { addr: '40005', val: 0 }, { addr: '40006', val: 255 },
            { addr: '40007', val: 128 }, { addr: '40008', val: 64 }
        ];
        return (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-panel)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-secondary)' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#f59e0b' }}>⬛</span> {comp.props.label || 'Modbus Viewer'}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>RTU | Addr {comp.props.clientAddress || 1}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-tertiary)' }}>
                                <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, borderBottom: '1px solid var(--border-secondary)' }}>Register</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-tertiary)', fontWeight: 600, borderBottom: '1px solid var(--border-secondary)' }}>DEC</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-tertiary)', fontWeight: 600, borderBottom: '1px solid var(--border-secondary)' }}>HEX</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regs.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-secondary)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                                    <td style={{ padding: '4px 8px', color: '#f59e0b' }}>{r.addr || `4000${i + 1}`}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{r.val}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--text-tertiary)' }}>{`0x${Number(r.val).toString(16).toUpperCase().padStart(4, '0')}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // --- ARDUINO_STATUS_GRID ---
    if (comp.type === 'ARDUINO_STATUS_GRID') {
        const pins = (comp.props.pins || 'D2,D3,D4,D5').split(',').map(p => p.trim());
        const labels = (comp.props.pinLabels || '').split(',').map(l => l.trim());
        return (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-panel)', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>🔦 {comp.props.label || 'Status Lights Grid'}</div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, pins.length)}, 1fr)`, gap: '8px', alignContent: 'start' }}>
                    {pins.map((pin, i) => {
                        const active = viewMode === 'PREVIEW' ? !!statusPins[pin] : i % 2 === 0;
                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', border: `1px solid ${active ? '#10b981' : 'var(--border-secondary)'}` }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: active ? '#10b981' : '#374151', boxShadow: active ? '0 0 10px #10b981' : 'none', transition: 'all 0.2s' }} />
                                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: active ? '#10b981' : 'var(--text-quaternary)', textAlign: 'center', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {labels[i] || pin}
                                </div>
                                <div style={{ fontSize: '0.5rem', color: 'var(--text-quaternary)' }}>{active ? 'HIGH' : 'LOW'}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- ARDUINO_OSCILLOSCOPE ---
    if (comp.type === 'ARDUINO_OSCILLOSCOPE') {
        const data = viewMode === 'PREVIEW' ? oscData : Array(80).fill(0).map((_, i) => 128 + Math.sin(i / 5) * 80);
        const W = 280, H = 120;
        const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / 255) * H}`).join(' ');
        const freqEst = (comp.props.timebase || 50);
        return (
            <div style={{ width: '100%', height: '100%', background: '#000a00', borderRadius: '12px', padding: '10px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00ff88', fontFamily: 'monospace' }}>⚡ {comp.props.label || 'Oscilloscope'}</span>
                    <span style={{ fontSize: '0.6rem', color: '#4ade80', fontFamily: 'monospace' }}>PIN {comp.props.pin || 'A0'} | {freqEst}ms/div</span>
                </div>
                <div style={{ flex: 1, border: '1px solid #00ff4430', borderRadius: '6px', background: '#00100a', padding: '4px', position: 'relative', overflow: 'hidden' }}>
                    {[0.25, 0.5, 0.75].map((f, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${f * 100}%`, borderTop: '1px dashed #00ff4420' }} />)}
                    {[0.2, 0.4, 0.6, 0.8].map((f, i) => <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${f * 100}%`, borderLeft: '1px dashed #00ff4220' }} />)}
                    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                        <polyline points={pts} fill="none" stroke="#00ff88" strokeWidth="1.5" />
                    </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#4ade80', marginTop: '4px', fontFamily: 'monospace' }}>
                    <span>CH1: {comp.props.amplitude || 5}V</span>
                    <span>TRIG: AUTO</span>
                    <span>SAMPLE: {data.length}pts</span>
                </div>
            </div>
        );
    }

    // --- ARDUINO_THERMAL ---
    if (comp.type === 'ARDUINO_THERMAL') {
        const grid = viewMode === 'PREVIEW' ? thermalGrid : Array(64).fill(0).map((_, i) => 20 + Math.random() * 40);
        const maxT = comp.props.maxTemp || 80;
        const palette = comp.props.colorPalette || 'IRONBOW';
        const getColor = (v) => {
            const t = Math.min(1, Math.max(0, v / maxT));
            if (palette === 'IRONBOW') {
                const r = Math.min(255, Math.round(t < 0.5 ? t * 2 * 100 : 100 + (t - 0.5) * 2 * 155));
                const g = Math.min(255, Math.round(t < 0.33 ? 0 : t < 0.66 ? (t - 0.33) * 3 * 200 : 200 + (t - 0.66) * 3 * 55));
                const b = Math.min(255, Math.round(t < 0.5 ? 150 - t * 2 * 150 : 0));
                return `rgb(${r},${g},${b})`;
            }
            const r2 = Math.round(t * 255);
            return `rgb(${r2},${Math.round((1 - Math.abs(t - 0.5) * 2) * 255)},${255 - r2})`;
        };
        return (
            <div style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '12px', padding: '10px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>🌡 {comp.props.label || 'Thermal Camera'}</span>
                    <span style={{ fontSize: '0.6rem', color: '#f97316' }}>AMG8833 | 8×8 px</span>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px' }}>
                    {grid.map((v, i) => (
                        <div key={i} title={`${v.toFixed(1)}°C`}
                            style={{ borderRadius: '2px', background: getColor(v), aspectRatio: '1', transition: 'background 0.3s' }} />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#64748b', marginTop: '6px' }}>
                    <span>Min: {Math.min(...grid).toFixed(1)}°C</span>
                    <span>Max: {Math.max(...grid).toFixed(1)}°C</span>
                </div>
            </div>
        );
    }

    // --- ARDUINO_THERMOMETER ---
    if (comp.type === 'ARDUINO_THERMOMETER') {
        const mn = parseFloat(comp.props.minVal ?? 0);
        const mx = parseFloat(comp.props.maxVal ?? 100);
        const val = viewMode === 'PREVIEW' ? thermoValue : (mx - mn) * 0.4 + mn;
        const pct = Math.min(1, Math.max(0, (val - mn) / (mx - mn)));
        const barH = 160;
        const fillH = pct * barH;
        const tempColor = pct > 0.8 ? '#ef4444' : pct > 0.6 ? '#f59e0b' : '#3b82f6';
        return (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-panel)', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', width: '100%', textAlign: 'left' }}>🌡 {comp.props.label || 'Thermometer'}</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <svg width="40" height={barH + 30} viewBox={`0 0 40 ${barH + 30}`}>
                        <rect x="14" y="0" width="12" height={barH} rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="14" y={barH - fillH} width="12" height={fillH} rx="6" fill={tempColor}
                            style={{ transition: 'height 0.6s ease, y 0.6s ease' }} />
                        <circle cx="20" cy={barH + 12} r="12" fill={tempColor} />
                        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                            <line key={i} x1="22" y1={barH * (1 - f)} x2="30" y2={barH * (1 - f)}
                                stroke="#64748b" strokeWidth="1" />
                        ))}
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: tempColor, fontFamily: 'monospace' }}>
                            {val.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{comp.props.unit || '°C'}</div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-quaternary)' }}>PIN: {comp.props.pin || 'A0'}</div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-quaternary)' }}>{mn}{comp.props.unit || '°C'} – {mx}{comp.props.unit || '°C'}</div>
                    </div>
                </div>
            </div>
        );
    }

    // --- ARDUINO_SCADA_VALVE ---
    if (comp.type === 'ARDUINO_SCADA_VALVE') {
        const isOpen = viewMode === 'PREVIEW' ? scadaValveState : (comp.props.state || false);
        const valveType = comp.props.valveType || 'SOLENOID';
        const label = comp.props.label || 'Solenoid Valve';
        const pin = comp.props.pin || 'D3';

        const handleValveToggle = () => {
            if (viewMode !== 'PREVIEW') return;
            const newState = !scadaValveState;
            setScadaValveState(newState);
            const cmd = newState ? `d${pin}:1` : `d${pin}:0`;
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.publishMqtt(comp.props.mqttPublishTopic || 'arduino/valve/control', newState ? '1' : '0');
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.writeWifi(hardwareService.wifiIpAddress, pin, newState ? 1 : 0);
            } else {
                hardwareService.writeSerial(`${cmd}\n`);
            }
            onWidgetInteraction(comp, 'ValveToggled', { state: newState, pin });
        };

        return (
            <div style={{
                width: '100%', height: '100%', background: 'var(--bg-panel)',
                border: `2px solid ${isOpen ? '#10b981' : '#ef4444'}`,
                borderRadius: '12px', padding: '10px', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'relative'
            }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>⚙ {label}</span>
                    <span style={{
                        fontSize: '0.6rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 'bold',
                        background: isOpen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: isOpen ? '#10b981' : '#ef4444'
                    }}>{isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>

                {/* Bowtie Valve SVG Symbol */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="120" height="70" viewBox="0 0 120 70">
                        {/* Pipe stubs */}
                        <rect x="0" y="29" width="25" height="12" rx="2" fill="#475569" />
                        <rect x="95" y="29" width="25" height="12" rx="2" fill="#475569" />
                        {/* Bowtie body (two triangles) */}
                        <polygon points="25,10 60,35 25,60" fill={isOpen ? '#10b981' : '#ef4444'} opacity="0.9" />
                        <polygon points="95,10 60,35 95,60" fill={isOpen ? '#10b981' : '#ef4444'} opacity="0.9" />
                        {/* Centre stem */}
                        <line x1="60" y1="0" x2="60" y2="14" stroke="#94a3b8" strokeWidth="3" />
                        <circle cx="60" cy="6" r="6" fill={isOpen ? '#10b981' : '#94a3b8'} stroke="#1e293b" strokeWidth="1.5" />
                        {/* Flow arrows when open */}
                        {isOpen && (
                            <>
                                <polyline points="30,35 50,35" stroke="#10b981" strokeWidth="2.5" fill="none" markerEnd="url(#arr)" opacity="0.7" />
                                <polyline points="70,35 90,35" stroke="#10b981" strokeWidth="2.5" fill="none" opacity="0.7" />
                                <polygon points="88,31 96,35 88,39" fill="#10b981" />
                            </>
                        )}
                    </svg>
                </div>

                <button
                    onClick={handleValveToggle}
                    disabled={viewMode !== 'PREVIEW'}
                    style={{
                        width: '100%', padding: '6px 12px', fontSize: '0.7rem', fontWeight: 'bold',
                        background: isOpen ? '#ef4444' : '#10b981', color: 'white',
                        border: 'none', borderRadius: '6px', cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default',
                        transition: 'background 0.2s'
                    }}
                >{isOpen ? '⛔ Close Valve' : '✅ Open Valve'}</button>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-quaternary)', fontFamily: 'monospace' }}>
                    {valveType} | PIN: {pin}
                </div>
            </div>
        );
    }

    // --- ARDUINO_SCADA_PUMP ---
    if (comp.type === 'ARDUINO_SCADA_PUMP') {
        const isRunning = viewMode === 'PREVIEW' ? scadaPumpState : (comp.props.state || false);
        const speed = viewMode === 'PREVIEW' ? scadaPumpSpeed : (comp.props.speed || 0);
        const pumpType = comp.props.pumpType || 'CENTRIFUGAL';
        const label = comp.props.label || 'Pump';
        const pin = comp.props.pin || 'D9';
        const pumpIcons = { CENTRIFUGAL: '🌀', VACUUM: '💨', FAN: '🔄' };

        const handlePumpToggle = () => {
            if (viewMode !== 'PREVIEW') return;
            const newState = !scadaPumpState;
            setScadaPumpState(newState);
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.publishMqtt(comp.props.mqttPublishTopic || 'arduino/pump/control', newState ? '1' : '0');
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.writeWifi(hardwareService.wifiIpAddress, pin, newState ? 1 : 0);
            } else {
                hardwareService.writeSerial(`d${pin}:${newState ? 1 : 0}\n`);
            }
            onWidgetInteraction(comp, 'PumpToggled', { state: newState, pin });
        };

        const handleSpeedChange = (e) => {
            if (viewMode !== 'PREVIEW') return;
            const spd = parseInt(e.target.value);
            setScadaPumpSpeed(spd);
            const pwmVal = Math.round((spd / 100) * 255);
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.publishMqtt(comp.props.mqttPublishTopic || 'arduino/pump/control', String(pwmVal));
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.writeWifi(hardwareService.wifiIpAddress, pin, pwmVal);
            } else {
                hardwareService.writeSerial(`p${pin}:${pwmVal}\n`);
            }
        };

        const animSpeed = isRunning ? Math.max(0.3, 3 - (speed / 100) * 2.5) : 0;

        return (
            <div style={{
                width: '100%', height: '100%', background: 'var(--bg-panel)',
                border: `2px solid ${isRunning ? '#10b981' : '#475569'}`,
                borderRadius: '12px', padding: '10px', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
            }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{pumpIcons[pumpType] || '🌀'} {label}</span>
                    <span style={{
                        fontSize: '0.6rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 'bold',
                        background: isRunning ? 'rgba(16,185,129,0.15)' : 'rgba(71,85,105,0.2)',
                        color: isRunning ? '#10b981' : '#94a3b8'
                    }}>{isRunning ? 'RUNNING' : 'STOPPED'}</span>
                </div>

                {/* Animated Impeller */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', position: 'relative',
                        animation: isRunning ? `spin ${animSpeed}s linear infinite` : 'none'
                    }}>
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="38" fill="none" stroke={isRunning ? '#10b981' : '#475569'} strokeWidth="2" />
                            {/* Blades */}
                            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                                const rad = (angle * Math.PI) / 180;
                                const x1 = 40 + 14 * Math.cos(rad);
                                const y1 = 40 + 14 * Math.sin(rad);
                                const x2 = 40 + 32 * Math.cos(rad + 0.7);
                                const y2 = 40 + 32 * Math.sin(rad + 0.7);
                                return (
                                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke={isRunning ? '#10b981' : '#475569'} strokeWidth="4" strokeLinecap="round" />
                                );
                            })}
                            <circle cx="40" cy="40" r="8" fill={isRunning ? '#10b981' : '#475569'} />
                        </svg>
                    </div>
                </div>

                {/* Speed Slider */}
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Speed:</span>
                    <input type="range" min="0" max="100" value={speed}
                        onChange={handleSpeedChange}
                        disabled={viewMode !== 'PREVIEW' || !isRunning}
                        style={{ flex: 1, accentColor: '#10b981' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#10b981', fontFamily: 'monospace', minWidth: '28px' }}>{speed}%</span>
                </div>

                <button onClick={handlePumpToggle} disabled={viewMode !== 'PREVIEW'}
                    style={{
                        width: '100%', padding: '6px', fontSize: '0.7rem', fontWeight: 'bold',
                        background: isRunning ? '#ef4444' : '#10b981', color: 'white',
                        border: 'none', borderRadius: '6px', cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default', transition: 'background 0.2s'
                    }}>{isRunning ? '⏹ Stop Pump' : '▶ Start Pump'}</button>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-quaternary)', fontFamily: 'monospace' }}>
                    {pumpType} | PIN: {pin}
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // --- ARDUINO_SCADA_PIPE ---
    if (comp.type === 'ARDUINO_SCADA_PIPE') {
        const flowActive = comp.props.flowActive !== false;
        const flowColor = comp.props.flowColor || '#3b82f6';
        const flowSpeed = comp.props.flowSpeed || 2;
        const orientation = comp.props.orientation || 'HORIZONTAL';
        const isHoriz = orientation !== 'VERTICAL';
        const label = comp.props.label || 'Flow Pipeline';
        const flowRate = viewMode === 'PREVIEW' ? scadaPipeFlow : 0;

        const animDuration = Math.max(0.3, 3 / flowSpeed);
        const pipeW = isHoriz ? '100%' : '40px';
        const pipeH = isHoriz ? '40px' : '100%';

        return (
            <div style={{
                width: '100%', height: '100%', background: 'var(--bg-panel)',
                border: '1px solid var(--border-secondary)', borderRadius: '12px',
                padding: '10px', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: '6px'
            }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>🔵 {label}</span>
                    {viewMode === 'PREVIEW' && (
                        <span style={{ fontSize: '0.6rem', color: flowColor, fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {flowRate.toFixed(1)} L/min
                        </span>
                    )}
                </div>

                {/* Animated Pipe */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <div style={{
                        width: pipeW, height: pipeH, maxWidth: '100%', maxHeight: '100%',
                        background: '#1e293b', borderRadius: '20px',
                        border: `3px solid ${flowColor}`, position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Animated dashes */}
                        <div style={{
                            position: 'absolute',
                            top: isHoriz ? '50%' : '0%',
                            left: isHoriz ? '0%' : '50%',
                            width: isHoriz ? '200%' : '4px',
                            height: isHoriz ? '4px' : '200%',
                            transform: isHoriz ? 'translateY(-50%)' : 'translateX(-50%)',
                            background: flowActive
                                ? `repeating-linear-gradient(${isHoriz ? '90deg' : '180deg'}, ${flowColor} 0px, ${flowColor} 16px, transparent 16px, transparent 28px)`
                                : 'transparent',
                            animation: flowActive ? `pipeFlow${isHoriz ? 'H' : 'V'} ${animDuration}s linear infinite` : 'none',
                            opacity: 0.7
                        }} />
                    </div>
                </div>

                <div style={{ fontSize: '0.55rem', color: 'var(--text-quaternary)', fontFamily: 'monospace' }}>
                    {orientation} | Flow: {flowActive ? 'ACTIVE' : 'IDLE'} | PIN: {comp.props.pin || 'D2'}
                </div>
                <style>{`
                    @keyframes pipeFlowH { from { left: 0%; } to { left: -50%; } }
                    @keyframes pipeFlowV { from { top: 0%; } to { top: -50%; } }
                `}</style>
            </div>
        );
    }

    // --- ARDUINO_SCADA_ESTOP ---
    if (comp.type === 'ARDUINO_SCADA_ESTOP') {
        const isTripped = viewMode === 'PREVIEW' ? scadaEstopActive : (comp.props.state || false);
        const label = comp.props.label || 'EMERGENCY STOP';
        const requireConfirm = comp.props.requireConfirmation !== false;

        const handleEstop = () => {
            if (viewMode !== 'PREVIEW') return;
            if (!isTripped && requireConfirm) {
                if (!window.confirm('⚠️ ACTIVATE EMERGENCY STOP?\n\nThis will send a STOP signal to all connected devices.')) return;
            }
            const newState = !isTripped;
            setScadaEstopActive(newState);
            const pin = comp.props.pin || 'D10';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.publishMqtt(comp.props.mqttPublishTopic || 'arduino/estop/trip', newState ? '1' : '0');
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.writeWifi(hardwareService.wifiIpAddress, pin, newState ? 1 : 0);
            } else {
                hardwareService.writeSerial(`d${pin}:${newState ? 1 : 0}\n`);
            }
            if (newState) {
                setScadaAlarms(prev => [{
                    id: Date.now(), tag: 'SYS-ESTOP', msg: 'EMERGENCY STOP ACTIVATED by operator',
                    time: new Date().toLocaleTimeString(), severity: 'CRITICAL', ack: false
                }, ...prev].slice(0, 50));
            }
            onWidgetInteraction(comp, 'EmergencyStop', { active: newState });
        };

        return (
            <div style={{
                width: '100%', height: '100%',
                background: isTripped ? '#450a0a' : '#1c1917',
                border: `3px solid ${isTripped ? '#ef4444' : '#78716c'}`,
                borderRadius: '12px', padding: '12px', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
            }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: isTripped ? '#fca5a5' : '#a8a29e', letterSpacing: '0.05em', textAlign: 'center' }}>
                    ⚠ {label}
                </div>

                {/* Mushroom Button */}
                <button
                    onClick={handleEstop}
                    disabled={viewMode !== 'PREVIEW'}
                    style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: isTripped
                            ? 'radial-gradient(circle at 35% 35%, #ff6b6b, #dc2626)'
                            : 'radial-gradient(circle at 35% 35%, #f87171, #b91c1c)',
                        border: `4px solid ${isTripped ? '#fca5a5' : '#7f1d1d'}`,
                        cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default',
                        boxShadow: isTripped
                            ? '0 0 30px rgba(239,68,68,0.8), inset 0 2px 4px rgba(255,255,255,0.2)'
                            : '0 4px 12px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1)',
                        animation: isTripped ? 'estopPulse 1s ease-in-out infinite' : 'none',
                        fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s'
                    }}
                >🔴</button>

                {/* Status Text */}
                <div style={{
                    fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace',
                    color: isTripped ? '#ef4444' : '#78716c', textAlign: 'center',
                    letterSpacing: '0.08em'
                }}>
                    {isTripped ? '■ STOP ACTIVE — Click to RESET' : '● NORMAL — Click to ACTIVATE'}
                </div>

                {/* Indicator Ring */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isTripped ? '#ef4444' : '#22c55e' }} />
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-quaternary)', fontFamily: 'monospace' }}>
                        PIN: {comp.props.pin || 'D10'}
                    </span>
                </div>

                <style>{`@keyframes estopPulse { 0%,100%{box-shadow:0 0 30px rgba(239,68,68,0.8)} 50%{box-shadow:0 0 50px rgba(239,68,68,1),0 0 80px rgba(239,68,68,0.4)} }`}</style>
            </div>
        );
    }

    // --- ARDUINO_SCADA_ALARM_BANNER ---
    if (comp.type === 'ARDUINO_SCADA_ALARM_BANNER') {
        const alarms = viewMode === 'PREVIEW' ? scadaAlarms : [
            { id: 1, tag: 'TMP-01', msg: 'High temperature detected on Zone A', time: '12:00:01', severity: 'CRITICAL', ack: false },
            { id: 2, tag: 'PRS-02', msg: 'Low pressure warning on Line 2', time: '12:01:30', severity: 'WARNING', ack: false },
            { id: 3, tag: 'SYS-01', msg: 'SCADA System initialized and ready', time: '12:00:00', severity: 'INFO', ack: true },
        ];

        const handleAck = (alarmId) => {
            if (viewMode !== 'PREVIEW') return;
            setScadaAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, ack: true } : a));
            onWidgetInteraction(comp, 'AlarmAcknowledged', { alarmId });
        };

        const handleAckAll = () => {
            if (viewMode !== 'PREVIEW') return;
            setScadaAlarms(prev => prev.map(a => ({ ...a, ack: true })));
            onWidgetInteraction(comp, 'AllAlarmsAcknowledged', {});
        };

        const severityColor = { CRITICAL: '#ef4444', WARNING: '#f59e0b', INFO: '#3b82f6' };
        const unackedCount = alarms.filter(a => !a.ack).length;

        return (
            <div style={{
                width: '100%', height: '100%', background: '#0a0a0a',
                border: `2px solid ${unackedCount > 0 ? '#ef4444' : '#334155'}`,
                borderRadius: '12px', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                animation: unackedCount > 0 ? 'alarmBlink 1.5s ease-in-out infinite' : 'none'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', background: '#111827', borderBottom: '1px solid #1e293b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bell size={12} color={unackedCount > 0 ? '#ef4444' : '#64748b'} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: unackedCount > 0 ? '#fca5a5' : '#94a3b8' }}>
                            {comp.props.label || 'Active Alarms'}
                        </span>
                        {unackedCount > 0 && (
                            <span style={{
                                fontSize: '0.55rem', background: '#ef4444', color: 'white',
                                borderRadius: '10px', padding: '1px 6px', fontWeight: 'bold'
                            }}>{unackedCount}</span>
                        )}
                    </div>
                    <button onClick={handleAckAll} disabled={viewMode !== 'PREVIEW' || unackedCount === 0}
                        style={{
                            fontSize: '0.6rem', padding: '2px 8px', background: unackedCount > 0 ? '#1d4ed8' : 'transparent',
                            color: unackedCount > 0 ? 'white' : '#475569', border: '1px solid #334155',
                            borderRadius: '4px', cursor: unackedCount > 0 && viewMode === 'PREVIEW' ? 'pointer' : 'default'
                        }}>ACK ALL</button>
                </div>

                {/* Alarm List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
                    {alarms.slice(0, comp.props.maxAlarms || 10).map((alarm) => (
                        <div key={alarm.id} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px 6px', marginBottom: '2px',
                            background: alarm.ack ? '#0f172a' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${alarm.ack ? '#1e293b' : severityColor[alarm.severity] || '#ef4444'}40`,
                            borderRadius: '4px', opacity: alarm.ack ? 0.6 : 1
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: severityColor[alarm.severity] || '#ef4444', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.55rem', color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>{alarm.time}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: severityColor[alarm.severity] || '#ef4444', flexShrink: 0 }}>[{alarm.tag}]</span>
                            <span style={{ fontSize: '0.6rem', color: alarm.ack ? '#475569' : '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alarm.msg}</span>
                            {!alarm.ack && (
                                <button onClick={() => handleAck(alarm.id)} disabled={viewMode !== 'PREVIEW'}
                                    style={{
                                        fontSize: '0.5rem', padding: '1px 5px', background: '#1d4ed8',
                                        color: 'white', border: 'none', borderRadius: '3px',
                                        cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default', flexShrink: 0
                                    }}>ACK</button>
                            )}
                            {alarm.ack && <span style={{ fontSize: '0.5rem', color: '#22c55e', flexShrink: 0 }}>✓</span>}
                        </div>
                    ))}
                    {alarms.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#334155', fontSize: '0.7rem' }}>
                            ✅ No active alarms
                        </div>
                    )}
                </div>
                <style>{`@keyframes alarmBlink { 0%,100%{border-color:#ef4444} 50%{border-color:#450a0a} }`}</style>
            </div>
        );
    }

    // --- ARDUINO_SCADA_PID ---
    if (comp.type === 'ARDUINO_SCADA_PID') {
        const sp = viewMode === 'PREVIEW' ? pidSp : (comp.props.sp || 50);
        const pv = viewMode === 'PREVIEW' ? pidPv : (comp.props.pv || 45);
        const op = viewMode === 'PREVIEW' ? pidOp : (comp.props.op || 30);
        const kp = comp.props.kp || 1.5;
        const ki = comp.props.ki || 0.2;
        const kd = comp.props.kd || 0.1;
        const mode = comp.props.mode || 'AUTO';
        const label = comp.props.label || 'PID Controller';

        const spPct = Math.min(100, Math.max(0, sp));
        const pvPct = Math.min(100, Math.max(0, pv));
        const opPct = Math.min(100, Math.max(0, op));
        const error = (pv - sp).toFixed(1);
        const deviation = Math.abs(pv - sp);
        const devColor = deviation > 10 ? '#ef4444' : deviation > 5 ? '#f59e0b' : '#10b981';

        const handleSpChange = (e) => {
            if (viewMode !== 'PREVIEW' || mode !== 'AUTO') return;
            const val = parseFloat(e.target.value);
            setPidSp(val);
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.publishMqtt(comp.props.mqttPublishTopic || 'arduino/pid/control', JSON.stringify({ sp: val }));
            } else {
                hardwareService.writeSerial(`pid:sp:${val}\n`);
            }
            onWidgetInteraction(comp, 'SetpointChanged', { sp: val });
        };

        const handleOpChange = (e) => {
            if (viewMode !== 'PREVIEW' || mode !== 'MANUAL') return;
            const val = parseFloat(e.target.value);
            setPidOp(val);
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.publishMqtt(comp.props.mqttPublishTopic || 'arduino/pid/control', JSON.stringify({ op: val }));
            } else {
                hardwareService.writeSerial(`pid:op:${val}\n`);
            }
            onWidgetInteraction(comp, 'OutputChanged', { op: val });
        };

        const Bar = ({ label: bLabel, pct, color, value, unit = '%' }) => (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color, fontFamily: 'monospace' }}>{bLabel}</span>
                <div style={{ width: '28px', height: '100px', background: '#0f172a', border: `1px solid ${color}40`, borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: `${pct}%`, background: color, opacity: 0.85,
                        transition: 'height 0.4s ease', borderRadius: '2px 2px 0 0'
                    }} />
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color, fontFamily: 'monospace' }}>{value.toFixed(1)}</span>
                <span style={{ fontSize: '0.5rem', color: '#64748b' }}>{unit}</span>
            </div>
        );

        return (
            <div style={{
                width: '100%', height: '100%', background: '#0f172a',
                border: `2px solid ${tealColor}40`, borderRadius: '12px',
                padding: '10px', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: tealColor }}>⚡ {label}</span>
                    <span style={{
                        fontSize: '0.6rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 'bold',
                        background: mode === 'AUTO' ? 'rgba(0,151,157,0.15)' : 'rgba(245,158,11,0.15)',
                        color: mode === 'AUTO' ? tealColor : '#f59e0b'
                    }}>{mode}</span>
                </div>

                {/* Triple Bar Display */}
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '140px' }}>
                    <Bar label="SP" pct={spPct} color={tealColor} value={sp} />
                    <Bar label="PV" pct={pvPct} color={devColor} value={pv} />
                    <Bar label="OP" pct={opPct} color="#a78bfa" value={op} />
                </div>

                {/* Error Display */}
                <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px',
                    padding: '3px 8px', background: '#1e293b', borderRadius: '4px'
                }}>
                    <span style={{ fontSize: '0.55rem', color: '#64748b' }}>ERR:</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: devColor, fontFamily: 'monospace' }}>
                        {error > 0 ? '+' : ''}{error}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: '#475569', marginLeft: '8px' }}>Kp:{kp} Ki:{ki} Kd:{kd}</span>
                </div>

                {/* SP / OP Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {mode === 'AUTO' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.55rem', color: tealColor, minWidth: '16px' }}>SP</span>
                            <input type="range" min="0" max="100" step="0.5" value={sp}
                                onChange={handleSpChange}
                                disabled={viewMode !== 'PREVIEW'}
                                style={{ flex: 1, accentColor: tealColor }} />
                            <span style={{ fontSize: '0.6rem', color: tealColor, fontFamily: 'monospace', minWidth: '28px' }}>{sp.toFixed(1)}</span>
                        </div>
                    )}
                    {mode === 'MANUAL' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.55rem', color: '#a78bfa', minWidth: '16px' }}>OP</span>
                            <input type="range" min="0" max="100" step="0.5" value={op}
                                onChange={handleOpChange}
                                disabled={viewMode !== 'PREVIEW'}
                                style={{ flex: 1, accentColor: '#a78bfa' }} />
                            <span style={{ fontSize: '0.6rem', color: '#a78bfa', fontFamily: 'monospace', minWidth: '28px' }}>{op.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                <div style={{ fontSize: '0.55rem', color: '#334155', fontFamily: 'monospace', textAlign: 'center' }}>
                    PIN PV:{comp.props.pinPV || 'A1'} | SP:{comp.props.pinSP || 'A0'} | OP:{comp.props.pinOP || 'D5'}
                </div>
            </div>
        );
    }

    return null;
};

export default ArduinoWidget;

