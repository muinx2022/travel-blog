"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  BookOpenText,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Plus,
  MapPin,
  Hotel,
  Home,
  UtensilsCrossed,
  ShoppingBag,
  User,
  Briefcase,
  Image as ImageIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "./auth-context";
import type { PublicContentPage } from "@/lib/strapi";

type NavCategory = { slug: string; name: string };

export function SiteHeader({
  contentPages = [],
  navCategories = [],
}: {
  contentPages?: PublicContentPage[];
  navCategories?: NavCategory[];
}) {
  const { isLoggedIn, user, logout, openLoginModal } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const servicesMenuRef = useRef<HTMLDivElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const locationMenuRef = useRef<HTMLDivElement | null>(null);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target as Node)) setServicesMenuOpen(false);
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) setAddMenuOpen(false);
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target as Node)) setLocationMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const showUserMenu = isHydrated && isLoggedIn && !!user;
  const isBannedUser = Boolean(user?.isBanned);
  const headerPages = contentPages.filter((item) => item.showInHeader).slice(0, 3);

  // Split categories into 4 columns
  const COLS = 4;
  const colSize = Math.ceil(navCategories.length / COLS);
  const columns = Array.from({ length: COLS }, (_, i) =>
    navCategories.slice(i * colSize, (i + 1) * colSize),
  ).filter((col) => col.length > 0);

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-900/65">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 text-sm font-bold text-white shadow-lg shadow-sky-300/60">
              NX
            </div>
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
                Nexa Travel Blog
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Địa điểm, kinh nghiệm và gợi ý liên quan</p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300 md:flex">
          {/* Địa danh mega menu */}
          <div ref={locationMenuRef} className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 transition-colors hover:text-sky-700 dark:hover:text-sky-400"
              onClick={() => setLocationMenuOpen((v) => !v)}
            >
              <MapPin className="h-4 w-4" />
              <span>Địa danh</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${locationMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {locationMenuOpen && navCategories.length > 0 && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-[640px] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-800">
                <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Chọn tỉnh thành</p>
                </div>
                <div className="grid p-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                  {columns.map((col, ci) => (
                    <div key={ci} className="flex flex-col gap-0.5">
                      {col.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/c/${cat.slug}`}
                          onClick={() => setLocationMenuOpen(false)}
                          className="rounded-lg px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-sky-300"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 px-5 py-2.5 dark:border-slate-700">
                  <Link
                    href="/posts"
                    onClick={() => setLocationMenuOpen(false)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    Xem tất cả bài viết →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link href="/guides" className="inline-flex items-center gap-1 transition-colors hover:text-sky-700 dark:hover:text-sky-400">
            <BookOpenText className="h-4 w-4" />
            <span>Cẩm nang</span>
          </Link>

          <div ref={servicesMenuRef} className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 transition-colors hover:text-sky-700 dark:hover:text-sky-400"
              onClick={() => setServicesMenuOpen((current) => !current)}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              <span>Dịch vụ</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${servicesMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {servicesMenuOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800">
                <Link href="/hotels" className="block px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setServicesMenuOpen(false)}>Khách sạn</Link>
                <Link href="/tours" className="block px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setServicesMenuOpen(false)}>Tour</Link>
                <Link href="/homestays" className="block px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setServicesMenuOpen(false)}>Homestay</Link>
                <Link href="/restaurants" className="block px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setServicesMenuOpen(false)}>Nhà hàng</Link>
                <Link href="/souvenir-shops" className="block px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setServicesMenuOpen(false)}>Quà lưu niệm</Link>
              </div>
            )}
          </div>

          {headerPages.map((page) => (
            <Link key={page.documentId} className="transition-colors hover:text-sky-700 dark:hover:text-sky-400" href={`/pages/${page.slug}`}>
              {page.navigationLabel || page.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Add New Button */}
          {isHydrated && isLoggedIn && !isBannedUser && (
            <div ref={addMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAddMenuOpen((current) => !current)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-300/60 transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm mới</span>
              </button>
              {addMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800">
                  <Link href="/my-posts/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setAddMenuOpen(false)}><FileText className="h-4 w-4 text-sky-600" />Bài viết</Link>
                  <Link href="/my-tours/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setAddMenuOpen(false)}><MapPin className="h-4 w-4 text-emerald-600" />Tour</Link>
                  <Link href="/my-hotels/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setAddMenuOpen(false)}><Hotel className="h-4 w-4 text-amber-600" />Khách sạn</Link>
                  <Link href="/my-homestays/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setAddMenuOpen(false)}><Home className="h-4 w-4 text-indigo-600" />Homestay</Link>
                  <Link href="/my-restaurants/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setAddMenuOpen(false)}><UtensilsCrossed className="h-4 w-4 text-rose-600" />Nhà hàng</Link>
                  <Link href="/my-souvenir-shops/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setAddMenuOpen(false)}><ShoppingBag className="h-4 w-4 text-violet-600" />Quà lưu niệm</Link>
                </div>
              )}
            </div>
          )}

          {!isHydrated ? (
            <div className="h-9 w-[120px]" />
          ) : showUserMenu && user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-sky-100 bg-white px-2 py-1.5 text-sm text-slate-700 shadow-sm transition hover:border-sky-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-600"
                onClick={() => setMenuOpen((current) => !current)}
              >
                {user.avatarUrl ? (
                  <Image key={user.avatarUrl} src={user.avatarUrl} alt="Avatar" width={30} height={30} className="h-7 w-7 rounded-full object-cover" unoptimized />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold uppercase text-sky-700" title={user.email}>
                    {(user.username ?? user.email)[0]}
                  </div>
                )}
                <span className="max-w-[100px] truncate text-sm">{user.username}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-600 dark:bg-slate-800">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Xin chào,</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.username}</p>
                  </div>
                  {!isBannedUser && (
                    <Link href="/profile/edit" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setMenuOpen(false)}><User className="h-4 w-4 text-sky-600" /><span>Sửa hồ sơ</span></Link>
                  )}
                  <Link href="/my-services" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setMenuOpen(false)}><Briefcase className="h-4 w-4 text-emerald-600" /><span>Các dịch vụ</span></Link>
                  {!isBannedUser && (
                    <Link href="/my-media" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setMenuOpen(false)}><ImageIcon className="h-4 w-4 text-violet-600" /><span>Media</span></Link>
                  )}
                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    onClick={() => { setMenuOpen(false); logout(); router.push("/"); }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sky-300/60 transition hover:brightness-110"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
