import { createCrudRoutes } from '../../helpers/crud-factory';
import { adminOnly } from '../../helpers/common';

export default [
  ...createCrudRoutes('category'),
  { method: 'POST', path: '/management/categories/reorder', handler: 'management.reorderCategories', config: adminOnly },
];
