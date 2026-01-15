import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import EmotionCacheProvider from './lib/emotion-cache';
import ThemeProvider from './lib/theme-provider';

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "N1 - Application Event",
  icons: {
    icon: "/logo/logo-n1.png", // Caminho do ícone
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} antialiased`}
        style={{ fontFamily: 'var(--font-roboto), Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        <EmotionCacheProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
