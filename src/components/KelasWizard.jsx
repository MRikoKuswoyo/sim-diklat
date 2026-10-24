"use client";

/**
 * KelasWizard.jsx — Form Wizard 4 langkah untuk membuat Kelas Diklat baru:
 *   1. Pilih Judul Diklat
 *   2. Atur Jadwal & Lokasi
 *   3. Tetapkan Narasumber (per Materi) & Panitia
 *   4. Tentukan Kuota + Review → Simpan
 *
 * Alur simpan: POST /api/kelas → dapat id → looping POST
 * /api/kelas/[id]/narasumber dan /api/kelas/[id]/panitia untuk tiap
 * penugasan yang dipilih di Langkah 3 → redirect ke /kelas/[id].
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["Judul Diklat", "Jadwal & Lokasi", "Narasumber & Panitia", "Kuota & Review"];

export default function KelasWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [diklatList, setDiklatList] = useState([]);
  const [narasumberList, setNarasumberList] = useState([]);
  const [panitiaList, setPanitiaList] = useState([]);
  const [materiList, setMateriList] = useState([]);

  const [form, setForm] = useState({
    judulDiklatId: "",
    namaBatch: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    lokasiAtauLink: "",
    kuota: "",
  });
  const [narasumberPerMateri, setNarasumberPerMateri] = useState({}); // { materiId: narasumberId }
  const [panitiaTerpilih, setPanitiaTerpilih] = useState({}); // { panitiaId: peranPj }

  // Muat opsi awal
  useEffect(() => {
    fetch("/api/diklat").then((r) => r.json()).then(setDiklatList);
    fetch("/api/narasumber").then((r) => r.json()).then(setNarasumberList);
    fetch("/api/panitia").then((r) => r.json()).then(setPanitiaList);
  }, []);

  // Muat materi begitu Judul Diklat dipilih
  useEffect(() => {
    if (!form.judulDiklatId) { setMateriList([]); return; }
    fetch(`/api/materi?judulDiklatId=${form.judulDiklatId}`).then((r) => r.json()).then(setMateriList);
  }, [form.judulDiklatId]);

  const selectedDiklat = diklatList.find((d) => d.id === form.judulDiklatId);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function canProceed() {
    if (step === 0) return !!form.judulDiklatId;
    if (step === 1) return form.namaBatch && form.tanggalMulai && form.tanggalSelesai && form.lokasiAtauLink;
    if (step === 3) return !!form.kuota && Number(form.kuota) > 0;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const kelas = await res.json();
      if (!res.ok) throw new Error(kelas.error || "Gagal membuat kelas.");

      // Tugaskan narasumber per materi
      for (const [materiId, narasumberId] of Object.entries(narasumberPerMateri)) {
        if (!narasumberId) continue;
        await fetch(`/api/kelas/${kelas.id}/narasumber`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materiId, narasumberId }),
        });
      }

      // Tugaskan panitia
      for (const [panitiaId, peranPj] of Object.entries(panitiaTerpilih)) {
        if (!peranPj) continue;
        await fetch(`/api/kelas/${kelas.id}/panitia`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ panitiaId, peranPj }),
        });
      }

      router.push(`/kelas/${kelas.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-navy">Buat Kelas Diklat Baru</h1>

      {/* Stepper */}
      <div className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i <= step ? "bg-navy text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {i + 1}
              </div>
              <p className={`mt-1 w-20 text-center text-[11px] ${i === step ? "text-navy font-medium" : "text-slate-400"}`}>
                {label}
              </p>
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-navy" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {/* Step 1: Judul Diklat */}
        {step === 0 && (
          <div className="space-y-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Pilih Judul Diklat</label>
            {diklatList.length === 0 && <p className="text-sm text-slate-400">Memuat / belum ada data Judul Diklat.</p>}
            {diklatList.map((d) => (
              <button
                key={d.id}
                onClick={() => update("judulDiklatId", d.id)}
                className={`w-full rounded-md border p-3 text-left text-sm ${
                  form.judulDiklatId === d.id ? "border-navy bg-slate-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-medium text-slate-800">{d.nama}</p>
                <p className="text-xs text-slate-500">{d.kode} · {d.kategori}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Jadwal & Lokasi */}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Nama Kelas / Batch">
              <input value={form.namaBatch} onChange={(e) => update("namaBatch", e.target.value)}
                placeholder="mis. Angkatan 12" className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal Mulai">
                <input type="date" value={form.tanggalMulai} onChange={(e) => update("tanggalMulai", e.target.value)} className="input" />
              </Field>
              <Field label="Tanggal Selesai">
                <input type="date" value={form.tanggalSelesai} onChange={(e) => update("tanggalSelesai", e.target.value)} className="input" />
              </Field>
            </div>
            <Field label="Lokasi / Link Zoom">
              <input value={form.lokasiAtauLink} onChange={(e) => update("lokasiAtauLink", e.target.value)}
                placeholder="mis. Pusdiklat Regional III atau link Zoom" className="input" />
            </Field>
          </div>
        )}

        {/* Step 3: Narasumber & Panitia */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Narasumber per Materi</p>
              {materiList.length === 0 && (
                <p className="text-sm text-slate-400">
                  {selectedDiklat ? "Judul Diklat ini belum punya Materi." : "Pilih Judul Diklat dulu di Langkah 1."}
                </p>
              )}
              <div className="space-y-2">
                {materiList.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-medium">{m.judulMateri}</p>
                      <p className="text-xs text-slate-500">{m.durasiJp} JP</p>
                    </div>
                    <select
                      value={narasumberPerMateri[m.id] || ""}
                      onChange={(e) => setNarasumberPerMateri((s) => ({ ...s, [m.id]: e.target.value }))}
                      className="input w-48"
                    >
                      <option value="">— pilih narasumber —</option>
                      {narasumberList.map((n) => (
                        <option key={n.id} value={n.id}>{n.nama}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Panitia Penanggung Jawab</p>
              <div className="space-y-2">
                {panitiaList.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                    <input
                      type="checkbox"
                      checked={p.id in panitiaTerpilih}
                      onChange={(e) =>
                        setPanitiaTerpilih((s) => {
                          const next = { ...s };
                          if (e.target.checked) next[p.id] = "Anggota"; else delete next[p.id];
                          return next;
                        })
                      }
                    />
                    <p className="flex-1 text-sm font-medium">{p.nama}</p>
                    {p.id in panitiaTerpilih && (
                      <input
                        value={panitiaTerpilih[p.id]}
                        onChange={(e) => setPanitiaTerpilih((s) => ({ ...s, [p.id]: e.target.value }))}
                        placeholder="Peran / PJ (mis. Koordinator)"
                        className="input w-48"
                      />
                    )}
                  </div>
                ))}
                {panitiaList.length === 0 && <p className="text-sm text-slate-400">Belum ada data Panitia.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Kuota & Review */}
        {step === 3 && (
          <div className="space-y-5">
            <Field label="Kuota Peserta">
              <input type="number" min="1" value={form.kuota} onChange={(e) => update("kuota", e.target.value)}
                placeholder="mis. 30" className="input" />
            </Field>

            <div className="rounded-md border-l-4 border-gold bg-slate-50 p-4 text-sm">
              <p className="font-medium text-navy">Ringkasan</p>
              <dl className="mt-2 space-y-1 text-slate-600">
                <p><b>Diklat:</b> {selectedDiklat?.nama}</p>
                <p><b>Batch:</b> {form.namaBatch}</p>
                <p><b>Jadwal:</b> {form.tanggalMulai} s/d {form.tanggalSelesai}</p>
                <p><b>Lokasi:</b> {form.lokasiAtauLink}</p>
                <p><b>Narasumber ditugaskan:</b> {Object.values(narasumberPerMateri).filter(Boolean).length} dari {materiList.length} materi</p>
                <p><b>Panitia:</b> {Object.keys(panitiaTerpilih).length} orang</p>
                <p><b>Kuota:</b> {form.kuota || "—"}</p>
              </dl>
            </div>

            {error && <p className="rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          </div>
        )}
      </div>

      {/* Navigasi */}
      <div className="mt-5 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          Kembali
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Lanjut
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {submitting ? "Menyimpan..." : "Simpan Kelas"}
          </button>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: #16233F; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
