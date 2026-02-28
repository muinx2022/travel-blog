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

      const result = await service.deleteByEntity('tour', documentId);
      if (result.deleted > 0) {
        strapi.log.info(`[tour lifecycle] Deleted ${result.deleted} media for tour ${documentId}`);
      }
    } catch (error) {
      strapi.log.error(`[tour lifecycle] Failed to cleanup media for tour ${documentId}:`, error);
    }
  },
};
