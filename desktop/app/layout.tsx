import type { Metadata } from "next";
import { Arimo, Bellefair } from "next/font/google";
import "./globals.css";
import Frame from "@/components/Frame";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
        className={`${arimo.variable}  relative flex min-h-screen w-full flex-col gap-2 overflow-hidden antialiased`}
      >
        {/* <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center blur-xl"
          src="/videos/loop-comp.mp4"
        ></video> */}

        <Frame />

        <div className="flex flex-1 flex-col gap-2 p-5 pt-0">
          <main className="h-[calc(100vh-32px-8px-8px-20px)] overflow-hidden rounded-4xl flex flex-col bg-black  pb-6  gap-4 text-neutral-50 shadow-lg shadow-black/20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
