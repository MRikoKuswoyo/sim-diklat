// Ambil kode absen (6 karakter) dari isi QR. Menerima alamat penuh ".../absen/K7M2QX" atau kode polos.
export function kodeDariQr(teks) {
  const t = String(teks || "").trim();
  if (/^[A-Za-z0-9]{6}$/.test(t)) return t.toUpperCase();
  try {
    const m = new URL(t).pathname.match(/\/absen\/([A-Za-z0-9]{6})\/?$/);
    return m ? m[1].toUpperCase() : null;
  } catch {
    return null;
  }
}
