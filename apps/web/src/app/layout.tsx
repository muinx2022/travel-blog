import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";
import { AccountBanBanner } from "@/components/account-ban-banner";
import { BanRouteGuard } from "@/components/ban-route-guard";
import { SiteHeader } from "@/components/site-header";
import { LoginModal } from "@/components/login-modal";
import { getPublicContentPages, getAllCategories } from "@/lib/strapi";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Nexa Travel | Tour and Hotel",
  description: "Travel, tour and hotel booking portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contentPages, allCategories] = await Promise.all([
    getPublicContentPages(),
    getAllCategories(),
  ]);
  const footerPages = contentPages.filter((item) => item.showInFooter).slice(0, 4);
  const navCategories = allCategories
    .filter((cat) => !cat.parent?.documentId)
    .map((cat) => ({ slug: cat.slug, name: cat.name }));

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');var a=function(){document.documentElement.classList.toggle('dark',m.matches);};a();if(typeof m.addEventListener==='function'){m.addEventListener('change',a);}else if(typeof m.addListener==='function'){m.addListener(a);}}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${manrope.variable} ${playfair.variable} travel-body antialiased`}>
        <AuthProvider>
          <div className="relative min-h-screen overflow-x-clip">
            <div aria-hidden className="travel-glow travel-glow-top" />
            <div aria-hidden className="travel-glow travel-glow-bottom" />

            <SiteHeader contentPages={contentPages} navCategories={navCategories} />
            <AccountBanBanner />
            <BanRouteGuard />
            <LoginModal />

            <main className="relative z-10">{children}</main>

            <footer className="relative z-10 mt-16 border-t border-sky-100/70 bg-white/80 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-slate-600 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold tracking-wide text-slate-900 dark:text-slate-100">Nexa Travel</p>
                  <p>Tour tron goi, khach san chat luong, ho tro 24/7.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <a className="transition-colors hover:text-sky-700 dark:hover:text-sky-400" href="#top-destinations">Dia diem</a>
                  <a className="transition-colors hover:text-sky-700 dark:hover:text-sky-400" href="#insights">Bai viet</a>
                  {footerPages.map((page) => (
                    <Link
                      key={page.documentId}
                      className="transition-colors hover:text-sky-700 dark:hover:text-sky-400"
                      href={`/pages/${page.slug}`}
                    >
                      {page.navigationLabel || page.title}
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Copyright {new Date().getFullYear()} Nexa Travel</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
