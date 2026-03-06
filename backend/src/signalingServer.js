/**
 * WebRTC Signaling Server
 * 2026: WebSocket-based signaling for peer-to-peer connections
 */
import { WebSocketServer } from "ws";
import { z } from "zod";

const MAX_SIGNALING_MESSAGE_BYTES = 64 * 1024;
const RoomIdSchema = z.string().trim().min(4).max(16).regex(/^[A-Z0-9_-]+$/i);
const ClientIdSchema = z.string().trim().min(8).max(64).regex(/^[A-Z0-9_-]+$/i);
const JoinMessageSchema = z.object({
  type: z.literal("join"),
  roomId: RoomIdSchema,
  clientId: ClientIdSchema
});
const OfferMessageSchema = z.object({
  type: z.literal("offer"),
  roomId: RoomIdSchema,
  offer: z.unknown()
});
const AnswerMessageSchema = z.object({
  type: z.literal("answer"),
  roomId: RoomIdSchema,
  answer: z.unknown()
});
const IceCandidateMessageSchema = z.object({
  type: z.literal("ice-candidate"),
  roomId: RoomIdSchema,
  candidate: z.unknown()
});
const LeaveMessageSchema = z.object({
  type: z.literal("leave"),
  roomId: RoomIdSchema.optional()
});

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
          const raw = Buffer.isBuffer(data) ? data.toString("utf8") : String(data || "");
          if (Buffer.byteLength(raw, "utf8") > MAX_SIGNALING_MESSAGE_BYTES) {
            this.sendError(ws, "Message too large");
            ws.close(1009, "Message too large");
            return;
          }

          const message = JSON.parse(raw);
          const validated = this.validateMessage(ws, message);
          if (!validated) {
            this.sendError(ws, "Invalid signaling message");
            return;
          }

          this.handleMessage(ws, validated);
        } catch (error) {
          console.error("[Signaling] Invalid message:", error);
          this.sendError(ws, "Invalid message format");
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

  validateMessage(ws, message) {
    const type = typeof message?.type === "string" ? message.type : "";
    let parsed;

    switch (type) {
      case "join":
        parsed = JoinMessageSchema.safeParse(message);
        if (!parsed.success) {
          return null;
        }
        return {
          ...parsed.data,
          roomId: parsed.data.roomId.trim().toUpperCase(),
          clientId: parsed.data.clientId.trim()
        };

      case "offer":
        parsed = OfferMessageSchema.safeParse(message);
        return parsed.success ? { ...parsed.data, roomId: parsed.data.roomId.trim().toUpperCase() } : null;

      case "answer":
        parsed = AnswerMessageSchema.safeParse(message);
        return parsed.success ? { ...parsed.data, roomId: parsed.data.roomId.trim().toUpperCase() } : null;

      case "ice-candidate":
        parsed = IceCandidateMessageSchema.safeParse(message);
        return parsed.success ? { ...parsed.data, roomId: parsed.data.roomId.trim().toUpperCase() } : null;

      case "leave":
        parsed = LeaveMessageSchema.safeParse(message);
        return parsed.success
          ? {
              ...parsed.data,
              roomId: parsed.data.roomId ? parsed.data.roomId.trim().toUpperCase() : ws.roomId
            }
          : null;

      default:
        return null;
    }
  }

  sendError(ws, message) {
    if (ws.readyState !== 1) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "error",
        message
      }),
      { compress: false }
    );
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
