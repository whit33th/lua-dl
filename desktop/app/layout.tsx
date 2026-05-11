import WindowFrame from "@/components/window-frame/window-frame";
import type { Metadata } from "next";
import { Arimo, Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "lua-dl",
  description: "Desktop client for lua-dl",
};
const arimo = Arimo({
  subsets: ["latin"],
  variable: "--font-arimo",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${arimo.variable} relative flex min-h-screen w-full flex-col gap-2 overflow-hidden antialiased`}
      >
        <WindowFrame />
        <div className="flex flex-1 flex-col gap-2 p-5 pt-0">
          <main className="flex h-[calc(100vh-32px-8px-8px-20px)] flex-col gap-4 overflow-hidden rounded-4xl bg-black pb-6 text-neutral-50 shadow-black/20">
            {children}
          </main>
        </div>
        <Toaster richColors={false} />
      </body>
    </html>
  );
}
