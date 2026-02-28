import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'contentPage',
  resourceLabel: 'Content Page',
  serviceId: 'api::content-page.content-page',
});
