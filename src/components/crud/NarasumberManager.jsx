"use client";

import { Presentation } from "lucide-react";
import PeopleDirectory from "@/components/crud/PeopleDirectory";

export default function NarasumberManager({ list }) {
  return (
    <PeopleDirectory
      judul="Narasumber" deskripsi="Pengajar dan pemateri diklat. Ditugaskan per materi di setiap kelas." singular="narasumber" endpoint="/api/narasumber" list={list} ikon={Presentation}
      fields={[
        { key: "nama", label: "Nama lengkap (dengan gelar)", placeholder: "Dr. Nama, M.Kom" },
        { key: "kepakaran", label: "Kepakaran", placeholder: "Pemrograman Web" },
        { key: "instansiAsal", label: "Instansi asal", placeholder: "Universitas ..." },
        { key: "kontak", label: "Kontak (telepon/WhatsApp)", placeholder: "0812...", hint: "Dipakai untuk tombol telepon dan WhatsApp." },
      ]}
      chipKey="kepakaran" instansiKey="instansiAsal" kontakKey="kontak" pakai={(o) => o._count?.pengajarKelas ?? 0} labelPakai={(n) => `Mengajar di ${n} penugasan`}
    />
  );
}
