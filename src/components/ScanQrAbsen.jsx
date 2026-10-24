"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { ScanLine, X, Camera, CheckCircle2, XCircle, Loader2, Zap, ZapOff } from "lucide-react";
import { kodeDariQr } from "@/lib/qrKode";

const LEBAR_PINDAI = 640; // gambar diperkecil sebelum dibaca supaya cepat

function bacaQr(sumber, lebar, tinggi, coba = "dontInvert") {
  const skala = Math.min(1, LEBAR_PINDAI / Math.max(lebar, tinggi));
  const c = document.createElement("canvas");
  c.width = Math.round(lebar * skala); c.height = Math.round(tinggi * skala);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(sumber, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  return { teks: jsQR(img.data, c.width, c.height, { inversionAttempts: coba })?.data || null, kanvas: c };
}

// Bingkai bidik: latar digelapkan, empat sudut, garis pemindai bergerak
function Bidik({ ok, children }) {
  const sudut = `absolute h-9 w-9 transition-colors duration-200 ${ok ? "border-emerald-400" : "border-white"}`;
  return (
    <div className="absolute inset-[14%]">
      <style>{`@keyframes garis-pindai{0%,100%{top:4%}50%{top:94%}}@keyframes muncul{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_999px_rgba(0,0,0,0.55)]" />
      <span className={`${sudut} left-0 top-0 rounded-tl-2xl border-l-4 border-t-4`} />
      <span className={`${sudut} right-0 top-0 rounded-tr-2xl border-r-4 border-t-4`} />
      <span className={`${sudut} bottom-0 left-0 rounded-bl-2xl border-b-4 border-l-4`} />
      <span className={`${sudut} bottom-0 right-0 rounded-br-2xl border-b-4 border-r-4`} />
      {!ok && <span className="absolute left-3 right-3 h-0.5 rounded-full bg-sky-400 shadow-[0_0_14px_3px_rgba(56,189,248,0.9)]" style={{ animation: "garis-pindai 1.8s ease-in-out infinite" }} />}
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// Pemindai QR absen di dalam portal. Kamera langsung butuh HTTPS atau localhost;
// di alamat http biasa (mis. http://192.168.x.x) otomatis memakai "Ambil Foto QR".
export default function ScanQrAbsen() {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [buka, setBuka] = useState(false);
  const [mode, setMode] = useState("kamera"); // "kamera" | "foto"
  const [tahap, setTahap] = useState("pindai"); // "pindai" | "memeriksa" | "hasil"
  const [hasil, setHasil] = useState(null);
  const [info, setInfo] = useState("");
  const [ulang, setUlang] = useState(0);
  const [kameraBisa, setKameraBisa] = useState(false);
  const [bingkai, setBingkai] = useState(null); // gambar terakhir saat QR terdeteksi
  const [siapKamera, setSiapKamera] = useState(false);
  const [senterBisa, setSenterBisa] = useState(false);
  const [senter, setSenter] = useState(false);

  function bukaPemindai() {
    const aman = window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
    setKameraBisa(aman);
    setMode(aman ? "kamera" : "foto");
    setInfo(aman ? "" : "Alamat http biasa tidak diizinkan browser memakai kamera langsung. Buka lewat HTTPS atau localhost agar QR terpindai otomatis. Untuk sementara, ambil foto QR.");
    setTahap("pindai"); setHasil(null); setBingkai(null); setUlang((n) => n + 1); setBuka(true);
  }
  const tutup = () => setBuka(false);

  async function kirim(isiQr, gambar = null) {
    setBingkai(gambar);
    const kode = kodeDariQr(isiQr);
    if (!kode) { setHasil({ ok: false, error: "QR ini bukan QR absen SIM Diklat." }); setTahap("hasil"); return; }
    navigator.vibrate?.(80); // getar singkat tanda QR terbaca
    setTahap("memeriksa");
    const tunggu = new Promise((r) => setTimeout(r, 900)); // beri waktu efek "memeriksa" terlihat
    let akhir;
    try {
      const [res] = await Promise.all([fetch("/api/portal/absen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kode }) }), tunggu]);
      const d = await res.json().catch(() => ({}));
      akhir = { ok: res.ok, ...d, error: d.error };
      if (res.ok) router.refresh();
    } catch {
      akhir = { ok: false, error: "Tidak bisa terhubung ke server." };
    }
    navigator.vibrate?.(akhir.ok ? [60, 40, 60] : 200);
    setHasil(akhir); setTahap("hasil");
  }

  // Kamera langsung: baca gambar ~8x per detik, otomatis berhenti begitu QR ditemukan
  useEffect(() => {
    if (!buka || mode !== "kamera" || tahap !== "pindai") return;
    let selesai = false, stream = null, timer = null;
    setSiapKamera(false); setSenter(false); setSenterBisa(false);
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        const v = videoRef.current;
        if (!v || selesai) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        v.srcObject = stream;
        await v.play();
        setSiapKamera(true);
        setSenterBisa(!!stream.getVideoTracks()[0]?.getCapabilities?.().torch);
        const loop = () => {
          if (selesai) return;
          if (v.readyState >= 2 && v.videoWidth) {
            const { teks, kanvas } = bacaQr(v, v.videoWidth, v.videoHeight);
            if (teks) { selesai = true; kirim(teks, kanvas.toDataURL("image/jpeg", 0.7)); return; }
          }
          timer = setTimeout(loop, 120);
        };
        loop();
      } catch (e) {
        const pesan = {
          NotAllowedError: "Kamera diblokir. Ketuk ikon gembok di bilah alamat → Izin → Kamera: Izinkan, lalu tekan Buka Kamera Lagi.",
          NotFoundError: "Kamera tidak ditemukan di perangkat ini.",
          NotReadableError: "Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu tekan Buka Kamera Lagi.",
        };
        setInfo(pesan[e?.name] || "Kamera tidak bisa dibuka. Tekan Buka Kamera Lagi, atau ambil foto QR.");
        setMode("foto");
      }
    })();
    return () => { selesai = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buka, mode, tahap, ulang]);

  useEffect(() => {
    if (!buka) return;
    const esc = (e) => e.key === "Escape" && tutup();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [buka]);

  async function toggleSenter() {
    try {
      await streamRef.current?.getVideoTracks()[0]?.applyConstraints({ advanced: [{ torch: !senter }] });
      setSenter(!senter);
    } catch {}
  }

  async function dariFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setTahap("memeriksa"); setBingkai(null);
    try {
      const bmp = await createImageBitmap(file);
      const { teks, kanvas } = bacaQr(bmp, bmp.width, bmp.height, "attemptBoth");
      if (!teks) { setHasil({ ok: false, error: "QR tidak terbaca. Pastikan seluruh QR masuk foto, jelas, dan tidak silau, lalu coba lagi." }); setTahap("hasil"); return; }
      await kirim(teks, kanvas.toDataURL("image/jpeg", 0.7));
    } catch {
      setHasil({ ok: false, error: "Foto tidak bisa diproses. Coba lagi." }); setTahap("hasil");
    }
  }

  const pindaiLagi = () => { setHasil(null); setBingkai(null); setTahap("pindai"); setUlang((n) => n + 1); };
  const lihatBidik = tahap === "pindai" && mode === "kamera" || tahap === "memeriksa";

  return (
    <>
      <button type="button" onClick={bukaPemindai} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-sky-700/20 hover:bg-sky-800">
        <ScanLine className="h-5 w-5" /> Scan QR Absen
      </button>

      {buka && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Scan QR Absen">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-5 text-center shadow-2xl">
            <button onClick={tutup} aria-label="Tutup" className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            <h2 className="font-serif text-lg font-semibold text-navy">Scan QR Absen</h2>

            {lihatBidik && (
              <>
                <p className="mt-1 text-xs text-slate-500">
                  {tahap === "memeriksa" ? "QR terdeteksi, memeriksa kehadiran..." : siapKamera ? "Arahkan kamera ke QR di layar kelas. Terpindai otomatis." : "Membuka kamera..."}
                </p>
                <div className="relative mx-auto mt-4 aspect-square w-full overflow-hidden rounded-2xl bg-black">
                  {bingkai
                    ? <img src={bingkai} alt="" className="h-full w-full object-cover" />
                    : <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />}
                  {tahap === "pindai" && !siapKamera && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-white/80" /></div>}
                  <Bidik ok={tahap === "memeriksa"}>
                    {tahap === "memeriksa" && (
                      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/90 shadow-lg" style={{ animation: "muncul .25s ease-out" }}>
                        <Loader2 className="h-10 w-10 animate-spin text-white" />
                      </span>
                    )}
                  </Bidik>
                  {tahap === "pindai" && senterBisa && (
                    <button onClick={toggleSenter} aria-label="Senter" className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70">
                      {senter ? <Zap className="h-5 w-5 text-yellow-300" /> : <ZapOff className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                {tahap === "pindai" && <button onClick={() => { setInfo(""); setMode("foto"); }} className="mt-3 text-xs text-slate-500 underline">Kamera bermasalah? Ambil foto QR</button>}
              </>
            )}

            {tahap === "pindai" && mode === "foto" && (
              <div className="mt-3">
                {info && <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">{info}</p>}
                <p className="text-xs text-slate-500">Ambil foto QR di layar kelas, lalu absen dicatat otomatis.</p>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-medium text-white hover:bg-[#223357]">
                  <Camera className="h-5 w-5" /> Ambil Foto QR
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={dariFoto} />
                </label>
                {kameraBisa && (
                  <button onClick={() => { setInfo(""); setMode("kamera"); setUlang((n) => n + 1); }} className="mt-3 block w-full text-sm font-medium text-sky-700 underline">Buka Kamera Lagi</button>
                )}
              </div>
            )}

            {tahap === "hasil" && hasil && (
              <div className="py-6">
                <span className="mx-auto flex h-20 w-20 items-center justify-center" style={{ animation: "muncul .3s ease-out" }}>
                  {hasil.ok ? <CheckCircle2 className="h-20 w-20 text-emerald-500" /> : <XCircle className="h-20 w-20 text-rose-500" />}
                </span>
                <p className={`mt-3 font-serif text-lg font-semibold ${hasil.ok ? "text-emerald-700" : "text-rose-700"}`}>
                  {hasil.ok ? (hasil.sudah ? "Kamu sudah tercatat hadir" : "Absen berhasil") : "Absen gagal"}
                </p>
                {hasil.ok ? <p className="mt-1 text-sm text-slate-600">{hasil.judul}<span className="block text-xs text-slate-400">{hasil.jam} WIB</span></p> : <p className="mt-1 text-sm text-slate-600">{hasil.error}</p>}
                <div className="mt-5 flex justify-center gap-3">
                  {!hasil.ok && <button onClick={pindaiLagi} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Pindai Lagi</button>}
                  <button onClick={tutup} className="rounded-lg bg-navy px-5 py-2 text-sm font-medium text-white">Selesai</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
