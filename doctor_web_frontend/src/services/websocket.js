/**
 * Heal6 Resilient Real-Time Streaming Client
 * Implements full-duplex WebSocket with automatic exponential backoff reconnection
 * and seamless fallback to Server-Sent Events (SSE) for strict hospital firewall environments.
 */

const API_HOST = import.meta.env.VITE_API_HOST || '127.0.0.1:8000'
const WS_URL = `ws://${API_HOST}/api/v1/stream/ws/triage`
const SSE_URL = `http://${API_HOST}/api/v1/stream/events/triage`

class TriageStreamClient {
  constructor() {
    this.ws = null
    this.sse = null
    this.protocol = 'DISCONNECTED' // 'WS' | 'SSE' | 'DISCONNECTED'
    this.isConnected = false
    this.latencyMs = 0
    this.reconnectAttempts = 0
    this.maxReconnectDelay = 10000
    this.pingInterval = null
    this.lastPingTime = 0

    this.listeners = {
      intake: [],
      critical: [],
      verified: [],
      reverify: [],
      status: []
    }
  }

  connect() {
    this.initWebSocket()
  }

  initWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        this.isConnected = true
        this.protocol = 'WS'
        this.reconnectAttempts = 0
        this.notifyStatus()
        this.startHeartbeat()
        console.log('⚡ [Heal6 WS] Real-time triage stream connected via WebSocket.')
      }

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          this.handleIncomingMessage(payload)
        } catch (e) {
          console.warn('[Heal6 WS] Failed to parse event payload:', e)
        }
      }

      this.ws.onclose = () => {
        this.cleanupHeartbeat()
        this.isConnected = false
        this.protocol = 'DISCONNECTED'
        this.notifyStatus()
        this.scheduleReconnect()
      }

      this.ws.onerror = (err) => {
        console.warn('⚠️ [Heal6 WS] Connection error, will attempt reconnection or SSE fallback.')
        this.ws?.close()
      }
    } catch (err) {
      console.warn('⚠️ [Heal6 WS] WebSocket initialization failed, attempting fallback to SSE.', err)
      this.initSSE()
    }
  }

  initSSE() {
    if (this.sse) this.sse.close()

    try {
      this.sse = new EventSource(SSE_URL)

      this.sse.onopen = () => {
        this.isConnected = true
        this.protocol = 'SSE'
        this.notifyStatus()
        console.log('📡 [Heal6 SSE] Connected to triage stream via Server-Sent Events.')
      }

      this.sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          this.handleIncomingMessage(payload)
        } catch (e) {
          // Heartbeats or comments can be skipped
        }
      }

      this.sse.onerror = () => {
        this.isConnected = false
        this.protocol = 'DISCONNECTED'
        this.notifyStatus()
        setTimeout(() => this.initWebSocket(), 5000)
      }
    } catch (e) {
      console.error('[Heal6 SSE] Failed to initialize SSE fallback:', e)
    }
  }

  handleIncomingMessage(payload) {
    const { type, data } = payload

    if (type === 'PONG') {
      if (this.lastPingTime > 0) {
        this.latencyMs = Math.max(1, Math.round(performance.now() - this.lastPingTime))
        this.notifyStatus()
      }
      return
    }

    if (type === 'PATIENT_INTAKE_PROCESSED') {
      this.listeners.intake.forEach(fn => fn(data))
    } else if (type === 'CRITICAL_TRIAGE_ALERT') {
      this.listeners.critical.forEach(fn => fn(data))
    } else if (type === 'PATIENT_VERIFIED') {
      this.listeners.verified.forEach(fn => fn(data))
    } else if (type === 'REVERIFY_REQUESTED') {
      this.listeners.reverify.forEach(fn => fn(data))
    }
  }

  startHeartbeat() {
    this.cleanupHeartbeat()
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = performance.now()
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }))
      }
    }, 15000)
  }

  cleanupHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++
    if (this.reconnectAttempts > 3) {
      console.log('🔄 [Heal6 Stream] Reconnect threshold reached, testing SSE fallback.')
      this.initSSE()
      return
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay)
    setTimeout(() => {
      this.initWebSocket()
    }, delay)
  }

  notifyStatus() {
    this.listeners.status.forEach(fn => fn({
      isConnected: this.isConnected,
      protocol: this.protocol,
      latencyMs: this.latencyMs
    }))
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    }
    return () => {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(fn => fn !== callback)
      }
    }
  }

  disconnect() {
    this.cleanupHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this.sse) {
      this.sse.close()
      this.sse = null
    }
    this.isConnected = false
    this.protocol = 'DISCONNECTED'
  }
}

export const triageStream = new TriageStreamClient()
