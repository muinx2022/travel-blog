import { factories } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';
import crypto from 'node:crypto';
import path from 'node:path';

// Maps manifest resource name → entityType value stored in entity-media records
const RESOURCE_TO_ENTITY_TYPE: Record<string, string> = {
  post:         'post',
  hotel:        'hotel',
  tour:         'tour',
  homestay:     'homestay',
  restaurant:   'restaurant',
  souvenirShop: 'souvenir-shop',
  travelGuide:  'travel-guide',
  contentPage:  'content-page',
};

type UploadedFile = {
  id: number;
  documentId?: string;
  url: string;
  name: string;
  mime: string;
  size: number;
};

function toDateFolder(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function toTimestamp(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}${ms}`;
}

function slugifyText(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function resolveEntityFolder(entityType: string): string {
  const map: Record<string, string> = {
    hotel: 'hotels',
    tour: 'tours',
    restaurant: 'restaurants',
    homestay: 'homestays',
    post: 'posts',
    'travel-guide': 'travel-guides',
    'souvenir-shop': 'souvenir-shops',
  };

  return map[entityType] || slugifyText(entityType) || 'others';
}

function buildUploadFileName(entityType: string, originalName: string, index: number): string {
  const ext = path.extname(originalName || '').toLowerCase();
  const basename = path.basename(originalName || 'image', ext);
  const safeBase = slugifyText(basename) || 'image';
  const safeEntity = slugifyText(entityType) || 'media';
  const now = new Date();
  const timestamp = toTimestamp(now);
  const md5Part = crypto
    .createHash('md5')
    .update(`${timestamp}-${index}`)
    .digest('hex')
    .slice(0, 12);

  return `${safeEntity}-${md5Part}-${safeBase}${ext}`;
}

type AuthenticatedUser = { id: number; role?: { type?: string } };

async function resolveUser(ctx: any, strapi: any): Promise<AuthenticatedUser | null> {
  // With auth: false routes, ctx.state.user is not set by Strapi middleware
  // so we manually verify the JWT from the Authorization header
  if (ctx.state.user) {
    return ctx.state.user as AuthenticatedUser;
  }

  const authHeader = String(ctx.request.header?.authorization ?? '');
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const jwtService = strapi.plugin('users-permissions').service('jwt');
    const payload = (await jwtService.verify(token)) as { id?: number };
    if (!payload?.id) return null;

    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { id: payload.id }, populate: { role: true } });

    return user ?? null;
  } catch {
    return null;
  }
}

export default factories.createCoreController('api::entity-media.entity-media', ({ strapi }) => ({
  async find(ctx) {
    const queryFilters = (ctx.query.filters || {}) as Record<string, unknown>;
    const entityTypeFilter = queryFilters.entityType as { $eq?: string } | string | undefined;
    const entityDocumentIdFilter = queryFilters.entityDocumentId as { $eq?: string } | string | undefined;
    const mediaCategoryFilter = queryFilters.mediaCategory as { $eq?: string } | string | undefined;

    const entityType =
      typeof entityTypeFilter === 'string' ? entityTypeFilter : entityTypeFilter?.$eq;
    const entityDocumentId =
      typeof entityDocumentIdFilter === 'string' ? entityDocumentIdFilter : entityDocumentIdFilter?.$eq;
    const mediaCategory =
      typeof mediaCategoryFilter === 'string' ? mediaCategoryFilter : mediaCategoryFilter?.$eq;

    // Check authentication - support both regular users and admin users
    const regularUser = await resolveUser(ctx, strapi);
    const mgmtUser = ctx.state.managementUser as { roleType: string; granted: Set<string> | null } | undefined;

    // Allow unauthenticated reads when scoped to a specific entity (public gallery access)
    const isPublicScopedRead = !!(entityType && entityDocumentId);
    if (!regularUser && !mgmtUser && !isPublicScopedRead) {
      return ctx.unauthorized('Authentication required');
    }

    // Apply permission-based entity type scoping for admin users only
    if (mgmtUser && mgmtUser.roleType !== 'admin' && mgmtUser.granted) {
      const allowedEntityTypes = Object.entries(RESOURCE_TO_ENTITY_TYPE)
        .filter(([resource]) => (mgmtUser.granted as Set<string>).has(`api::management.${resource}.list`))
        .map(([, et]) => et);

      // If no entityType filter is set, restrict to all permitted entity types
      if (!entityType) {
        if (allowedEntityTypes.length === 0) {
          return { data: [] };
        }
        queryFilters.entityType = { $in: allowedEntityTypes };
      } else {
        // If a specific entityType was requested, ensure the user has access to it
        if (!allowedEntityTypes.includes(entityType)) {
          return { data: [] };
        }
      }
    }

    // For regular users, no additional scoping needed - they can access their own media


    // Scoped fetch for entity-specific media manager (requires both keys).
    if (!entityType || !entityDocumentId) {
      const data = await strapi.documents('api::entity-media.entity-media').findMany({
        filters: queryFilters,
        sort: ctx.query.sort || [{ createdAt: 'desc' }],
        pagination: (ctx.query.pagination || {}) as Record<string, unknown>,
        populate: ['file', 'author'],
      });
      return { data };
    }

    const extraFilters: Record<string, unknown> = {};
    if (mediaCategory) {
      extraFilters.mediaCategory = mediaCategory;
    }

    const service = strapi.service('api::entity-media.entity-media') as Core.Service & {
      findByEntity: (entityType: string, entityDocumentId: string, filters: Record<string, unknown>) => Promise<unknown[]>;
    };

    const data = await service.findByEntity(
      String(entityType),
      String(entityDocumentId),
      extraFilters
    );

    return { data };
  },

  async upload(ctx) {
    const { entityType, entityDocumentId, mediaCategory, caption, altText, sortOrder } = ctx.request.body || {};

    if (!entityType || !entityDocumentId) {
      return ctx.badRequest('entityType and entityDocumentId are required');
    }

    const files = ctx.request.files?.file || ctx.request.files?.files;
    if (!files) {
      return ctx.badRequest('No file uploaded');
    }

    const fileArray = Array.isArray(files) ? files : [files];
    const results: unknown[] = [];

    const user = await resolveUser(ctx, strapi);
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const rawFile = file as { originalFilename?: string; name?: string };
      const entityTypeStr = String(entityType);
      const folder = resolveEntityFolder(entityTypeStr);
      const dayFolder = toDateFolder(new Date());
      const originalFilename = String(rawFile.originalFilename || rawFile.name || `image-${i + 1}`);
      const uploadFileName = buildUploadFileName(entityTypeStr, originalFilename, i);

      let uploadedFiles: UploadedFile[];
      try {
        uploadedFiles = await strapi.plugins.upload.services.upload.upload({
          data: {
            path: `${folder}/${dayFolder}`,
            fileInfo: {
              name: uploadFileName,
            },
          },
          files: file,
        }) as UploadedFile[];
      } catch (uploadErr: unknown) {
        const errObj = uploadErr as { code?: string };
        if (errObj?.code === 'EPERM') {
          strapi.log.warn('[entity-media upload] Windows temp file cleanup failed (non-fatal)');
          continue;
        }
        throw uploadErr;
      }

      // On Windows the upload may succeed but the temp-file unlink fires
      // asynchronously and crashes the process. Swallow that here.
      const uploadedFile = uploadedFiles[0];
      if (!uploadedFile) continue;

      const entityMedia = await strapi.documents('api::entity-media.entity-media').create({
        data: {
          file: uploadedFile.id,
          entityType: String(entityType),
          entityDocumentId: String(entityDocumentId),
          mediaCategory: mediaCategory || 'gallery',
          caption: Array.isArray(caption) ? caption[i] : caption,
          altText: Array.isArray(altText) ? altText[i] : altText,
          sortOrder: sortOrder ? Number(sortOrder) + i : i,
          author: user?.id,
        },
        populate: ['file', 'author'],
      });

      results.push(entityMedia);
    }

    return { data: results };
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { caption, altText, sortOrder, mediaCategory } = ctx.request.body?.data || ctx.request.body || {};

    const existing = await strapi.documents('api::entity-media.entity-media').findOne({
      documentId: id,
      populate: ['author'],
    });

    if (!existing) {
      return ctx.notFound('Entity media not found');
    }

    const user = await resolveUser(ctx, strapi);
    if (!user) return ctx.unauthorized('Authentication required');
    const isAdmin = user?.role?.type === 'admin';
    const isOwner = existing.author?.id === user?.id;

    if (!isAdmin && !isOwner) {
      return ctx.forbidden('You can only update your own media');
    }

    const updateData: Record<string, unknown> = {};
    if (caption !== undefined) updateData.caption = caption;
    if (altText !== undefined) updateData.altText = altText;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (mediaCategory !== undefined) updateData.mediaCategory = mediaCategory;

    const updated = await strapi.documents('api::entity-media.entity-media').update({
      documentId: id,
      data: updateData,
      populate: ['file', 'author'],
    });

    return { data: updated };
  },

  async delete(ctx) {
    const { id } = ctx.params;

    const existing = await strapi.documents('api::entity-media.entity-media').findOne({
      documentId: id,
      populate: ['file', 'author'],
    });

    if (!existing) {
      return ctx.notFound('Entity media not found');
    }

    const user = await resolveUser(ctx, strapi);
    if (!user) return ctx.unauthorized('Authentication required');
    const isAdmin = user?.role?.type === 'admin';
    const isOwner = existing.author?.id === user?.id;

    if (!isAdmin && !isOwner) {
      return ctx.forbidden('You can only delete your own media');
    }

    if (existing.file?.id) {
      try {
        await strapi.plugins.upload.services.upload.remove(existing.file);
      } catch {
        strapi.log.warn(`Failed to delete file for entity-media ${id}`);
      }
    }

    await strapi.documents('api::entity-media.entity-media').delete({
      documentId: id,
    });

    return { data: { documentId: id, deleted: true } };
  },

  async reorder(ctx) {
    const { items } = ctx.request.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('items array is required');
    }

    const service = strapi.service('api::entity-media.entity-media') as Core.Service & {
      reorder: (items: Array<{ documentId: string; sortOrder: number }>) => Promise<{ updated: string[] }>;
    };

    const result = await service.reorder(items);
    return { data: result };
  },

  async bulkUpdate(ctx) {
    const { pendingId, newDocumentId, authorId } = ctx.request.body || {};

    if (!pendingId || !newDocumentId) {
      return ctx.badRequest('pendingId and newDocumentId are required');
    }

    const service = strapi.service('api::entity-media.entity-media') as Core.Service & {
      bulkUpdateEntityDocumentId: (pendingId: string, newDocumentId: string, authorId?: number) => Promise<{ updated: string[] }>;
    };

    const result = await service.bulkUpdateEntityDocumentId(
      String(pendingId),
      String(newDocumentId),
      authorId ? Number(authorId) : undefined
    );

    return { data: result };
  },
}));
