"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ className = "text-sm text-slate-500 underline hover:text-slate-700" }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={className}>
      Keluar
    </button>
  );
}
