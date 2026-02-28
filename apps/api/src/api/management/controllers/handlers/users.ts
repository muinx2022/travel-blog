import { getStrapi, readUserId } from '../../helpers/common';

export default {
  async listUsers(ctx: any) {
    const page = Math.max(1, Number(ctx.query?.page ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(ctx.query?.pageSize ?? 10) || 10));
    const q = String(ctx.query?.q ?? '').trim();

    const service = getStrapi().service('api::management.management') as any;
    ctx.body = await service.listUsers(page, pageSize, q);
  },

  async findUser(ctx: any) {
    const id = readUserId(ctx);
    if (!id) return;

    const service = getStrapi().service('api::management.management') as any;
    const user = await service.findUser(id);

    if (!user) {
      return ctx.notFound('User not found');
    }

    ctx.body = { data: user };
  },

  async listRoles(ctx: any) {
    const service = getStrapi().service('api::management.management') as any;
    const roles = await service.listRoles();
    ctx.body = { data: roles };
  },

  async createRole(ctx: any) {
    const service = getStrapi().service('api::management.management') as any;
    try {
      const role = await service.createRole(ctx.request.body?.data ?? {});
      ctx.body = { data: role };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create role';
      if (message === 'name is required') return ctx.badRequest(message);
      throw error;
    }
  },

  async updateRole(ctx: any) {
    const id = Number(ctx.params?.id);
    if (!id) return ctx.badRequest('Invalid id');
    const service = getStrapi().service('api::management.management') as any;
    const role = await service.updateRole(id, ctx.request.body?.data ?? {});
    ctx.body = { data: role };
  },

  async deleteRole(ctx: any) {
    const id = Number(ctx.params?.id);
    if (!id) return ctx.badRequest('Invalid id');
    const service = getStrapi().service('api::management.management') as any;
    const data = await service.deleteRole(id);
    ctx.body = { data };
  },

  async createUser(ctx: any) {
    const service = getStrapi().service('api::management.management') as any;

    try {
      const user = await service.createUser(ctx.request.body?.data ?? {});
      ctx.body = { data: user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      if (message === 'username, email and password are required') {
        return ctx.badRequest(message);
      }
      throw error;
    }
  },

  async updateUser(ctx: any) {
    const id = readUserId(ctx);
    if (!id) return;

    const service = getStrapi().service('api::management.management') as any;
    const user = await service.updateUser(id, ctx.request.body?.data ?? {});
    ctx.body = { data: user };
  },

  async deleteUser(ctx: any) {
    const id = readUserId(ctx);
    if (!id) return;

    const service = getStrapi().service('api::management.management') as any;
    const data = await service.removeUser(id);
    ctx.body = { data };
  },

  async getAvailableActions(ctx: any) {
    const service = getStrapi().service('api::management.management') as any;
    ctx.body = { data: service.getAvailableActions() };
  },

  async getRolePermissions(ctx: any) {
    const roleId = Number(ctx.params?.roleId);
    if (!roleId) return ctx.badRequest('Invalid roleId');

    const service = getStrapi().service('api::management.management') as any;
    const permissions = await service.getRolePermissions(roleId);
    ctx.body = { data: permissions };
  },

  async updateRolePermissions(ctx: any) {
    const roleId = Number(ctx.params?.roleId);
    if (!roleId) return ctx.badRequest('Invalid roleId');

    const permissionMap = ctx.request.body?.data;
    if (!permissionMap || typeof permissionMap !== 'object') {
      return ctx.badRequest('data must be a permissions map');
    }

    const service = getStrapi().service('api::management.management') as any;
    await service.setRolePermissions(roleId, permissionMap);
    ctx.body = { data: { ok: true } };
  },
};
