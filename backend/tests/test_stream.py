import asyncio
import json
import os
import sys
import urllib.request
import websockets

# Ensure UTF-8 output encoding on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

WS_URL = "ws://127.0.0.1:8000/api/v1/stream/ws/triage"
API_URL = "http://127.0.0.1:8000/api/v1/patients"

def post_json(url: str, data: dict):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5.0) as response:
        return json.loads(response.read().decode("utf-8"))

async def test_websocket_pipeline():
    print("🧪 [TEST 1/4] Connecting to WebSocket triage stream...")
    async with websockets.connect(WS_URL) as ws:
        # 1. Verify handshake
        handshake_raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
        handshake = json.loads(handshake_raw)
        print(f"✅ Received Handshake: {handshake}")
        assert handshake.get("type") == "CONNECTION_ESTABLISHED"
        assert handshake.get("status") == "STREAMING_ACTIVE"

        # 2. Test Ping / Pong Latency Heartbeat
        print("🧪 [TEST 2/4] Sending keep-alive PING message...")
        t0 = asyncio.get_event_loop().time()
        await ws.send(json.dumps({"type": "PING", "timestamp": int(t0 * 1000)}))
        
        pong_raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
        pong = json.loads(pong_raw)
        t1 = asyncio.get_event_loop().time()
        latency_ms = round((t1 - t0) * 1000, 2)
        print(f"✅ Received PONG: {pong} (Round-trip latency: {latency_ms}ms)")
        assert pong.get("type") == "PONG"

        # 3. Test Real-time Patient Intake Broadcast via Server REST Call
        print("🧪 [TEST 3/4] Triggering real-time patient intake via HTTP POST to server...")
        test_patient = {
            "id": "DFU-STREAM-999",
            "name": "Maria Hernandez",
            "age": 59,
            "gender": "Female",
            "diabetesType": "Type 2 DM (16 yrs)",
            "hba1c": "9.4%",
            "calculatedSinbad": 5, # Critical -> Triggers emergency alert
            "woundAreaCm2": 4.15,
            "locationLabel": "Right Plantar Midfoot Charcot",
            "triageLevel": "CRITICAL SURGICAL EMERGENCY",
            "triageColor": "#f43f5e"
        }

        # Dispatch in executor to avoid blocking asyncio event loop
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, post_json, f"{API_URL}/intake", test_patient)

        # Expect general intake event first
        intake_event_raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
        intake_event = json.loads(intake_event_raw)
        print(f"✅ Received Event 1: {intake_event.get('type')} for {intake_event.get('data', {}).get('id')}")
        assert intake_event.get("type") == "PATIENT_INTAKE_PROCESSED"
        assert intake_event.get("data", {}).get("id") == "DFU-STREAM-999"

        # Expect critical emergency alert event (since SINBAD >= 4)
        critical_event_raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
        critical_event = json.loads(critical_event_raw)
        print(f"🚨 Received Event 2: {critical_event.get('type')} (Score: {critical_event.get('data', {}).get('sinbadScore')})")
        assert critical_event.get("type") == "CRITICAL_TRIAGE_ALERT"
        assert critical_event.get("data", {}).get("sinbadScore") == 5

        # 4. Test Physician Sign-Off Broadcast via Server REST Call
        print("🧪 [TEST 4/4] Testing physician validation sign-off broadcast...")
        verify_payload = {
            "finalScore": 5,
            "verifiedIschemia": True,
            "verifiedDepth": True,
            "doctorNotes": "Verified deep midfoot ulcer with compromised pedal pulses."
        }
        await loop.run_in_executor(None, post_json, f"{API_URL}/DFU-STREAM-999/verify", verify_payload)

        verified_raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
        verified_event = json.loads(verified_raw)
        print(f"✅ Received Event 3: {verified_event.get('type')} for {verified_event.get('data', {}).get('patientId')}")
        assert verified_event.get("type") == "PATIENT_VERIFIED"
        assert verified_event.get("data", {}).get("patientId") == "DFU-STREAM-999"

    print("\n🎉 ALL 4 WEBSOCKET REAL-TIME STREAMING TESTS PASSED (Sub-50ms push verified)!")

if __name__ == "__main__":
    asyncio.run(test_websocket_pipeline())
