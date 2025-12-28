import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider } from "@/components/SessionProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans min-h-screen bg-white dark:bg-black text-gray-900 dark:text-vercel-text-primary">
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
