import { adminOnly } from '../../helpers/common';

export default [
  { method: 'GET', path: '/management/reports', handler: 'management.listReports', config: adminOnly },
  { method: 'DELETE', path: '/management/reports/:documentId', handler: 'management.deleteReport', config: adminOnly },
];

