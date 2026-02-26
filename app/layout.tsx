import type { Metadata } from "next";
import { FloatingBees } from "@/components/FloatingBees";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdAccelerator - Reading Comprehension",
  description:
    "AI-powered reading comprehension that teaches, not tests.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-gray-800 antialiased">
        <FloatingBees />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
