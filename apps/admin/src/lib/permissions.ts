import { getStoredSession, type AdminSession, type PermissionAction } from "@/lib/admin-auth";

export function hasPermission(
  session: AdminSession | null | undefined,
  resource: string,
  action: PermissionAction,
) {
  if (!session) {
    return false;
  }

  return session.permissions?.[resource]?.[action] === true;
}

export function can(resource: string, action: PermissionAction) {
  return hasPermission(getStoredSession(), resource, action);
}
