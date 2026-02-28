"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { PropsWithChildren, useEffect, useMemo, useSyncExternalStore, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Map,
  Building2,
  Tag,
  MessageSquare,
  Users,
  LogOut,
  ChevronRight,
  Image,
  Home,
  UtensilsCrossed,
  Store,
  BookOpen,
  Flag,
  Mail,
  MailCheck,
  Shield,
  Sparkles,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { clearSession, saveSession, getStoredSession, type AdminSession, type PermissionAction } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";


const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

async function refreshPermissions(session: AdminSession): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/management/my-permissions`, {
      headers: { Authorization: `Bearer ${session.jwt}` },
    });
    if (!res.ok) return;
    const payload = await res.json() as { permissions?: Record<string, Record<string, boolean>> };
    if (!payload.permissions) return;
    const current = getStoredSession();
    if (!current || current.user.id !== session.user.id) return;
    const updated: AdminSession = { ...current, permissions: payload.permissions };
    const isLocal = !!window.localStorage.getItem("starter_admin_session");
    saveSession(updated, isLocal);
    // Force useSyncExternalStore to re-read by firing a storage event
    window.dispatchEvent(new StorageEvent("storage", { key: "starter_admin_session" }));
  } catch {
    // silent — permissions stay as-is
  }
}

const menuGroups = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard",               label: "Dashboard",        icon: LayoutDashboard, resource: null,                    action: "view" as PermissionAction },
    ]
  },
  {
    title: "Content",
    items: [
      { href: "/homepage",                label: "Homepage",         icon: Home,            resource: "homepage",              action: "find" as PermissionAction },
      { href: "/content-pages",          label: "Content Pages",    icon: BookOpen,        resource: "contentPage",           action: "list" as PermissionAction },
      { href: "/posts",                  label: "Posts",            icon: FileText,        resource: "post",                  action: "list" as PermissionAction },
      { href: "/categories",             label: "Categories",       icon: Tag,             resource: "category",              action: "list" as PermissionAction },
      { href: "/tags",                   label: "Tags",             icon: Tag,             resource: "tag",                   action: "list" as PermissionAction },
    ]
  },
  {
    title: "Travel Services",
    items: [
      { href: "/tours",                  label: "Tours",            icon: Map,             resource: "tour",                  action: "list" as PermissionAction },
      { href: "/hotels",                 label: "Hotels",           icon: Building2,       resource: "hotel",                 action: "list" as PermissionAction },
      { href: "/homestays",              label: "Homestays",        icon: Home,            resource: "homestay",              action: "list" as PermissionAction },
      { href: "/restaurants",            label: "Restaurants",      icon: UtensilsCrossed, resource: "restaurant",            action: "list" as PermissionAction },
      { href: "/souvenir-shops",         label: "Souvenir Shops",   icon: Store,           resource: "souvenirShop",          action: "list" as PermissionAction },
      { href: "/travel-guides",          label: "Travel Guides",    icon: BookOpen,        resource: "travelGuide",           action: "list" as PermissionAction },
    ]
  },
  {
    title: "Engagement",
    items: [
      { href: "/comments",               label: "Comments",         icon: MessageSquare,   resource: "comment",               action: "list" as PermissionAction },
      { href: "/reports",                label: "Reports",          icon: Flag,            resource: "report",                action: "list" as PermissionAction },
      { href: "/contact-requests",       label: "Contact Requests", icon: Mail,            resource: "contactRequest",        action: "list" as PermissionAction },
      { href: "/contact-email-template", label: "Email Template",   icon: MailCheck,       resource: "contactEmailTemplate",  action: "list" as PermissionAction },
    ]
  },
  {
    title: "System",
    items: [
      { href: "/media",                  label: "Media Library",    icon: Image,           resource: null,                    action: "list" as PermissionAction },
      { href: "/users",                  label: "Users",            icon: Users,           resource: "user",                  action: "list" as PermissionAction },
      { href: "/roles",                  label: "Roles & Permissions", icon: Shield,       resource: "user",                  action: "list" as PermissionAction },
    ]
  },
];


const SESSION_KEY = "starter_admin_session";
let cachedSessionRaw: string | null | undefined;
let cachedSessionValue: AdminSession | null = null;

function UserAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/[@.\s_-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className={cn(
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground shadow-sm",
      className
    )}>
      {initials || "A"}
    </div>
  );
}


function subscribeSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSessionSnapshot() {
  const raw =
    window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY);

  if (raw === cachedSessionRaw) {
    return cachedSessionValue;
  }

  cachedSessionRaw = raw;
  if (!raw) {
    cachedSessionValue = null;
    return cachedSessionValue;
  }

  try {
    cachedSessionValue = JSON.parse(raw) as AdminSession;
  } catch {
    cachedSessionValue = null;
  }

  return cachedSessionValue;
}

function getSessionServerSnapshot() {
  return undefined as AdminSession | null | undefined;
}

export function AdminProtectedLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Content": true,
    "Travel Services": true,
  });
  
  const session = useSyncExternalStore<AdminSession | null | undefined>(
    subscribeSession,
    getSessionSnapshot,
    getSessionServerSnapshot,
  );

  useEffect(() => {
    if (session === null) {
      router.replace("/");
    }
  }, [router, session]);

  // Refresh permissions from server whenever the logged-in user changes,
  // so stale cached sessions are always corrected without requiring logout/login.
  useEffect(() => {
    if (session) {
      void refreshPermissions(session);
    }
  }, [session?.user.id]);

  useEffect(() => {
    const segment = (pathname ?? "").split("/").filter(Boolean)[0] ?? "";
    const action = (pathname ?? "").split("/").filter(Boolean);
    const isCreate = action[1] === "new";
    const isEdit = action.includes("edit");
    const isView = action.includes("view");

    const sectionLabelMap: Record<string, string> = {
      dashboard: "Dashboard",
      homepage: "Homepage",
      "content-pages": "Content Pages",
      categories: "Categories",
      posts: "Posts",
      tours: "Tours",
      hotels: "Hotels",
      homestays: "Homestays",
      restaurants: "Restaurants",
      "souvenir-shops": "Souvenir Shops",
      "travel-guides": "Travel Guides",
      comments: "Comments",
      reports: "Reports",
      "contact-requests": "Contact Requests",
      "contact-email-template": "Contact Email",
      tags: "Tags",
      media: "Media",
      users: "Users",
      roles: "Roles",
    };

    const sectionLabel = sectionLabelMap[segment] ?? "Administration";
    const sectionSingularLabelMap: Record<string, string> = {
      dashboard: "Dashboard",
      homepage: "Homepage",
      "content-pages": "Content Page",
      categories: "Category",
      posts: "Post",
      tours: "Tour",
      hotels: "Hotel",
      homestays: "Homestay",
      restaurants: "Restaurant",
      "souvenir-shops": "Souvenir Shop",
      "travel-guides": "Travel Guide",
      comments: "Comment",
      reports: "Report",
      "contact-requests": "Contact Request",
      "contact-email-template": "Contact Email",
      tags: "Tag",
      media: "Media",
      users: "User",
      roles: "Role",
    };
    const sectionSingularLabel = sectionSingularLabelMap[segment] ?? sectionLabel;

    let pageLabel = sectionLabel;
    if (isCreate) pageLabel = `Create ${sectionSingularLabel}`;
    if (isEdit) pageLabel = `Edit ${sectionSingularLabel}`;
    if (isView) pageLabel = `View ${sectionSingularLabel}`;

    document.title = `${pageLabel} - Travel Admin`;
  }, [pathname]);

  const activePath = useMemo(() => pathname ?? "", [pathname]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  if (session === undefined || session === null) return null;

  const visibleGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(
      (item) => item.resource === null || hasPermission(session, item.resource, item.action)
    )
  })).filter(group => group.items.length > 0);

  const displayName = session.user.email ?? session.user.username;

  const onLogout = () => {
    clearSession();
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/50 px-5 bg-gradient-to-r from-card to-muted/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">Travel Admin</span>
            <span className="text-[10px] text-muted-foreground font-medium">Management Portal</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-accent"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleGroups.map((group) => (
            <div key={group.title} className="mb-3">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                {group.title}
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  expandedGroups[group.title] !== false && "rotate-180"
                )} />
              </button>
              <div className={cn(
                "space-y-0.5 overflow-hidden transition-all duration-200",
                expandedGroups[group.title] !== false ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
              )}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activePath === item.href || activePath.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground/70 group-hover:bg-accent group-hover:text-foreground"
                      )}>
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="shrink-0 border-t border-border/50 p-4 bg-gradient-to-t from-muted/30 to-card">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3 shadow-sm">
            <UserAvatar name={displayName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {session.user.roleName ?? "Administrator"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/95 px-4 lg:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Travel Admin</span>
              <ChevronRight className="h-4 w-4" />
              <span className="capitalize">{activePath.split('/')[1] || 'Dashboard'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 bg-muted/30 min-h-[calc(100vh-4rem)]">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
