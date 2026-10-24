"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, MoreHorizontal } from "lucide-react";
import Modal from "@/components/crud/Modal";

const tgl = (d) => new Date(d).toISOString().slice(0, 10);

// Tombol "Edit Kelas" (modal) dan menu "..." (hapus kelas) di header detail kelas.
export default function KelasHeaderActions({ kelas }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    namaBatch: kelas.namaBatch,
    tanggalMulai: tgl(kelas.tanggalMulai),
    tanggalSelesai: tgl(kelas.tanggalSelesai),
    lokasiAtauLink: kelas.lokasiAtauLink,
    kuota: kelas.kuota,
    status: kelas.status,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function simpan(e) {
    e.preventDefault();
    setError("");
    if (form.tanggalSelesai < form.tanggalMulai) return setError("Tanggal selesai tidak boleh sebelum tanggal mulai.");
    if (Number(form.kuota) < kelas.peserta.length) return setError(`Kuota tidak boleh kurang dari jumlah peserta (${kelas.peserta.length}).`);
    setLoading(true);
    try {
      const res = await fetch(`/api/kelas/${kelas.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kuota: Number(form.kuota) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Gagal menyimpan (HTTP ${res.status}).`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function hapus() {
    setMenu(false);
    if (!confirm(`Hapus kelas "${kelas.namaBatch}" beserta data pendaftaran pesertanya? Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/kelas/${kelas.id}`, { method: "DELETE" });
    if (!res.ok) return alert("Gagal menghapus kelas.");
    router.push("/kelas");
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => { setError(""); setOpen(true); }}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <Pencil className="h-4 w-4" /> Edit Kelas
      </button>
      <div className="relative">
        <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Menu lainnya"
          className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-500 hover:bg-slate-50">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menu && (
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
            <a href={`/api/kelas/${kelas.id}/laporan`} onClick={() => setMenu(false)} className="block px-3 py-2 text-slate-700 hover:bg-slate-50">Unduh laporan (Excel)</a>
            <button type="button" onClick={hapus} className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-slate-50">Hapus kelas</button>
          </div>
        )}
      </div>

      {open && (
        <Modal title="Edit Kelas" onClose={() => setOpen(false)}>
          <form onSubmit={simpan} className="space-y-3">
            <Field label="Nama Batch"><input required className="input" value={form.namaBatch} onChange={set("namaBatch")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal Mulai"><input required type="date" className="input" value={form.tanggalMulai} onChange={set("tanggalMulai")} /></Field>
              <Field label="Tanggal Selesai"><input required type="date" className="input" value={form.tanggalSelesai} onChange={set("tanggalSelesai")} /></Field>
            </div>
            <Field label="Lokasi / Link"><input required className="input" value={form.lokasiAtauLink} onChange={set("lokasiAtauLink")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kuota"><input required type="number" min="1" className="input" value={form.kuota} onChange={set("kuota")} /></Field>
              <Field label="Status">
                <select className="input" value={form.status} onChange={set("status")}>
                  <option value="PERSIAPAN">Persiapan</option>
                  <option value="BERJALAN">Berjalan</option>
                  <option value="SELESAI">Selesai</option>
                </select>
              </Field>
            </div>
            {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Batal</button>
              <button disabled={loading} className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }) {
  return <div><label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>{children}</div>;
}
