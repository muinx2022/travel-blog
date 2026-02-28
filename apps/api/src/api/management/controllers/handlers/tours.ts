import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'tour',
  resourceLabel: 'Tour',
  serviceId: 'api::tour.tour',
});
