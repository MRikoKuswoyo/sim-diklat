import { dataTahunan, daftarTahun } from "@/lib/laporan";
import LaporanView from "@/components/LaporanView";

export const dynamic = "force-dynamic";

export default async function LaporanPage({ searchParams }) {
  const tahunList = await daftarTahun();
  const diminta = parseInt(searchParams?.tahun, 10);
  const tahun = tahunList.includes(diminta) ? diminta : tahunList[0];
  const d = await dataTahunan(tahun);

  // Tanggal dijadikan teks ISO agar bisa dikirim ke komponen klien
  // (Set dibuang karena tidak bisa dikirim ke komponen klien)
  const data = {
    ...d,
    kelasRows: d.kelasRows.map((k) => ({ ...k, mulai: new Date(k.mulai).toISOString(), selesai: new Date(k.selesai).toISOString() })),
    instansiRows: d.instansiRows.map(({ pesertaIds, ...i }) => i),
  };
  return <LaporanView tahun={tahun} tahunList={tahunList} data={data} />;
}
