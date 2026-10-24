"use client";
import { useState } from "react";

export default function MoodleCourseField({ kelasId, initial }) {
  const [val, setVal] = useState(initial ?? "");
  const [msg, setMsg] = useState("");
  async function simpan() {
    const id = val === "" ? null : Number(val);
    const res = await fetch(`/api/kelas/${kelasId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodleCourseId: id }) });
    setMsg(res.ok ? "Tersimpan." : "Gagal menyimpan.");
  }
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3 text-sm sm:px-8">
      <label className="font-medium text-navy">ID kursus Moodle</label>
      <input type="number" value={val} onChange={(e) => setVal(e.target.value)} placeholder="mis. 2"
        className="w-24 rounded-md border border-slate-300 px-2 py-1" />
      <button onClick={simpan} className="rounded-md bg-navy px-3 py-1 text-white">Simpan</button>
      <span className="text-xs text-slate-500">{msg || "Peserta yang didaftarkan ke kelas ini otomatis masuk kursus tersebut. Lihat ID di URL kursus: .../course/view.php?id=2"}</span>
    </div>
  );
}
