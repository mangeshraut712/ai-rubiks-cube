/**
 * WebRTC Multiplayer Hook
 * 2026: Peer-to-peer multiplayer challenge mode
 */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

// WebRTC configuration
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
    // Add TURN servers for production
    // {
    //   urls: "turn:turn.yourserver.com:3478",
    //   username: "user",
    //   credential: "pass"
    // }
  ]
};

const SIGNALING_SERVER = process.env.VITE_SIGNALING_SERVER || "ws://localhost:8081";

export function useMultiplayer() {
  const [connectionState, setConnectionState] = useState("idle"); // idle, connecting, connected, disconnected, error
  const [peerState, setPeerState] = useState(null);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(0);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const signalingSocketRef = useRef(null);
  const roomIdRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const localIdRef = useRef(uuidv4());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  /**
   * Connect to signaling server and join room
   */
  const connect = useCallback(
    async (roomId) => {
      try {
        setConnectionState("connecting");
        setError(null);
        roomIdRef.current = roomId;

        // Connect to signaling server
        const ws = new WebSocket(`${SIGNALING_SERVER}/multiplayer`);
        signalingSocketRef.current = ws;

        return new Promise((resolve, reject) => {
          ws.onopen = () => {
            console.log("[Multiplayer] Connected to signaling server");

            // Join room
            ws.send(
              JSON.stringify({
                type: "join",
                roomId,
                clientId: localIdRef.current
              })
            );
          };

          ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            await handleSignalingMessage(message);

            if (message.type === "joined" || message.type === "peer-joined") {
              resolve(true);
            }
          };

          ws.onerror = (error) => {
            console.error("[Multiplayer] Signaling error:", error);
            setError("Failed to connect to signaling server");
            setConnectionState("error");
            reject(error);
          };

          ws.onclose = () => {
            console.log("[Multiplayer] Signaling connection closed");
            if (connectionState !== "disconnected") {
              setConnectionState("disconnected");
            }
          };

          // Timeout after 10 seconds
          setTimeout(() => {
            if (connectionState === "connecting") {
              reject(new Error("Connection timeout"));
            }
          }, 10000);
        });
      } catch (error) {
        console.error("[Multiplayer] Connection failed:", error);
        setError(error.message);
        setConnectionState("error");
        throw error;
      }
    },
    [connectionState]
  );

  /**
   * Handle signaling messages
   */
  const handleSignalingMessage = useCallback(async (message) => {
    switch (message.type) {
      case "joined":
        console.log("[Multiplayer] Joined room:", message.roomId);
        if (message.isHost) {
          await createPeerConnection(true);
        }
        break;

      case "peer-joined":
        console.log("[Multiplayer] Peer joined");
        if (!peerConnectionRef.current) {
          await createPeerConnection(false);
        }
        break;

      case "offer":
        await handleOffer(message.offer);
        break;

      case "answer":
        await handleAnswer(message.answer);
        break;

      case "ice-candidate":
        await handleIceCandidate(message.candidate);
        break;

      case "peer-left":
        console.log("[Multiplayer] Peer left");
        disconnect();
        break;

      default:
        console.warn("[Multiplayer] Unknown message type:", message.type);
    }
  }, []);

  /**
   * Create WebRTC peer connection
   */
  const createPeerConnection = useCallback(async (isHost) => {
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signalingSocketRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
              roomId: roomIdRef.current
            })
          );
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log("[Multiplayer] Connection state:", pc.connectionState);
        setConnectionState(pc.connectionState);
      };

      // Handle data channel (for host)
      if (isHost) {
        const dataChannel = pc.createDataChannel("gameData", {
          ordered: true,
          maxRetransmits: 3
        });
        setupDataChannel(dataChannel);
      } else {
        // Handle incoming data channel (for client)
        pc.ondatachannel = (event) => {
          setupDataChannel(event.channel);
        };
      }

      // Create offer if host
      if (isHost) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        signalingSocketRef.current.send(
          JSON.stringify({
            type: "offer",
            offer,
            roomId: roomIdRef.current
          })
        );
      }

      return pc;
    } catch (error) {
      console.error("[Multiplayer] Failed to create peer connection:", error);
      setError("Failed to create peer connection");
      setConnectionState("error");
      throw error;
    }
  }, []);

  /**
   * Setup data channel
   */
  const setupDataChannel = useCallback((dataChannel) => {
    dataChannelRef.current = dataChannel;

    dataChannel.onopen = () => {
      console.log("[Multiplayer] Data channel opened");
      setConnectionState("connected");
      startPingInterval();
    };

    dataChannel.onclose = () => {
      console.log("[Multiplayer] Data channel closed");
      stopPingInterval();
    };

    dataChannel.onerror = (error) => {
      console.error("[Multiplayer] Data channel error:", error);
      setError("Data channel error");
    };

    dataChannel.onmessage = (event) => {
      handleDataMessage(JSON.parse(event.data));
    };
  }, []);

  /**
   * Handle incoming data messages
   */
  const handleDataMessage = useCallback((data) => {
    switch (data.type) {
      case "game-state":
        setPeerState(data.state);
        break;

      case "ping":
        sendData({ type: "pong", timestamp: data.timestamp });
        break;

      case "pong":
        {
          const rtt = Date.now() - data.timestamp;
          setLatency(rtt / 2);
        }
        break;

      case "move":
        // Handle peer move
        console.log("[Multiplayer] Peer move:", data.move);
        break;

      case "win":
        console.log("[Multiplayer] Peer won!");
        break;

      default:
        console.warn("[Multiplayer] Unknown data type:", data.type);
    }
  }, []);

  /**
   * Send data to peer
   */
  const sendData = useCallback((data) => {
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  /**
   * Send game state to peer
   */
  const sendGameState = useCallback(
    (state) => {
      return sendData({ type: "game-state", state });
    },
    [sendData]
  );

  /**
   * Send move to peer
   */
  const sendMove = useCallback(
    (move) => {
      return sendData({ type: "move", move, timestamp: Date.now() });
    },
    [sendData]
  );

  /**
   * Send win notification
   */
  const sendWin = useCallback(() => {
    return sendData({ type: "win", timestamp: Date.now() });
  }, [sendData]);

  /**
   * Handle WebRTC offer
   */
  const handleOffer = useCallback(async (offer) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signalingSocketRef.current.send(
      JSON.stringify({
        type: "answer",
        answer,
        roomId: roomIdRef.current
      })
    );
  }, []);

  /**
   * Handle WebRTC answer
   */
  const handleAnswer = useCallback(async (answer) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  /**
   * Handle ICE candidate
   */
  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  /**
   * Start ping interval for latency measurement
   */
  const startPingInterval = useCallback(() => {
    pingIntervalRef.current = setInterval(() => {
      sendData({ type: "ping", timestamp: Date.now() });
    }, 1000);
  }, [sendData]);

  /**
   * Stop ping interval
   */
  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  /**
   * Disconnect from multiplayer session
   */
  const disconnect = useCallback(() => {
    stopPingInterval();

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (signalingSocketRef.current) {
      signalingSocketRef.current.close();
      signalingSocketRef.current = null;
    }

    setConnectionState("disconnected");
    setPeerState(null);
    setLatency(0);
    roomIdRef.current = null;
  }, [stopPingInterval]);

  return {
    connectionState,
    peerState,
    error,
    latency,
    connect,
    disconnect,
    sendGameState,
    sendMove,
    sendWin,
    isConnected: connectionState === "connected",
    localId: localIdRef.current
  };
}

export default useMultiplayer;
