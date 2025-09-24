"use client";

import { SessionProvider } from "@/contexts/SessionContext";
import "./globals.css";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import { initializePrice } from '@/lib/priceManager';
const inter = Inter({ subsets: ["latin"] });
initializePrice();
console.log('Price manager initialized with price:', initializePrice());
export default function RootLayout({ children }) {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
