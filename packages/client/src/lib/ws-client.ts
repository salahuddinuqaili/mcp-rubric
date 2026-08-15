import { REQUEST_TIMEOUT_MS, WS_PATH } from "mcp-studio-shared";
import type { WsEvent, WsRequest, WsResponse } from "mcp-studio-shared";

type EventHandler = (event: WsEvent) => void;

interface PendingRequest {
  resolve: (response: WsResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let idCounter = 0;
function generateId(): string {
  return `${Date.now()}-${++idCounter}`;
}

class WsClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private listeners = new Map<string, Set<EventHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;

  constructor() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}${WS_PATH}`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as WsResponse | WsEvent;

      if ("id" in message && message.id) {
        const pending = this.pending.get(message.id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pending.delete(message.id);
          if ((message as WsResponse).error) {
            pending.reject(new Error((message as WsResponse).error));
          } else {
            pending.resolve(message as WsResponse);
          }
        }
      } else {
        this.dispatchEvent(message as WsEvent);
      }
    };

    this.ws.onclose = () => {
      this.rejectAll("WebSocket closed");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.rejectAll("Client disconnected");
  }

  request<T = unknown>(type: string, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const id = generateId();

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timed out: ${type}`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: (response) => resolve(response.payload as T),
        reject,
        timer,
      });

      const request: WsRequest = { id, type, payload };
      this.ws.send(JSON.stringify(request));
    });
  }

  on(eventType: string, handler: EventHandler): () => void {
    let handlers = this.listeners.get(eventType);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(eventType, handlers);
    }
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  private dispatchEvent(event: WsEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  private rejectAll(reason: string): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
      this.pending.delete(id);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }
}

export const wsClient = new WsClient();
