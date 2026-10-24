import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { dataTahunan, excelTahunan, responExcel } from "@/lib/laporan";

export const dynamic = "force-dynamic";

// GET /api/laporan/tahunan?tahun=2026 -> Excel rekap tahunan (ringkasan, kelas, per peserta, per instansi)
export async function GET(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const tahun = parseInt(new URL(request.url).searchParams.get("tahun"), 10);
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) return NextResponse.json({ error: "Tahun tidak valid." }, { status: 400 });
  return responExcel(excelTahunan(tahun, await dataTahunan(tahun)), `Rekap-Diklat-${tahun}.xlsx`);
}
