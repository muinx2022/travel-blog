import type { Core } from '@strapi/strapi';

type UploadProviderConfig = {
  provider?: string;
  providerOptions?: Record<string, unknown>;
  actionOptions?: Record<string, unknown>;
};

const getUploadProvider = (env: (key: string, defaultValue?: string) => string): UploadProviderConfig => {
  const provider = env('UPLOAD_PROVIDER', 'local');

  if (provider === 'cloudinary') {
    return {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    };
  }

  if (provider === 'aws-s3') {
    return {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
        region: env('AWS_REGION'),
        params: {
          Bucket: env('AWS_BUCKET'),
          ACL: env('AWS_ACL', 'public-read'),
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    };
  }

  return {};
};

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const providerConfig = getUploadProvider(env);

  return {
    upload: {
      config: {
        ...providerConfig,
        security: {
          allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/avif',
            'video/mp4',
            'video/webm',
            'application/pdf',
            'text/plain',
          ],
          deniedTypes: ['text/html', 'application/javascript', 'image/svg+xml'],
        },
        sizeLimit: env.int('UPLOAD_SIZE_LIMIT', 10 * 1024 * 1024),
      },
    },
  };
};

export default config;
