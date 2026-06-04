import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoSwap – Marketplace de Autos Usados en Bolivia",
  description: "Compra, vende e intercambia autos usados con garantía Escrow y verificación KYC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-white m-0 p-0`}>
        {children}
      </body>
    </html>
  );
}