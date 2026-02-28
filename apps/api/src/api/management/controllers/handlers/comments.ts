import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'comment',
  resourceLabel: 'Comment',
  serviceId: 'api::comment.comment',
});
