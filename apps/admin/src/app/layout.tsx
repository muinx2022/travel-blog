import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastViewport } from "@/components/ui/app-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Admin - Dashboard",
  description: "Beautiful admin panel for managing travel content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var key = 'starter_admin_theme';
                  var stored = localStorage.getItem(key);
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored === 'dark' ? 'dark' : stored === 'light' ? 'light' : systemDark ? 'dark' : 'light';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                  
                  // Listen for system theme changes
                  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                    if (!localStorage.getItem(key)) {
                      document.documentElement.classList.toggle('dark', e.matches);
                    }
                  });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-200`}
      >
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
