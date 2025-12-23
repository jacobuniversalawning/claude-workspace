import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Awning Cost Sheet Calculator",
  description: "Self-learning cost estimation app for Universal Awning Company",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
