import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BioTrack",
  description: "Sistema de Registro de Calorias e Jejum",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      {/* O suppressHydrationWarning resolve o erro que você recebeu */}
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}