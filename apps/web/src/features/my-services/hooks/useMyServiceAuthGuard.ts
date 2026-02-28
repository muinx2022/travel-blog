"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { isMyServiceAuthReady, shouldRedirectToLogin } from "../lib/auth-guard";

export function useMyServiceAuthGuard() {
  const router = useRouter();
  const { isLoggedIn, jwt, openLoginModal } = useAuth();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (
      shouldRedirectToLogin({
        isHydrated,
        isLoggedIn,
        jwt,
      })
    ) {
      openLoginModal();
      router.push("/");
    }
  }, [isHydrated, isLoggedIn, jwt, openLoginModal, router]);

  return {
    isHydrated,
    isLoggedIn,
    jwt,
    isReady: isMyServiceAuthReady({
      isHydrated,
      isLoggedIn,
      jwt,
    }),
  };
}

