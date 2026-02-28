export function getStrapi() {
  const instance = (globalThis as any).strapi;
  if (!instance) {
    throw new Error('Strapi instance is not available');
  }
  return instance;
}

export const adminOnly = {
  auth: false,
  policies: ['global::is-admin-user'],
};

export function readDocumentId(ctx: any): string | null {
  const documentId = String(ctx.params?.documentId ?? '').trim();
  if (!documentId) {
    ctx.badRequest('documentId is required');
    return null;
  }
  return documentId;
}

export function readUserId(ctx: any): number | null {
  const id = Number(ctx.params?.id);
  if (!Number.isFinite(id)) {
    ctx.badRequest('Invalid user id');
    return null;
  }
  return id;
}
