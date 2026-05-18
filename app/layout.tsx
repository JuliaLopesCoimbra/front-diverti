import type { Metadata, Viewport } from "next";
import { Roboto, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { FeedCacheProvider } from './context/FeedCacheContext';
import EmotionCacheProvider from './lib/emotion-cache';
import ThemeProvider from './lib/theme-provider';
import ScrollRestorer from './components/layout/ScrollRestorer';

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rock In Rio - Application Event",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo/logo-rockinrio.jpg",
    apple: "/logo/logo-rockinrio.jpg",
  },
  appleWebApp: {
    title: "N1 App",
    statusBarStyle: "default",
    capable: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${roboto.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: 'var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        <EmotionCacheProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <FeedCacheProvider>
                  <ScrollRestorer />
                  {children}
                </FeedCacheProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
