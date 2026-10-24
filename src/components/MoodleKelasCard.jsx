"use client";

import { useState } from "react";
import { GraduationCap, CheckCircle2, ExternalLink } from "lucide-react";

// Hubungkan kelas ini ke satu kursus Moodle; peserta yang didaftarkan otomatis masuk kursus itu.
export default function MoodleKelasCard({ kelasId, awal, moodleUrl }) {
  const [tersimpan, setTersimpan] = useState(awal ?? null);
  const [nilai, setNilai] = useState(awal ?? "");
  const [pesan, setPesan] = useState(null);
  const [loading, setLoading] = useState(false);
  const berubah = String(nilai) !== String(tersimpan ?? "");

  async function simpan() {
    setLoading(true); setPesan(null);
    const id = nilai === "" ? null : Number(nilai);
    const res = await fetch(`/api/kelas/${kelasId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodleCourseId: id }) });
    setLoading(false);
    if (!res.ok) return setPesan({ ok: false, teks: "Gagal menyimpan." });
    setTersimpan(id);
    setPesan({ ok: true, teks: id === null ? "Koneksi ke Moodle dilepas." : "Tersimpan. Peserta baru otomatis masuk kursus ini." });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><GraduationCap className="h-4 w-4" /></span>
        <h3 className="font-serif text-base font-semibold text-navy">Kursus Moodle</h3>
        {tersimpan && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Terhubung</span>}
      </div>
      <p className="mt-2 text-xs text-slate-500">Isi ID kursus (angka <code className="rounded bg-slate-100 px-1">id=</code> di alamat kursus Moodle). Peserta yang didaftarkan ke kelas ini otomatis masuk kursus tersebut.</p>
      <div className="mt-3 flex gap-2">
        <input type="number" min="1" value={nilai} onChange={(e) => setNilai(e.target.value)} onKeyDown={(e) => e.key === "Enter" && berubah && simpan()} placeholder="mis. 2"
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-navy/10" />
        <button onClick={simpan} disabled={!berubah || loading} className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-[#223357] disabled:cursor-not-allowed disabled:opacity-40">{loading ? "Menyimpan..." : "Simpan"}</button>
      </div>
      {pesan && <p className={`mt-2 text-xs ${pesan.ok ? "text-emerald-700" : "text-rose-600"}`}>{pesan.teks}</p>}
      {tersimpan && moodleUrl && <a href={`${moodleUrl}/course/view.php?id=${tersimpan}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline">Buka kursus di Moodle <ExternalLink className="h-3.5 w-3.5" /></a>}
    </section>
  );
}
