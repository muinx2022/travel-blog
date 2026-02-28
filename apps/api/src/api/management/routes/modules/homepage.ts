import { adminOnly } from '../../helpers/common';

export default [
  { method: 'GET', path: '/management/homepage', handler: 'management.findHomepage', config: adminOnly },
  { method: 'PUT', path: '/management/homepage', handler: 'management.updateHomepage', config: adminOnly },
];
