import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'travelGuide',
  pluralName: 'travelGuides',
  resourceLabel: 'Travel guide',
  serviceId: 'api::travel-guide.travel-guide',
});
