import type { Core } from '@strapi/strapi';
import { seedInitialData, seedCategories } from './bootstrap';

// Windows-specific: Ignore temp file cleanup errors from formidable
if (process.platform === 'win32') {
  process.on('unhandledRejection', (reason: unknown) => {
    const err = reason as { code?: string; syscall?: string; path?: string };
    if (err?.code === 'EPERM' && err?.syscall === 'unlink' && err?.path?.includes('strapi-upload-tmp')) {
      console.warn('[Windows] Ignored formidable temp-file cleanup error (non-fatal)');
      return;
    }
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
}

async function hardenUploadSettingsForWindows(strapi: Core.Strapi) {
  if (process.platform !== 'win32') {
    return;
  }

  try {
    const settingsStore = strapi.store({
      type: 'plugin',
      name: 'upload',
      key: 'settings',
    });

    const current = ((await settingsStore.get({})) ?? {}) as {
      sizeOptimization?: boolean;
      responsiveDimensions?: boolean;
      autoOrientation?: boolean;
      aiMetadata?: boolean;
    };

    const next = {
      ...current,
      // Avoid Windows temp-file lock issues during local image optimization.
      sizeOptimization: false,
      responsiveDimensions: false,
      autoOrientation: false,
    };

    const changed =
      current.sizeOptimization !== next.sizeOptimization ||
      current.responsiveDimensions !== next.responsiveDimensions ||
      current.autoOrientation !== next.autoOrientation;

    if (changed) {
      await settingsStore.set({ value: next });
      console.log('[bootstrap] Disabled upload optimization/responsive dimensions on Windows.');
    }
  } catch (error) {
    console.error('[bootstrap] Failed to harden upload settings for Windows:', error);
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await hardenUploadSettingsForWindows(strapi);

    try {
      const roleQuery = strapi.query('plugin::users-permissions.role');
      const permissionQuery = strapi.query('plugin::users-permissions.permission');
      const grantMissingPermissions = async (roleType: 'public' | 'authenticated', permissions: string[]) => {
        const role = await roleQuery.findOne({ where: { type: roleType } });
        if (!role?.id) return;

        const existingPermissions = await permissionQuery.findMany({
          where: { role: { id: role.id } },
        });
        const existingActionNames = existingPermissions.map((p) => p.action);
        const permissionsToAdd = permissions.filter((action) => !existingActionNames.includes(action));

        for (const action of permissionsToAdd) {
          await permissionQuery.create({
            data: {
              action,
              role: role.id,
            },
          });
        }

        if (permissionsToAdd.length > 0) {
          console.log(`[bootstrap] Granted ${permissionsToAdd.length} permissions for ${roleType} role.`);
        }
      };

      const sharedReadPermissions = [
        'api::post.post.find',
        'api::post.post.findOne',
        'api::category.category.find',
        'api::category.category.findOne',
        'api::tag.tag.find',
        'api::tag.tag.findOne',
        'api::comment.comment.find',
        'api::comment.comment.findOne',
        'api::tour.tour.find',
        'api::tour.tour.findOne',
        'api::hotel.hotel.find',
        'api::hotel.hotel.findOne',
        'api::homestay.homestay.find',
        'api::homestay.homestay.findOne',
        'api::restaurant.restaurant.find',
        'api::restaurant.restaurant.findOne',
        'api::souvenir-shop.souvenir-shop.find',
        'api::souvenir-shop.souvenir-shop.findOne',
        'api::travel-guide.travel-guide.find',
        'api::travel-guide.travel-guide.findOne',
        'api::entity-media.entity-media.find',
      ];

      await grantMissingPermissions('public', [
        ...sharedReadPermissions,
        'api::comment.comment.create',
      ]);
      await grantMissingPermissions('authenticated', [
        ...sharedReadPermissions,
        'api::comment.comment.create',
      ]);
    } catch (error) {
      console.error('Error bootstrapping public permissions:', error);
    }

    try {
      // Recover a usable users-permissions admin account if data was corrupted.
      const roleQuery = strapi.query('plugin::users-permissions.role');
      let adminRole = await roleQuery.findOne({
        where: {
          $or: [{ type: 'admin' }, { name: 'Admin' }],
        },
      });

      if (!adminRole?.id) {
        console.warn('[bootstrap] Admin role not found, creating one...');
        // Create the Admin role
        adminRole = await roleQuery.create({
          data: {
            name: 'Admin',
            type: 'admin',
            description: 'Admin users with full access',
          },
        });
        console.log('[bootstrap] Created users-permissions Admin role.');
      }

      if (!adminRole?.id) {
        console.error('[bootstrap] Failed to create or find Admin role.');
        return;
      }

      const identifier = String(process.env.UP_ADMIN_IDENTIFIER ?? 'admin').trim();
      const email = String(process.env.UP_ADMIN_EMAIL ?? 'admin@example.com').trim().toLowerCase();
      const password = String(process.env.UP_ADMIN_PASSWORD ?? 'admin123').trim();

      const users = (await strapi.query('plugin::users-permissions.user').findMany({
        where: {
          $or: [{ email }, { username: identifier }],
        },
        populate: ['role'],
      })) as Array<{ id: number; password?: string | null }>;

      const userService = strapi.plugin('users-permissions').service('user');
      const target = users[0];

      if (target?.id) {
        await userService.edit(target.id, {
          username: identifier,
          email,
          password,
          provider: 'local',
          confirmed: true,
          blocked: false,
          role: adminRole.id,
        });
        console.log('[bootstrap] Synced users-permissions admin user credentials.');
      } else {
        await userService.add({
          username: identifier,
          email,
          password,
          provider: 'local',
          confirmed: true,
          blocked: false,
          role: adminRole.id,
        });
        console.log('[bootstrap] Created users-permissions admin user.');
      }
    } catch (error) {
      console.error('Error bootstrapping users-permissions admin account:', error);
    }

    try {
      // Ensure at least one valid authenticated user for web login.
      const roleQuery = strapi.query('plugin::users-permissions.role');
      const authenticatedRole = await roleQuery.findOne({
        where: {
          $or: [{ type: 'authenticated' }, { name: 'Authenticated' }],
        },
      });

      if (!authenticatedRole?.id) {
        console.warn('[bootstrap] Cannot find users-permissions Authenticated role.');
        return;
      }

      const identifier = String(process.env.UP_WEB_IDENTIFIER ?? 'demo').trim();
      const email = String(process.env.UP_WEB_EMAIL ?? 'demo@example.com').trim().toLowerCase();
      const password = String(process.env.UP_WEB_PASSWORD ?? 'demo123').trim();

      const users = (await strapi.query('plugin::users-permissions.user').findMany({
        where: {
          $or: [{ email }, { username: identifier }],
        },
      })) as Array<{ id: number }>;

      const userService = strapi.plugin('users-permissions').service('user');
      const target = users[0];

      if (target?.id) {
        await userService.edit(target.id, {
          username: identifier,
          email,
          password,
          provider: 'local',
          confirmed: true,
          blocked: false,
          role: authenticatedRole.id,
        });
        console.log('[bootstrap] Synced users-permissions demo web user credentials.');
      } else {
        await userService.add({
          username: identifier,
          email,
          password,
          provider: 'local',
          confirmed: true,
          blocked: false,
          role: authenticatedRole.id,
        });
        console.log('[bootstrap] Created users-permissions demo web user.');
      }
    } catch (error) {
      console.error('Error bootstrapping users-permissions demo web user:', error);
    }

    // Seed initial data if enabled
    await seedInitialData(strapi);
    await seedCategories(strapi);
  },
};
