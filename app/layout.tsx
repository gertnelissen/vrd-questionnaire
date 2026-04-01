import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VRD Questionnaire",
  description: "VRD Questionnaire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
