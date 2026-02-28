import { createCrudHandlers } from '../../helpers/crud-factory';
import { getStrapi } from '../../helpers/common';

const crudHandlers = createCrudHandlers({
  resourceName: 'category',
  resourceLabel: 'Category',
  serviceId: 'api::category.category',
});

export default {
  ...crudHandlers,

  async reorderCategories(ctx: any) {
    const service = getStrapi().service('api::category.category') as any;
    const rawDraggedId = ctx.request.body?.draggedId;
    const rawTargetId = ctx.request.body?.targetId;
    const draggedId = Number(rawDraggedId);
    const hasTargetId = !(rawTargetId === null || rawTargetId === undefined || rawTargetId === '');
    const targetId = hasTargetId ? Number(rawTargetId) : null;
    const position = String(ctx.request.body?.position ?? '');

    if (!Number.isFinite(draggedId)) {
      return ctx.badRequest('draggedId is required');
    }

    if (!['child', 'after', 'root'].includes(position)) {
      return ctx.badRequest("position must be 'child', 'after' or 'root'");
    }

    if (position !== 'root' && !Number.isFinite(targetId as number)) {
      return ctx.badRequest('targetId is required for child/after');
    }

    if (Number.isFinite(targetId as number) && draggedId === targetId) {
      return ctx.badRequest('draggedId cannot equal targetId');
    }

    try {
      ctx.body = await service.reorderForAdmin(
        draggedId,
        Number.isFinite(targetId as number) ? (targetId as number) : null,
        position as 'child' | 'after' | 'root',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reorder category';
      if (message === 'Category not found') {
        return ctx.notFound(message);
      }
      throw error;
    }
  },
};
