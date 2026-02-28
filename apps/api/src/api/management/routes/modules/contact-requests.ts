import { adminOnly } from '../../helpers/common';

export default [
  { method: 'GET', path: '/management/contact-requests', handler: 'management.listContactRequests', config: adminOnly },
  { method: 'GET', path: '/management/contact-requests/:documentId', handler: 'management.findContactRequest', config: adminOnly },
  { method: 'PUT', path: '/management/contact-requests/:documentId', handler: 'management.updateContactRequest', config: adminOnly },
];

