import { ODOO_CONFIG } from '../config/odoo.config';

interface WebSocketMessage {
  channel: string;
  data: unknown;
}

type WebSocketCallback = (data: unknown) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, WebSocketCallback> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    const wsUrl = `ws://${ODOO_CONFIG.BASE_URL.replace(/^https?:\/\//, '')}${ODOO_CONFIG.ENDPOINTS.WEBSOCKET}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      // Send authentication token as first message
      this.socket?.send(JSON.stringify({
        action: 'authenticate',
        token: localStorage.getItem('token')
      }));
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const { channel, data } = message;
        const callback = this.listeners.get(channel);
        if (callback) {
          callback(data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, ODOO_CONFIG.WEBSOCKET_CONFIG.RECONNECT_INTERVAL);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribe(channel: string, callback: WebSocketCallback) {
    this.listeners.set(channel, callback);
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action: 'subscribe',
        channel
      }));
    }
  }

  unsubscribe(channel: string) {
    this.listeners.delete(channel);
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action: 'unsubscribe',
        channel
      }));
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const webSocketService = new WebSocketService();
