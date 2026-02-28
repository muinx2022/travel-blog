import { adminOnly } from '../../helpers/common';

export default [
  { method: 'GET', path: '/management/users', handler: 'management.listUsers', config: adminOnly },
  { method: 'GET', path: '/management/users/:id', handler: 'management.findUser', config: adminOnly },
  { method: 'POST', path: '/management/users', handler: 'management.createUser', config: adminOnly },
  { method: 'PUT', path: '/management/users/:id', handler: 'management.updateUser', config: adminOnly },
  { method: 'DELETE', path: '/management/users/:id', handler: 'management.deleteUser', config: adminOnly },
  { method: 'GET',    path: '/management/roles',                          handler: 'management.listRoles',            config: adminOnly },
  { method: 'POST',   path: '/management/roles',                          handler: 'management.createRole',           config: adminOnly },
  { method: 'PUT',    path: '/management/roles/:id',                      handler: 'management.updateRole',           config: adminOnly },
  { method: 'DELETE', path: '/management/roles/:id',                      handler: 'management.deleteRole',           config: adminOnly },
  { method: 'GET',    path: '/management/available-actions',              handler: 'management.getAvailableActions',  config: adminOnly },
  { method: 'GET',    path: '/management/roles/:roleId/permissions',      handler: 'management.getRolePermissions',   config: adminOnly },
  { method: 'PUT',    path: '/management/roles/:roleId/permissions',      handler: 'management.updateRolePermissions',config: adminOnly },
];
