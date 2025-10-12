import type { Metadata } from "next";
import { gilroy, agenorNeue } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Church Management System",
  description: "Manage church members, transfers, and reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${gilroy.variable} ${agenorNeue.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
