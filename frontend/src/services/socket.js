import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(room) {
    if (this.socket) {
      this.socket.emit('join-room', room);
    }
  }

  leaveRoom(room) {
    if (this.socket) {
      this.socket.emit('leave-room', room);
    }
  }

  onAttendanceUpdate(callback) {
    if (this.socket) {
      this.socket.on('attendance:update', callback);
    }
    return () => {
      if (this.socket) {
        this.socket.off('attendance:update', callback);
      }
    };
  }

  onDeviceStatus(callback) {
    if (this.socket) {
      this.socket.on('device:status', callback);
    }
    return () => {
      if (this.socket) {
        this.socket.off('device:status', callback);
      }
    };
  }

  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
    return () => {
      if (this.socket) {
        this.socket.off('notification', callback);
      }
    };
  }
}

export default new SocketService();
