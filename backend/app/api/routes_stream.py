import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse
from app.core.event_bus import event_bus

router = APIRouter()

# ------------------------------------------------------------------
# 1. WEBSOCKET ENDPOINT: /api/v1/stream/ws/triage
# ------------------------------------------------------------------
@router.websocket("/ws/triage")
async def websocket_triage_stream(websocket: WebSocket):
    """
    Bidirectional WebSocket connection for clinician command centers.
    Streams sub-50ms patient intake alerts, SINBAD >= 4 emergency triggers,
    and handles keep-alive ping/pong handshakes.
    """
    await event_bus.connect_ws(websocket)
    try:
        while True:
            # Await client keep-alive pings or terminal status messages
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                if msg.get("type") == "PING":
                    await websocket.send_json({
                        "type": "PONG",
                        "clientTimestamp": msg.get("timestamp"),
                        "serverTimestamp": asyncio.get_event_loop().time()
                    })
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await event_bus.disconnect_ws(websocket)
    except Exception as e:
        await event_bus.disconnect_ws(websocket)


# ------------------------------------------------------------------
# 2. SERVER-SENT EVENTS (SSE) ENDPOINT: /api/v1/stream/events/triage
# ------------------------------------------------------------------
@router.get("/events/triage")
async def sse_triage_stream(request: Request):
    """
    Unidirectional Server-Sent Events (SSE) fallback stream.
    Ideal for strict hospital firewall environments where WebSockets are blocked.
    """
    queue = await event_bus.register_sse()

    async def event_generator():
        try:
            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'SSE_CONNECTED', 'protocol': 'Server-Sent Events'})}\n\n"
            
            while True:
                # Disconnect if client has closed the HTTP connection
                if await request.is_disconnected():
                    break
                
                try:
                    # Wait for next event with a 20-second heartbeat timeout
                    message_str = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"data: {message_str}\n\n"
                except asyncio.TimeoutError:
                    # Send keep-alive heartbeat comment to prevent proxy timeouts
                    yield ": heartbeat keep-alive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await event_bus.unregister_sse(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Prevents Nginx response buffering
        }
    )
