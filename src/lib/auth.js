// Helper session JWT — dipakai di API routes (Node runtime) dan middleware (Edge runtime).
// jose dipilih karena kompatibel dengan Edge runtime Next.js.
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();
const SECRET_LEMAH = ["dev-secret-change-me", "ganti-dengan-string-acak-panjang", "changeme", "secret"];
let sudahPeringatan = false;

function getSecret() {
  const s = process.env.JWT_SECRET || "";
  if (s.length < 32 || SECRET_LEMAH.includes(s)) {
    // Production: TOLAK (login tidak boleh berjalan dengan kunci yang bisa ditebak). Development: hanya peringatan.
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET belum diatur dengan aman. Isi .env dengan teks acak minimal 32 karakter.");
    }
    if (!sudahPeringatan) {
      sudahPeringatan = true;
      console.warn("[KEAMANAN] JWT_SECRET lemah/belum diganti. Buat yang baru: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
    }
  }
  return encoder.encode(s || "dev-secret-change-me");
}

export const SESSION_COOKIE = "session";

// payload: { sub, email, nama, role, pesertaId }
export async function createSessionToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}
