"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PengumumanManager({ list }) {
  const router = useRouter();
  const [form, setForm] = useState({ judul: "", isi: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/pengumuman", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (!res.ok) return setError((await res.json().catch(() => null))?.error || "Gagal menyimpan.");
    setForm({ judul: "", isi: "" });
    router.refresh();
  }
  async function hapus(id) {
    if (!confirm("Hapus pengumuman ini?")) return;
    await fetch(`/api/pengumuman?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-semibold text-navy">Pengumuman</h1>
      <p className="mb-6 text-sm text-slate-500">Pengumuman terbaru tampil di kartu LIVE UPDATES pada Portal Peserta.</p>

      <form onSubmit={kirim} className="mb-8 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Judul pengumuman"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <textarea value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} placeholder="Isi pengumuman" rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={loading} className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Menyimpan..." : "Terbitkan"}
        </button>
      </form>

      <div className="space-y-3">
        {list.length === 0 && <p className="text-sm text-slate-400">Belum ada pengumuman.</p>}
        {list.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="font-medium text-navy">{p.judul}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{p.isi}</p>
              <p className="mt-2 text-xs text-slate-400">{new Date(p.createdAt).toLocaleString("id-ID")}</p>
            </div>
            <button onClick={() => hapus(p.id)} className="text-xs text-rose-600 underline">Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}
