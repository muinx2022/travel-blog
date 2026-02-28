export function isMyServiceAuthReady(args: {
  isHydrated: boolean;
  isLoggedIn: boolean;
  jwt?: string | null;
}) {
  return args.isHydrated && args.isLoggedIn && Boolean(args.jwt);
}

export function shouldRedirectToLogin(args: {
  isHydrated: boolean;
  isLoggedIn: boolean;
  jwt?: string | null;
}) {
  return args.isHydrated && (!args.isLoggedIn || !args.jwt);
}

