import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MockMate — Simulador de Entrevistas con IA",
  description: "Practica entrevistas técnicas con un entrevistador de IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-[#0a0a0f] text-[#e8e8f0] flex flex-col">
        {children}
      </body>
    </html>
  );
}
