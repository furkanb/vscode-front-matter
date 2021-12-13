

export const SettingsApi = {
  root: 'api/settings',
  theme: 'api/settings/theme',
  version: 'api/settings/version',
  framework: 'api/settings/framework',
  update: 'api/settings/update',
};

export const ExtensionApi = {
  root: 'api/extensions',
  init: 'api/extensions/init',
  reload: 'api/extensions/reload',
  setState: 'api/extensions/setState',
  copyToClipboard: 'api/extensions/copyToClipboard',
};

export const PagesApi = {
  root: 'api/pages',
  open: 'api/pages/open',
  create: 'api/pages/create',
  createByContentType: 'api/pages/createByContentType',
  createByTemplate: 'api/pages/createByTemplate',
};

export const MediaApi = {
  root: 'api/media',
  createMediaFolder: 'api/media/createMediaFolder',
  runCustomScript: 'api/media/runCustomScript',
  updateMetadata: 'api/media/updateMetadata',
  insertPreviewImage: 'api/media/insertPreviewImage',
  delete: 'api/media/delete',
  refresh: 'api/media/refresh',
};