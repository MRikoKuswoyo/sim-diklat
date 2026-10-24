import AbsenOtomatis from "@/components/AbsenOtomatis";

export const dynamic = "force-dynamic";
export const metadata = { title: "Absen Kehadiran", robots: { index: false } };

export default function AbsenPage({ params }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <AbsenOtomatis kode={String(params.kode).toUpperCase()} />
    </div>
  );
}
