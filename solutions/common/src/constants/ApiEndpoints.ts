

export const SettingsApi = {
  root: 'api/settings',
  theme: 'api/settings/theme',
  version: 'api/settings/version',
  framework: 'api/settings/framework',
  update: 'api/settings/update',
};

export const ExtensionApi = {
  root: 'api/extension',
  init: 'api/extension/init',
  reload: 'api/extension/reload',
  setState: 'api/extension/setState',
  copyToClipboard: 'api/extension/copyToClipboard',
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
  upload: 'api/media/upload',
  createMediaFolder: 'api/media/createMediaFolder',
  runCustomScript: 'api/media/runCustomScript',
  updateMetadata: 'api/media/updateMetadata',
  insertPreviewImage: 'api/media/insertPreviewImage',
  delete: 'api/media/delete',
  refresh: 'api/media/refresh',
};