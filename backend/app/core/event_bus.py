import asyncio
import json
import logging
from typing import List, Dict, Any, Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("heal6.event_bus")

class EventBus:
    """
    Enterprise In-Memory Event Bus & Connection Manager.
    Coordinates bidirectional WebSockets and Server-Sent Events (SSE)
    for sub-50ms clinical telemetry streaming.
    """
    def __init__(self):
        # Active WebSocket connections
        self.active_websockets: Set[WebSocket] = set()
        # Active SSE Subscriber Queues
        self.sse_queues: Set[asyncio.Queue] = set()
        self._lock = asyncio.Lock()

    async def connect_ws(self, websocket: WebSocket):
        """Accepts and registers a new clinician WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.active_websockets.add(websocket)
        logger.info(f"⚡ [WS CONNECT] Clinician terminal connected. Total active: {len(self.active_websockets)}")
        
        # Send initial connection handshake
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "protocol": "WebSocket",
            "status": "STREAMING_ACTIVE",
            "channel": "heal6_triage_stream"
        })

    async def disconnect_ws(self, websocket: WebSocket):
        """Removes a disconnected WebSocket connection."""
        async with self._lock:
            self.active_websockets.discard(websocket)
        logger.info(f"🔌 [WS DISCONNECT] Terminal disconnected. Total active: {len(self.active_websockets)}")

    async def register_sse(self) -> asyncio.Queue:
        """Registers a new SSE client queue."""
        queue = asyncio.Queue()
        async with self._lock:
            self.sse_queues.add(queue)
        logger.info(f"📡 [SSE REGISTER] SSE stream client registered. Total: {len(self.sse_queues)}")
        return queue

    async def unregister_sse(self, queue: asyncio.Queue):
        """Unregisters an SSE client queue."""
        async with self._lock:
            self.sse_queues.discard(queue)
        logger.info(f"📡 [SSE UNREGISTER] SSE stream client disconnected. Total: {len(self.sse_queues)}")

    async def broadcast(self, event_type: str, payload: Dict[str, Any]):
        """
        Broadcasts a structured event payload across all active WebSockets
        and SSE subscriber queues simultaneously.
        """
        message = {
            "type": event_type,
            "data": payload,
            "timestamp": asyncio.get_event_loop().time()
        }
        json_str = json.dumps(message)

        # 1. Dispatch to WebSockets
        disconnected_ws = []
        async with self._lock:
            for ws in list(self.active_websockets):
                try:
                    await ws.send_text(json_str)
                except Exception as err:
                    logger.warning(f"⚠️ [WS SEND FAILED] {err}, marking for removal.")
                    disconnected_ws.append(ws)

            for dead_ws in disconnected_ws:
                self.active_websockets.discard(dead_ws)

        # 2. Dispatch to SSE Subscribers
        disconnected_sse = []
        async with self._lock:
            for queue in list(self.sse_queues):
                try:
                    queue.put_nowait(json_str)
                except asyncio.QueueFull:
                    logger.warning("⚠️ [SSE QUEUE FULL] Subscriber queue overflow.")
                except Exception:
                    disconnected_sse.append(queue)

            for dead_queue in disconnected_sse:
                self.sse_queues.discard(dead_queue)

    async def broadcast_patient_intake(self, patient_record: dict):
        """Specialized high-priority broadcast when a patient scan is processed."""
        # 1. General queue update event
        await self.broadcast("PATIENT_INTAKE_PROCESSED", patient_record)

        # 2. If SINBAD >= 4, trigger Emergency Critical Alert broadcast
        sinbad_score = patient_record.get("calculatedSinbad", 0)
        if sinbad_score >= 4:
            logger.warning(f"🚨 [CRITICAL ALERT] Broadcasting emergency triage alert for {patient_record.get('id')} (SINBAD {sinbad_score})")
            await self.broadcast("CRITICAL_TRIAGE_ALERT", {
                "patientId": patient_record.get("id"),
                "patientName": patient_record.get("name"),
                "age": patient_record.get("age"),
                "sinbadScore": sinbad_score,
                "triageLevel": patient_record.get("triageLevel", "CRITICAL SURGICAL EMERGENCY"),
                "woundAreaCm2": patient_record.get("woundAreaCm2"),
                "locationLabel": patient_record.get("locationLabel"),
                "actionPlan": patient_record.get("actionPlan", {})
            })

    async def broadcast_triage_queue(self, queue: list):
        """Broadcasts full synchronized triage queue to all consoles."""
        await self.broadcast("TRIAGE_QUEUE_UPDATED", {"queue": queue, "totalCount": len(queue)})

    async def broadcast_patient_verified(self, patient_id: str, verification_data: dict):
        """Broadcasts doctor sign-off event."""
        await self.broadcast("PATIENT_VERIFIED", {
            "patientId": patient_id,
            "verification": verification_data
        })

    async def broadcast_reverify_requested(self, patient_id: str, notes: str):
        """Broadcasts patient-initiated re-review request."""
        await self.broadcast("REVERIFY_REQUESTED", {
            "patientId": patient_id,
            "patientNotes": notes
        })

# Global singleton event bus
event_bus = EventBus()
