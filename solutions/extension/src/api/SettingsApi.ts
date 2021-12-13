import { ColorThemeKind } from 'vscode';
import { workspace, window } from 'vscode';
import express from "express";
import { Extension, FrameworkDetector } from '../helpers';
import { Folders } from '../commands/Folders';
import { Template } from '../commands/Template';
import { Settings } from '../helpers';
import { ExtensionState, SETTINGS_CONTENT_DRAFT_FIELD, SETTINGS_CONTENT_SORTING, SETTINGS_CONTENT_SORTING_DEFAULT, SETTINGS_CONTENT_STATIC_FOLDER, SETTINGS_DASHBOARD_MEDIA_SNIPPET, SETTINGS_DASHBOARD_OPENONSTART, SETTINGS_FRAMEWORK_ID, SETTINGS_MEDIA_SORTING_DEFAULT, SETTING_CUSTOM_SCRIPTS, SETTING_TAXONOMY_CONTENT_TYPES } from '@frontmatter/common';

import { ContentsViewType, CustomScript, DraftField, ScriptType, SortingSetting, TaxonomyType, SortingOption, Framework } from "@frontmatter/common";
import bodyParser from 'body-parser';

const router = express.Router();

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  next()
});

// define the home page route
router.get('/', async (req, res) => {
  const ext = Extension.getInstance();
  const wsFolder = Folders.getWorkspaceFolder();
  const isInitialized = await Template.isInitialized();
  
  return res.json({
    beta: ext.isBetaVersion(),
    wsFolder: wsFolder ? wsFolder.fsPath : '',
    staticFolder: Settings.get<string>(SETTINGS_CONTENT_STATIC_FOLDER),
    folders: Folders.get(),
    initialized: isInitialized,
    tags: Settings.getTaxonomy(TaxonomyType.Tag),
    categories: Settings.getTaxonomy(TaxonomyType.Category),
    openOnStart: Settings.get(SETTINGS_DASHBOARD_OPENONSTART),
    versionInfo: ext.getVersion(),
    pageViewType: await ext.getState<ContentsViewType | undefined>(ExtensionState.PagesView, "workspace"),
    mediaSnippet: Settings.get<string[]>(SETTINGS_DASHBOARD_MEDIA_SNIPPET) || [],
    contentTypes: Settings.get(SETTING_TAXONOMY_CONTENT_TYPES) || [],
    draftField: Settings.get<DraftField>(SETTINGS_CONTENT_DRAFT_FIELD),
    customSorting: Settings.get<SortingSetting[]>(SETTINGS_CONTENT_SORTING),
    contentFolders: Folders.get(),
    crntFramework: Settings.get<string>(SETTINGS_FRAMEWORK_ID),
    framework: (!isInitialized && wsFolder) ? FrameworkDetector.get(wsFolder.fsPath) : null,
    scripts: (Settings.get<CustomScript[]>(SETTING_CUSTOM_SCRIPTS) || []).filter(s => s.type && s.type !== ScriptType.Content),
    dashboardState: {
      contents: {
        sorting: await ext.getState<SortingOption | undefined>(ExtensionState.Dashboard.Contents.Sorting, "workspace"),
        defaultSorting: Settings.get<string>(SETTINGS_CONTENT_SORTING_DEFAULT)
      },
      media: {
        sorting: await ext.getState<SortingOption | undefined>(ExtensionState.Dashboard.Media.Sorting, "workspace"),
        defaultSorting: Settings.get<string>(SETTINGS_MEDIA_SORTING_DEFAULT)
      }
    }
  });
});

router.get('/theme', async (req, res) => {
  const theme = window.activeColorTheme;
  return res.json({
    isDark: theme.kind === ColorThemeKind.Dark,
  });
});

router.get('/version', async (req, res) => {
  const ext = Extension.getInstance();
  const version = ext.getVersion();

  return res.json(version);
});

/**
 * Set the current site-generator or framework + related settings
 * @param frameworkId 
 */
router.post(`/framework`, bodyParser.json(), async (req, res) => {
  const frameworkId = req.body;
  if (frameworkId) {
    Settings.update(SETTINGS_FRAMEWORK_ID, frameworkId, true);

    if (frameworkId) {
      const allFrameworks = FrameworkDetector.getAll();
      const framework = allFrameworks.find((f: Framework) => f.name === frameworkId);
      if (framework) {
        Settings.update(SETTINGS_CONTENT_STATIC_FOLDER, framework.static, true);
      } else {
        Settings.update(SETTINGS_CONTENT_STATIC_FOLDER, "", true);
      }
    }
  }
});

router.post('/update', bodyParser.json(), async (req, res) => {
  const { name, value } = req.body;

  if (name && value) {
    await Settings.update(name, value);
  }

  return res.sendStatus(200);
});

export default router;