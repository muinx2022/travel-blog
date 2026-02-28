import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::entity-media.entity-media', ({ strapi }) => ({
  async findByEntity(entityType: string, entityDocumentId: string, filters: Record<string, unknown> = {}) {
    return strapi.documents('api::entity-media.entity-media').findMany({
      filters: {
        entityType,
        entityDocumentId,
        ...filters,
      },
      sort: [{ sortOrder: 'asc' }],
      populate: ['file', 'author'],
    });
  },

  async deleteByEntity(entityType: string, entityDocumentId: string) {
    const medias = await strapi.documents('api::entity-media.entity-media').findMany({
      filters: { entityType, entityDocumentId },
      populate: ['file'],
    });

    for (const media of medias) {
      if (media.file?.id) {
        try {
          await strapi.plugins.upload.services.upload.remove(media.file);
        } catch {
          strapi.log.warn(`Failed to delete file for entity-media ${media.documentId}`);
        }
      }
      await strapi.documents('api::entity-media.entity-media').delete({
        documentId: media.documentId,
      });
    }

    return { deleted: medias.length };
  },

  async bulkUpdateEntityDocumentId(pendingId: string, newDocumentId: string, authorId?: number) {
    const medias = await strapi.documents('api::entity-media.entity-media').findMany({
      filters: { entityDocumentId: pendingId },
    });

    const updated: string[] = [];
    for (const media of medias) {
      const updateData: Record<string, unknown> = { entityDocumentId: newDocumentId };
      if (authorId) {
        updateData.author = authorId;
      }
      await strapi.documents('api::entity-media.entity-media').update({
        documentId: media.documentId,
        data: updateData,
      });
      updated.push(media.documentId);
    }

    return { updated };
  },

  async reorder(items: Array<{ documentId: string; sortOrder: number }>) {
    const updated: string[] = [];
    for (const item of items) {
      await strapi.documents('api::entity-media.entity-media').update({
        documentId: item.documentId,
        data: { sortOrder: item.sortOrder },
      });
      updated.push(item.documentId);
    }
    return { updated };
  },
}));
