import { adminOnly } from '../../helpers/common';

export default [
  {
    method: 'GET',
    path: '/management/contact-email-template',
    handler: 'management.findContactEmailTemplate',
    config: adminOnly,
  },
  {
    method: 'PUT',
    path: '/management/contact-email-template',
    handler: 'management.updateContactEmailTemplate',
    config: adminOnly,
  },
];

