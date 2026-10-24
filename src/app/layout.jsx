import "./globals.css";

export const metadata = {
  title: "SIM Diklat",
  description: "Sistem Informasi Manajemen Diklat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
