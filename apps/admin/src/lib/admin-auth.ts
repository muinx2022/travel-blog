export type PermissionAction =
  | "list"
  | "find"
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "view";

export type PermissionMap = Record<string, Partial<Record<PermissionAction, boolean>>>;

export type AdminSession = {
  jwt: string;
  user: {
    id: number;
    username: string;
    email?: string;
    roleName?: string;
    roleType?: string;
  };
  permissions: PermissionMap;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";
const SESSION_KEY = "starter_admin_session";
const REMEMBERED_IDENTIFIER_KEY = "starter_admin_identifier";

type AuthResponse = {
  jwt: string;
  user: {
    id: number;
    username: string;
    email?: string;
  };
};

type MeResponse = {
  id: number;
  username: string;
  email?: string;
  role?: {
    id: number;
    name: string;
    type?: string;
  };
};

async function tryReadRoleInfo(jwt: string) {
  try {
    const meResponse = await fetch(`${API_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });

    if (!meResponse.ok) {
      return { roleName: undefined, roleType: undefined };
    }

    const mePayload = (await meResponse.json()) as MeResponse;
    return {
      roleName: mePayload.role?.name,
      roleType: mePayload.role?.type,
    };
  } catch {
    return {
      roleName: undefined,
      roleType: undefined,
    };
  }
}

export async function loginAsAdmin(identifier: string, password: string) {
  const authResponse = await fetch(`${API_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const authPayload = (await authResponse.json()) as AuthResponse & {
    error?: { message?: string };
  };

  if (!authResponse.ok || !authPayload.jwt) {
    throw new Error(authPayload.error?.message ?? "Login failed");
  }

  const roleInfo = await tryReadRoleInfo(authPayload.jwt);

  const permissionsResponse = await fetch(`${API_URL}/api/management/my-permissions`, {
    headers: {
      Authorization: `Bearer ${authPayload.jwt}`,
      "Content-Type": "application/json",
    },
  });

  if (permissionsResponse.status === 401 || permissionsResponse.status === 403) {
    throw new Error("User does not have Admin access");
  }
  if (!permissionsResponse.ok) {
    const payload = (await permissionsResponse.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(payload.error?.message ?? "Failed to load permissions");
  }

  const permissionsPayload = (await permissionsResponse.json()) as {
    permissions?: PermissionMap;
    role?: { id?: number; name?: string; type?: string };
  };

  return {
    jwt: authPayload.jwt,
    user: {
      id: authPayload.user.id,
      username: authPayload.user.username,
      email: authPayload.user.email,
      roleName: permissionsPayload.role?.name ?? roleInfo.roleName,
      roleType: permissionsPayload.role?.type ?? roleInfo.roleType,
    },
    permissions: permissionsPayload.permissions ?? {},
  } satisfies AdminSession;
}

export function getStoredSession(): AdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem(SESSION_KEY) ??
    window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AdminSession, rememberMe: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify(session);
  if (rememberMe) {
    window.localStorage.setItem(SESSION_KEY, payload);
    window.sessionStorage.removeItem(SESSION_KEY);
    return;
  }

  window.sessionStorage.setItem(SESSION_KEY, payload);
  window.localStorage.removeItem(SESSION_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function getRememberedIdentifier() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(REMEMBERED_IDENTIFIER_KEY) ?? "";
}

export function saveRememberedIdentifier(identifier: string, rememberMe: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (!rememberMe || !identifier.trim()) {
    window.localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY);
    return;
  }

  window.localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier.trim());
}

