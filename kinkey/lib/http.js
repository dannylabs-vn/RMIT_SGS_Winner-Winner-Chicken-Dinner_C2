export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "Vary": "Authorization" } });
}

export function endpoint(handler) {
  return async (req) => {
    try { return await handler(req); }
    catch (error) {
      // Never echo request data, filesystem paths or SDK errors.
      return json({ error: error instanceof ApiError ? error.message : "The vault is unavailable. Try again or contact the owner." },
        error instanceof ApiError ? error.status : 503);
    }
  };
}

export async function readJson(req, limit = 350000) {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new ApiError(415, "Send application/json.");
  }
  if (Number(req.headers.get("content-length")) > limit) throw new ApiError(413, "Request is too large.");
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, "Send a JSON object.");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new ApiError(413, "Request is too large.");
      }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Send a valid JSON object.");
  } finally { reader.releaseLock(); }
}

export function fields(body, allowed) {
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw new ApiError(400, "Unexpected request field.");
}

export function ciphertextBody(body) {
  fields(body, ["compartment", "ciphertext"]);
  if (!["medical", "finance"].includes(body.compartment) || typeof body.ciphertext !== "string" ||
      !body.ciphertext.trim() || Buffer.byteLength(body.ciphertext) > 262144) {
    throw new ApiError(400, "Send a valid compartment and nonempty ciphertext (at most 256 KiB).");
  }
  // An arbitrary string cannot be proven encrypted by this server. Clients must
  // use doEncrypt; do not invent a Tide ciphertext format check.
  return body;
}
