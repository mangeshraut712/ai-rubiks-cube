import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";

import { encodeBinaryEnvelope } from "./webrtcHelpers.js";

// Mirrors decodeBinaryEnvelope in backend/src/server.js, the consumer of this frame.
function decodeLikeBackend(arrayBuffer) {
  const buffer = Buffer.from(arrayBuffer);
  const headerLength = buffer.readUInt32BE(0);
  const headerEnd = 4 + headerLength;
  return {
    headerLength,
    header: JSON.parse(buffer.subarray(4, headerEnd).toString("utf8")),
    payload: Array.from(buffer.subarray(headerEnd))
  };
}

describe("encodeBinaryEnvelope", () => {
  it("frames [big-endian header length][header JSON][payload] with no extra bytes", () => {
    const payload = new Uint8Array([1, 2, 3, 250]);

    const buffer = encodeBinaryEnvelope({ type: "audio_chunk" }, payload);

    const decoded = decodeLikeBackend(buffer);
    expect(decoded.header).toEqual({ type: "audio_chunk" });
    expect(decoded.payload).toEqual([1, 2, 3, 250]);
    expect(buffer.byteLength).toBe(4 + decoded.headerLength + payload.byteLength);
  });

  it("records the UTF-8 byte length of the header, not the string length", () => {
    const header = { type: "user_text", text: "héllo → cubey" };
    const serialized = JSON.stringify(header);
    const utf8ByteLength = new TextEncoder().encode(serialized).byteLength;
    expect(utf8ByteLength).toBeGreaterThan(serialized.length);

    const buffer = encodeBinaryEnvelope(header, new Uint8Array([9]));

    const decoded = decodeLikeBackend(buffer);
    expect(decoded.headerLength).toBe(utf8ByteLength);
    expect(decoded.header).toEqual(header);
    expect(decoded.payload).toEqual([9]);
  });
});
