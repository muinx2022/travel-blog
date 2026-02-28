import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'hotel',
  resourceLabel: 'Hotel',
  serviceId: 'api::hotel.hotel',
});
