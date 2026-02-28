import type { Core } from '@strapi/strapi';

type DeleteEvent = {
  params: {
    where?: {
      documentId?: string;
    };
  };
};

export default {
  async beforeDelete(event: DeleteEvent) {
    const documentId = event.params?.where?.documentId;
    if (!documentId) return;

    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;

    try {
      const service = strapi.service('api::entity-media.entity-media') as Core.Service & {
        deleteByEntity: (entityType: string, entityDocumentId: string) => Promise<{ deleted: number }>;
      };

      const result = await service.deleteByEntity('hotel', documentId);
      if (result.deleted > 0) {
        strapi.log.info(`[hotel lifecycle] Deleted ${result.deleted} media for hotel ${documentId}`);
      }
    } catch (error) {
      strapi.log.error(`[hotel lifecycle] Failed to cleanup media for hotel ${documentId}:`, error);
    }
  },
};
