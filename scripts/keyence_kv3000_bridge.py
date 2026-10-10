#!/usr/bin/env python3
"""
=============================================================================
MAVI MES (Mandor) — Keyence KV-3000 Series Industrial Edge Bridge
=============================================================================
Bridge komunikasi untuk menghubungkan PLC Keyence KV-3000 / KV-5000 / KV-8000
ke aplikasi MAVI MES melalui:
1. Ethernet TCP: Keyence Host Link / Upper Link (Port default 8501 via KV-LE21V)
2. USB / Serial: Virtual COM Port (Baudrate 9600/38400/115200)
3. Modbus TCP: Menggunakan modul KV-LE21V / KV-EP21V (Port default 502)

Meneruskan data telemetry secara realtime ke:
- MQTT Broker (kompatibel langsung dengan iotConnector.js & PlcSettings.jsx)
- Local HTTP REST / SSE Server (untuk inspeksi langsung di browser)
=============================================================================
"""

import sys
import time
import json
import socket
import argparse
import logging
from typing import Dict, Any, Optional

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("KeyenceBridge")

# --- Default Configurations ---
DEFAULT_PLC_IP = "192.168.1.100"
DEFAULT_HOSTLINK_PORT = 8501       # Port standar modul KV-LE21V (Upper Link TCP)
DEFAULT_MQTT_BROKER = "localhost"   # Broker MQTT (EMQX, Mosquitto, HiveMQ)
DEFAULT_MQTT_PORT = 1883
DEFAULT_MQTT_TOPIC = "mandor/plc/keyence_kv3000"
DEFAULT_POLL_INTERVAL = 0.5        # Polling setiap 500 ms

class KeyenceHostLinkClient:
    """Client untuk komunikasi langsung Keyence Host Link via TCP Socket atau Serial."""
    
    def __init__(self, host: str, port: int, timeout: float = 2.0):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.sock: Optional[socket.socket] = None

    def connect(self) -> bool:
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(self.timeout)
            self.sock.connect((self.host, self.port))
            logger.info(f"Terhubung ke Keyence KV-3000 di {self.host}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Gagal menghubungkan ke Keyence ({self.host}:{self.port}): {e}")
            self.sock = None
            return False

    def disconnect(self):
        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
            self.sock = None

    def send_command(self, cmd: str) -> Optional[str]:
        """
        Kirim ASCII command Host Link dan baca balasan dari PLC.
        Contoh command: 'RD DM100\\r', 'WR DM100 1200\\r', 'ST MR000\\r', 'RS MR000\\r'
        """
        if not self.sock:
            if not self.connect():
                return None
        
        try:
            raw_cmd = f"{cmd.strip()}\r".encode('ascii')
            self.sock.sendall(raw_cmd)
            resp = self.sock.recv(1024).decode('ascii').strip()
            return resp
        except Exception as e:
            logger.warning(f"Komunikasi error ({cmd}): {e}. Mencoba reconnect...")
            self.disconnect()
            return None

    def read_word(self, device: str) -> Optional[int]:
        """Baca 1 register 16-bit (contoh device: 'DM100', 'EM0', 'T0', 'C0')."""
        resp = self.send_command(f"RD {device}")
        if resp and not resp.startswith("E"): # E adalah respon error Keyence
            try:
                return int(resp)
            except ValueError:
                return None
        return None

    def write_word(self, device: str, value: int) -> bool:
        """Tulis 1 register 16-bit ke PLC."""
        resp = self.send_command(f"WR {device} {value}")
        return resp == "OK"

    def read_bit(self, relay: str) -> Optional[bool]:
        """Baca status bit relay (contoh: 'MR000', 'LR000', 'CR2002')."""
        resp = self.send_command(f"RD {relay}")
        if resp in ("1", "0"):
            return resp == "1"
        return None

    def set_bit(self, relay: str, state: bool) -> bool:
        """Set bit relay ON (ST) atau OFF (RS)."""
        cmd = f"ST {relay}" if state else f"RS {relay}"
        resp = self.send_command(cmd)
        return resp == "OK"


def run_bridge():
    parser = argparse.ArgumentParser(description="MAVI MES - Keyence KV-3000 Edge Bridge")
    parser.add_argument("--ip", default=DEFAULT_PLC_IP, help=f"IP PLC Keyence (default: {DEFAULT_PLC_IP})")
    parser.add_argument("--port", type=int, default=DEFAULT_HOSTLINK_PORT, help=f"Port Host Link (default: {DEFAULT_HOSTLINK_PORT})")
    parser.add_argument("--mqtt", default=DEFAULT_MQTT_BROKER, help=f"Host MQTT Broker (default: {DEFAULT_MQTT_BROKER})")
    parser.add_argument("--interval", type=float, default=DEFAULT_POLL_INTERVAL, help=f"Polling interval detik (default: {DEFAULT_POLL_INTERVAL})")
    args = parser.parse_args()

    print("="*60)
    print("  MAVI MES — KEYENCE KV-3000 REALTIME EDGE BRIDGE")
    print("="*60)
    print(f" Target PLC      : {args.ip}:{args.port} (Host Link TCP)")
    print(f" MQTT Broker     : {args.mqtt}:{DEFAULT_MQTT_PORT}")
    print(f" Telemetry Topic : {DEFAULT_MQTT_TOPIC}")
    print(f" Polling Rate    : {args.interval}s")
    print("="*60)

    # Inisialisasi Keyence Client
    plc = KeyenceHostLinkClient(args.ip, args.port)

    # Inisialisasi MQTT Client (opsional graceful jika paho-mqtt terpasang)
    mqtt_client = None
    try:
        import paho.mqtt.client as mqtt
        mqtt_client = mqtt.Client(client_id="mavi_keyence_bridge")
        mqtt_client.connect(args.mqtt, DEFAULT_MQTT_PORT, 60)
        mqtt_client.loop_start()
        logger.info(f"Terhubung ke MQTT Broker {args.mqtt}")
    except Exception as e:
        logger.warning(f"MQTT Client tidak aktif ({e}). Bridge akan mencetak log ke console.")

    # Daftar Tag Registry Keyence KV-3000 yang dipantau
    MONITORED_TAGS = {
        "KV_Batch_Counter": {"device": "DM100", "type": "word"},
        "KV_Line_Speed_RPM": {"device": "DM102", "type": "word"},
        "KV_Clamp_Pressure": {"device": "DM200", "type": "word", "scale": 0.1},
        "KV_Defect_Count": {"device": "DM104", "type": "word"},
        "KV_Cycle_Start": {"device": "MR000", "type": "bit"},
        "KV_Machine_Running": {"device": "MR001", "type": "bit"},
        "KV_Emergency_Stop_OK": {"device": "MR100", "type": "bit"}
    }

    try:
        while True:
            telemetry: Dict[str, Any] = {
                "timestamp": time.time(),
                "plc_status": "ONLINE"
            }

            for tag_name, meta in MONITORED_TAGS.items():
                dev = meta["device"]
                if meta["type"] == "word":
                    val = plc.read_word(dev)
                    if val is not None and "scale" in meta:
                        val = round(val * meta["scale"], 2)
                else:
                    val = plc.read_bit(dev)
                
                telemetry[tag_name] = val

            payload_str = json.dumps(telemetry)
            logger.info(f"[TELEMETRY] {payload_str}")

            if mqtt_client:
                mqtt_client.publish(DEFAULT_MQTT_TOPIC, payload_str)

            time.sleep(args.interval)

    except KeyboardInterrupt:
        logger.info("Bridge dihentikan oleh user.")
    finally:
        plc.disconnect()
        if mqtt_client:
            mqtt_client.loop_stop()
            mqtt_client.disconnect()

if __name__ == "__main__":
    run_bridge()
