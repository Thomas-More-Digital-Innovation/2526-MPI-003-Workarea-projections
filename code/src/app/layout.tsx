import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "MPI Projection Tool",
  description: "A professional tool for managing and projecting work areas with customizable grids and shapes",
  keywords: ["MPI", "projection", "grid", "shapes", "work area"],
  authors: [{ name: " Digital Innovation student of Thomas More Geel" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[var(--color-secondary)]/20 overflow-hidden">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
