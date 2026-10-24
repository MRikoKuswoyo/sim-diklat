import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { excelKelas, responExcel } from "@/lib/laporan";

export const dynamic = "force-dynamic";

// GET -> Excel laporan satu kelas (ringkasan, peserta, presensi, nilai)
export async function GET(_request, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const hasil = await excelKelas(params.id);
  if (!hasil) return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
  return responExcel(hasil.buffer, hasil.nama);
}
