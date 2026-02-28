import { URL_PATH_TO_RESOURCE, toActionString } from '../api/management/helpers/resources-manifest';

type JwtPayload = {
  id?: number;
};

/**
 * Derive the management resource and action from the incoming HTTP request.
 * Returns null for paths that don't map to a known resource/action.
 */
function resolveRequestAction(method: string, path: string): { resource: string; action: string } | null {
  // Strip /api prefix if present
  const normalized = path.replace(/^\/api/, '');

  // Must start with /management/
  if (!normalized.startsWith('/management/')) {
    return null;
  }

  const rest = normalized.slice('/management/'.length);
  const segments = rest.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const pathSegment = segments[0]!;
  const resource = URL_PATH_TO_RESOURCE[pathSegment];
  if (!resource) {
    return null;
  }

  // /management/dashboard
  if (resource === 'dashboard') {
    return { resource: 'dashboard', action: 'view' };
  }

  // /management/homepage
  if (resource === 'homepage') {
    return { resource: 'homepage', action: method === 'PUT' ? 'update' : 'find' };
  }

  // /management/roles/:roleId/permissions
  if (pathSegment === 'roles' && segments[2] === 'permissions') {
    return { resource: 'user', action: method === 'PUT' ? 'update' : 'find' };
  }

  if (segments.length === 1) {
    return { resource, action: method === 'POST' ? 'create' : 'list' };
  }

  if (segments.length === 2) {
    if (method === 'GET')    return { resource, action: 'find' };
    if (method === 'PUT')    return { resource, action: 'update' };
    if (method === 'DELETE') return { resource, action: 'delete' };
    return null;
  }

  if (segments.length === 3) {
    const subAction = segments[2];
    if (subAction === 'publish')   return { resource, action: 'publish' };
    if (subAction === 'unpublish') return { resource, action: 'unpublish' };
    return null;
  }

  return null;
}

export default async (policyContext: any, _config: unknown, { strapi }: any) => {
  const authHeader = policyContext.request.header?.authorization as string | undefined;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return false;
  }

  try {
    const jwtService = strapi.plugin("users-permissions").service("jwt");
    const payload = (await jwtService.verify(token)) as JwtPayload;

    if (!payload?.id) {
      return false;
    }

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { id: payload.id }, populate: { role: true } });

    const roleType = String(user?.role?.type ?? "").toLowerCase();

    // Strapi super-admin → bypass everything
    if (roleType === "admin") {
      policyContext.state.managementUser = { roleType: 'admin', granted: null };
      return true;
    }

    const roleName = String(user?.role?.name ?? "").trim();
    const roleId = Number(user?.role?.id);
    if (!roleId) {
      return false;
    }

    // Only roles listed in ADMIN_PANEL_ROLES env var may access management endpoints
    const adminPanelRoles = (process.env.ADMIN_PANEL_ROLES ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (adminPanelRoles.length > 0 && !adminPanelRoles.includes(roleName.toLowerCase())) {
      return false;
    }

    // Load all permissions for this role (needed for both entity-media filtering and resource checks)
    const permissionRows = await (strapi.query("plugin::users-permissions.permission") as any)
      .findMany({ where: { role: roleId } });

    const granted = new Set(
      (permissionRows as Array<{ action: string }>).map((r) => r.action),
    );

    // Store in ctx.state so controllers (e.g. entity-media) can filter results by permission
    policyContext.state.managementUser = { roleType, granted };

    const requestPath = String(policyContext.request.path ?? '');
    const method = String(policyContext.request.method ?? '').toUpperCase();

    // Always-allowed endpoints for any admin-panel-role user (no granular permission needed)
    if (
      requestPath === '/api/management/my-permissions' ||
      requestPath === '/api/management/available-actions' ||
      requestPath === '/api/management/dashboard' ||
      requestPath.startsWith('/api/entity-medias')
    ) {
      return true;
    }

    // Reference data: categories, tags, and users are readable by any valid admin user
    // (needed to assign categories/tags/authors to content regardless of which resources the user manages)
    if (method === 'GET' && (
      requestPath.startsWith('/api/management/categories') ||
      requestPath.startsWith('/api/management/tags') ||
      requestPath.startsWith('/api/management/users')
    )) {
      return true;
    }

    // No management permissions configured → deny all resource endpoints
    if (permissionRows.length === 0) {
      return false;
    }

    // Resolve required action for this request
    const resolved = resolveRequestAction(method, requestPath);

    // Unknown path pattern → deny
    if (!resolved) {
      return false;
    }

    const required = toActionString(resolved.resource, resolved.action);
    return granted.has(required);
  } catch {
    return false;
  }
};
