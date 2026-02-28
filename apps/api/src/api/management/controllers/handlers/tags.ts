import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'tag',
  resourceLabel: 'Tag',
  serviceId: 'api::tag.tag',
});
