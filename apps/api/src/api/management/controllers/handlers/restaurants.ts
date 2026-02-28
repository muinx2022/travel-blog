import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'restaurant',
  resourceLabel: 'Restaurant',
  serviceId: 'api::restaurant.restaurant',
});
