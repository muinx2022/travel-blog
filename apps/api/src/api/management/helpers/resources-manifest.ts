export const MANAGEMENT_RESOURCES: Record<string, string[]> = {
  post:                 ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  category:             ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  tour:                 ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  hotel:                ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  homestay:             ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  restaurant:           ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  souvenirShop:         ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  travelGuide:          ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  contentPage:          ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
  tag:                  ['list', 'find', 'create', 'update', 'delete'],
  comment:              ['list', 'find', 'delete'],
  user:                 ['list', 'find', 'create', 'update', 'delete'],
  report:               ['list', 'find', 'delete'],
  contactRequest:       ['list', 'find', 'delete'],
  contactEmailTemplate: ['list', 'find', 'update'],
  homepage:             ['find', 'update'],
  dashboard:            ['view'],
};

// URL path segment (after /management/) → resource name
export const URL_PATH_TO_RESOURCE: Record<string, string> = {
  posts:                    'post',
  categories:               'category',
  tours:                    'tour',
  hotels:                   'hotel',
  homestays:                'homestay',
  restaurants:              'restaurant',
  'souvenir-shops':         'souvenirShop',
  'travel-guides':          'travelGuide',
  'content-pages':          'contentPage',
  tags:                     'tag',
  comments:                 'comment',
  users:                    'user',
  roles:                    'user',  // role management is under user permission
  reports:                  'report',
  'contact-requests':       'contactRequest',
  'contact-email-template': 'contactEmailTemplate',
  homepage:                 'homepage',
  dashboard:                'dashboard',
};

export function toActionString(resource: string, action: string): string {
  return `api::management.${resource}.${action}`;
}

export function getFullActionList(): Array<{ resource: string; action: string; actionString: string }> {
  return Object.entries(MANAGEMENT_RESOURCES).flatMap(([resource, actions]) =>
    actions.map((action) => ({ resource, action, actionString: toActionString(resource, action) })),
  );
}
