import { afterEach, describe, expect, it } from "vitest";

import SignalingServer from "./signalingServer.js";

function fakeSocket() {
  return {
    readyState: 1,
    sent: [],
    send(payload) {
      this.sent.push(JSON.parse(payload));
    }
  };
}

describe("SignalingServer", () => {
  let server;

  afterEach(() => {
    if (server?.heartbeatInterval) {
      clearInterval(server.heartbeatInterval);
    }
    server?.wss?.close();
  });

  it("does not count the same socket twice or relay into a room it has not joined", () => {
    server = new SignalingServer({ maxRooms: 2 });
    const host = fakeSocket();
    const outsider = fakeSocket();

    server.handleJoin(host, "ROOM", "host-client");
    server.handleJoin(host, "ROOM", "host-client");

    expect(server.getStats()).toEqual({ totalRooms: 1, totalClients: 1 });

    server.handleOffer(outsider, "ROOM", { type: "offer" });
    expect(host.sent.some((message) => message.type === "offer")).toBe(false);
    expect(outsider.sent.at(-1)).toMatchObject({ type: "error", message: "Not in room" });
  });

  it("rejects a third client and does not attach them to the full room", () => {
    server = new SignalingServer();
    const host = fakeSocket();
    const guest = fakeSocket();
    const extra = fakeSocket();

    server.handleJoin(host, "ROOM", "host-client");
    server.handleJoin(guest, "ROOM", "guest-client");
    server.handleJoin(extra, "ROOM", "extra-client");

    expect(server.getStats().totalClients).toBe(2);
    expect(extra.roomId).toBeUndefined();
    expect(extra.sent.at(-1)).toMatchObject({ type: "error", message: "Room is full" });
  });

  it("removes a socket from its previous room when it joins another", () => {
    server = new SignalingServer();
    const host = fakeSocket();

    server.handleJoin(host, "ONE", "host-client");
    server.handleJoin(host, "TWO", "host-client");

    expect(server.rooms.has("ONE")).toBe(false);
    expect(server.getStats()).toEqual({ totalRooms: 1, totalClients: 1 });
    expect(host.roomId).toBe("TWO");
  });

  it("stops creating rooms at the configured cap", () => {
    server = new SignalingServer({ maxRooms: 1 });
    const first = fakeSocket();
    const second = fakeSocket();

    server.handleJoin(first, "ONE", "client-one");
    server.handleJoin(second, "TWO", "client-two");

    expect(server.rooms.has("TWO")).toBe(false);
    expect(second.sent.at(-1)).toMatchObject({
      type: "error",
      message: "Server is at room capacity"
    });
  });

  it("does not move a client into a full room", () => {
    server = new SignalingServer();
    const host = fakeSocket();
    const guest = fakeSocket();
    const mover = fakeSocket();

    server.handleJoin(host, "FULL", "host-client");
    server.handleJoin(guest, "FULL", "guest-client");
    server.handleJoin(mover, "OPEN", "mover-client");
    server.handleJoin(mover, "FULL", "mover-client");

    expect(mover.roomId).toBe("OPEN");
    expect(server.getStats()).toEqual({ totalRooms: 2, totalClients: 3 });
    expect(mover.sent.at(-1)).toMatchObject({ type: "error", message: "Room is full" });
  });

  it("keeps a client in their current room when another room cannot be created", () => {
    server = new SignalingServer({ maxRooms: 1 });
    const host = fakeSocket();
    const other = fakeSocket();

    server.handleJoin(host, "ONE", "client-one");
    server.handleJoin(other, "ONE", "client-two");
    server.handleJoin(other, "TWO", "client-two");

    expect(other.roomId).toBe("ONE");
    expect(server.getStats().totalClients).toBe(2);
    expect(other.sent.at(-1)).toMatchObject({
      type: "error",
      message: "Server is at room capacity"
    });
  });
});
