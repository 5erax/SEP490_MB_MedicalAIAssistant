import { decodeJwtPayload, isExpiredToken } from "@/src/utils/jwt";

function token(payload: Record<string, unknown>) {
  const encoded = globalThis.btoa(JSON.stringify(payload)).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
  return `header.${encoded}.signature`;
}

describe("JWT session expiry", () => {
  it("detects expired and active access tokens", () => {
    expect(isExpiredToken(token({ exp: Math.floor(Date.now() / 1000) - 60 }))).toBe(true);
    expect(isExpiredToken(token({ exp: Math.floor(Date.now() / 1000) + 60 }))).toBe(false);
  });

  it("fails closed when a payload cannot be decoded", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });
});
