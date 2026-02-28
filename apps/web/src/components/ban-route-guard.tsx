"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";

const BLOCKED_PATTERNS: RegExp[] = [
  /^\/my-media\/?$/,
  /^\/profile\/edit\/?$/,
  /^\/my-(posts|tours|hotels|homestays|restaurants|souvenir-shops)\/new\/?$/,
  /^\/my-(posts|tours|hotels|homestays|restaurants|souvenir-shops)\/[^/]+\/edit\/?$/,
];

export function BanRouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    if (!isLoggedIn || !user?.isBanned) {
      return;
    }

    if (BLOCKED_PATTERNS.some((pattern) => pattern.test(pathname))) {
      router.replace("/my-services");
    }
  }, [isLoggedIn, user?.isBanned, pathname, router]);

  return null;
}

