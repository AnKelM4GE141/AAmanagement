import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AA Portal - Property Management",
  description: "Property management platform for landlords and tenants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
