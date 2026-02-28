import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'post',
  resourceLabel: 'Post',
  serviceId: 'api::post.post',
});
