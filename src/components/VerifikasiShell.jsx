import { prisma } from "@/lib/prisma";

// Kerangka halaman publik verifikasi (tanpa login, tanpa sidebar)
export default async function VerifikasiShell({ children }) {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="mx-auto h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy"><span className="font-serif font-bold text-gold">SD</span></div>
          )}
          <h1 className="mt-3 font-serif text-xl font-semibold text-navy">Verifikasi Sertifikat</h1>
          <p className="text-sm text-slate-500">SIM Diklat</p>
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-slate-400">Halaman ini hanya menampilkan data minimal untuk keperluan verifikasi keaslian.</p>
      </div>
    </div>
  );
}
