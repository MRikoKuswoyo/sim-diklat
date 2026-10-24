// Pembatas percobaan sederhana (di memori server). Cukup untuk satu server; hilang saat server restart.
const store = new Map(); // key -> { hitung, reset }

function ambil(key) {
  const e = store.get(key);
  if (e && e.reset > Date.now()) return e;
  store.delete(key);
  return null;
}

/** Sudah mencapai batas? Mengembalikan { diblokir, sisaDetik }. */
export function terblokir(key, max) {
  const e = ambil(key);
  return { diblokir: !!e && e.hitung >= max, sisaDetik: e ? Math.ceil((e.reset - Date.now()) / 1000) : 0 };
}

/** Catat satu percobaan; jendela waktu mulai dari percobaan pertama. */
export function catat(key, windowMs) {
  const e = ambil(key);
  if (e) e.hitung += 1;
  else store.set(key, { hitung: 1, reset: Date.now() + windowMs });
  if (store.size > 5000) for (const [k, v] of store) if (v.reset <= Date.now()) store.delete(k); // bersih-bersih
}

export const reset = (key) => store.delete(key);

export const ipDari = (request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "lokal";
