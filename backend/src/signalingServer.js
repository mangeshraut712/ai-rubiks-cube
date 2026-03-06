/**
 * WebRTC Signaling Server
 * 2026: WebSocket-based signaling for peer-to-peer connections
 */
import { WebSocketServer } from "ws";

class SignalingServer {
  constructor() {
    this.wss = new WebSocketServer({
      noServer: true,
      perMessageDeflate: false
    });

    this.rooms = new Map(); // roomId -> { clients: [], host: null }

    this.wss.on("connection", (ws, req) => {
      console.log(`[Signaling] New connection from ${req.socket.remoteAddress}`);

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
        console.error("[Signaling] Invalid message:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid message format"
          }),
          { compress: false }
        );
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        console.error("[Signaling] WebSocket error:", error);
      });
    });

    console.log("[Signaling] Server initialized");
  }

  handleUpgrade(request, socket, head) {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit("connection", ws, request);
    });
  }

  /**
   * Handle incoming messages
   */
  handleMessage(ws, message) {
    const { type, roomId, clientId } = message;

    switch (type) {
      case "join":
        this.handleJoin(ws, roomId, clientId);
        break;

      case "offer":
        this.handleOffer(ws, roomId, message.offer);
        break;

      case "answer":
        this.handleAnswer(ws, roomId, message.answer);
        break;

      case "ice-candidate":
        this.handleIceCandidate(ws, roomId, message.candidate);
        break;

      case "leave":
        this.handleLeave(ws, roomId);
        break;

      default:
        console.warn("[Signaling] Unknown message type:", type);
    }
  }

  /**
   * Handle client joining a room
   */
  handleJoin(ws, roomId, clientId) {
    ws.clientId = clientId;
    ws.roomId = roomId;

    // Create room if doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        clients: [],
        host: null
      });
    }

    const room = this.rooms.get(roomId);

    // Check if room is full
    if (room.clients.length >= 2) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Room is full"
        })
      );
      return;
    }

    // Add client to room
    room.clients.push(ws);

    // First client becomes host
    if (room.clients.length === 1) {
      room.host = ws;
      ws.isHost = true;
    }

    console.log(`[Signaling] Client ${clientId} joined room ${roomId} (${room.clients.length}/2)`);

    // Notify client
    ws.send(
      JSON.stringify({
        type: "joined",
        roomId,
        isHost: ws.isHost || false,
        clientCount: room.clients.length
      }),
      { compress: false }
    );

    // Notify other clients
    this.broadcastToRoom(
      roomId,
      {
        type: "peer-joined",
        clientId,
        clientCount: room.clients.length
      },
      ws
    );
  }

  /**
   * Handle WebRTC offer
   */
  handleOffer(ws, roomId, offer) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Forward offer to other clients
    this.broadcastToRoom(
      roomId,
      {
        type: "offer",
        offer,
        from: ws.clientId
      },
      ws
    );
  }

  /**
   * Handle WebRTC answer
   */
  handleAnswer(ws, roomId, answer) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Forward answer to other clients
    this.broadcastToRoom(
      roomId,
      {
        type: "answer",
        answer,
        from: ws.clientId
      },
      ws
    );
  }

  /**
   * Handle ICE candidate
   */
  handleIceCandidate(ws, roomId, candidate) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Forward ICE candidate to other clients
    this.broadcastToRoom(
      roomId,
      {
        type: "ice-candidate",
        candidate,
        from: ws.clientId
      },
      ws
    );
  }

  /**
   * Handle client leaving
   */
  handleLeave(ws, roomId) {
    this.removeClientFromRoom(ws, roomId);
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(ws) {
    if (ws.roomId) {
      this.removeClientFromRoom(ws, ws.roomId);
    }
  }

  /**
   * Remove client from room
   */
  removeClientFromRoom(ws, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const index = room.clients.indexOf(ws);
    if (index > -1) {
      room.clients.splice(index, 1);

      // If host left, assign new host
      if (ws === room.host && room.clients.length > 0) {
        room.host = room.clients[0];
        room.host.isHost = true;
      }

      console.log(
        `[Signaling] Client ${ws.clientId} left room ${roomId} (${room.clients.length}/2)`
      );

      // Notify other clients
      this.broadcastToRoom(roomId, {
        type: "peer-left",
        clientId: ws.clientId,
        clientCount: room.clients.length
      });

      // Clean up empty rooms
      if (room.clients.length === 0) {
        this.rooms.delete(roomId);
        console.log(`[Signaling] Room ${roomId} deleted`);
      }
    }
  }

  /**
   * Broadcast message to all clients in room (except sender)
   */
  broadcastToRoom(roomId, message, excludeWs = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = JSON.stringify(message);

    room.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === 1) {
        client.send(data, { compress: false });
      }
    });
  }

  /**
   * Get room statistics
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalClients: Array.from(this.rooms.values()).reduce(
        (sum, room) => sum + room.clients.length,
        0
      )
    };
  }
}

export default SignalingServer;
