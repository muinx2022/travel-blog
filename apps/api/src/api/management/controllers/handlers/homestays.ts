import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'homestay',
  resourceLabel: 'Homestay',
  serviceId: 'api::homestay.homestay',
  pluralName: 'homestays',
});
