import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { Toaster } from "sonner";

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
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0A0A0A',
                  border: '1px solid #1F1F1F',
                  color: '#EDEDED',
                },
              }}
              richColors
              closeButton
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
