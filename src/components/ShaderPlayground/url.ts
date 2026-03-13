/**
 * Compress & encode shader state into a URL-safe string, and decode it back.
 * Uses CompressionStream('deflate') + base64url when available, falls back to btoa.
 */

type ShaderUrlState = {
  code: string;
  speed: number;
  uniforms: Record<string, number[]>;
};

/** Convert Uint8Array to base64url (no padding) */
function toBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Convert base64url back to Uint8Array */
function fromBase64url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function compress(data: string): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    return new TextEncoder().encode(data);
  }
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function decompress(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    return new TextDecoder().decode(bytes);
  }
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"));
  return new Response(stream).text();
}

export async function encodeShaderUrl(
  code: string,
  speed: number,
  uniforms: Record<string, number[]>,
): Promise<string> {
  const payload: ShaderUrlState = { code, speed, uniforms };
  const json = JSON.stringify(payload);
  const compressed = await compress(json);
  return toBase64url(compressed);
}

export async function decodeShaderUrl(
  encoded: string,
): Promise<ShaderUrlState | null> {
  try {
    const bytes = fromBase64url(encoded);
    const json = await decompress(bytes);
    const parsed = JSON.parse(json);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.code === "string"
    ) {
      return {
        code: parsed.code,
        speed: typeof parsed.speed === "number" ? parsed.speed : 1,
        uniforms:
          typeof parsed.uniforms === "object" && parsed.uniforms !== null
            ? parsed.uniforms
            : {},
      };
    }
    return null;
  } catch {
    return null;
  }
}
