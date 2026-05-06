import Frame from "@/components/Frame";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Arimo, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={`${arimo.variable}  relative flex min-h-screen w-full flex-col gap-2 overflow-hidden antialiased`}
      >
        <Frame />
        <div className="flex flex-1 flex-col gap-2 p-5 pt-0">
          <main className="h-[calc(100vh-32px-8px-8px-20px)] overflow-hidden rounded-4xl flex flex-col bg-black  pb-6  gap-4 text-neutral-50  shadow-black/20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
