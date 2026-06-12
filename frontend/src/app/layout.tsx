import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  // Next.js 16 / React 19: variable fonts load more efficiently
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "task_management — Task Management",
  description: "A premium ant-colony powered task management experience.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Next.js 16 + React 19: suppressHydrationWarning still needed for
    // next-themes to toggle the `class` attribute without a hydration mismatch.
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {children}
            <Toaster
              position="bottom-right"
              richColors
              expand
              duration={4000}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
