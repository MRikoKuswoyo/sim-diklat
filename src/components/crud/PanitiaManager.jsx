"use client";

import { UserCog } from "lucide-react";
import PeopleDirectory from "@/components/crud/PeopleDirectory";

export default function PanitiaManager({ list }) {
  return (
    <PeopleDirectory
      judul="Panitia" deskripsi="Tim penyelenggara yang ditugaskan mengelola kelas diklat." singular="panitia" endpoint="/api/panitia" list={list} ikon={UserCog}
      fields={[
        { key: "nama", label: "Nama lengkap", placeholder: "Nama panitia" },
        { key: "kontak", label: "Kontak (telepon/WhatsApp)", placeholder: "0812...", hint: "Dipakai untuk tombol telepon dan WhatsApp." },
      ]}
      kontakKey="kontak" pakai={(o) => o._count?.panitiaKelas ?? 0} labelPakai={(n) => `Bertugas di ${n} kelas`}
    />
  );
}
