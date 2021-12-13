import express from "express";
import { Folders } from "../commands/Folders";
import { COMMAND_NAME, DefaultFields } from '../constants';
import { DateHelper, Page, SETTINGS_CONTENT_STATIC_FOLDER, SETTING_DATE_FIELD, SETTING_SEO_DESCRIPTION_FIELD } from '@frontmatter/common';
import { ArticleHelper, ContentType, Extension, LocalServer, Notifications, openFileInEditor } from '../helpers';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { commands } from 'vscode';
import { Settings } from '../helpers/SettingsHelper';
import bodyParser from "body-parser";

const router = express.Router();

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  next()
});

// define the home page route
router.get('/', async (req, res) => {
  const pages = await getPages();
  return res.json(pages);
});

router.get('/create', async (req, res) => {
  await commands.executeCommand(COMMAND_NAME.createContent);
  return res.sendStatus(200);
});

router.get('/createByContentType', async (req, res) => {
  await commands.executeCommand(COMMAND_NAME.createByContentType);
  return res.sendStatus(200);
});

router.get('/createByTemplate', async (req, res) => {
  await commands.executeCommand(COMMAND_NAME.createByTemplate);
  return res.sendStatus(200);
});

router.post('/open', bodyParser.json(), async (req, res) => {
  const data = req.body;

  if (data.path) {
    openFileInEditor(data.path);
    return res.sendStatus(200);
  }
  
  return res.sendStatus(404);
});


/**
 * Retrieve all the markdown pages
 */
const getPages = async () => {
  const wsFolder = Folders.getWorkspaceFolder();
  const isProduction = Extension.getInstance().isProductionMode;
  const imgSrcUrl = isProduction ? `http://localhost:${LocalServer.sitePort}` : `http://localhost:${process.env.API_DEV_PORT || "3001"}`;

  const descriptionField = Settings.get(SETTING_SEO_DESCRIPTION_FIELD) as string || DefaultFields.Description;
  const dateField = Settings.get(SETTING_DATE_FIELD) as string || DefaultFields.PublishingDate;
  const staticFolder = Settings.get<string>(SETTINGS_CONTENT_STATIC_FOLDER);

  const folderInfo = await Folders.getInfo();
  const pages: Page[] = [];

  if (folderInfo) {
    for (const folder of folderInfo) {
      for (const file of folder.lastModified) {
        if (file.fileName.endsWith(`.md`) || file.fileName.endsWith(`.markdown`) || file.fileName.endsWith(`.mdx`)) {
          try {
            const article = ArticleHelper.getFrontMatterByPath(file.filePath);

            if (article?.data.title) {
              const page: Page = {
                ...article.data,
                // FrontMatter properties
                fmFolder: folder.title,
                fmModified: file.mtime,
                fmFilePath: file.filePath,
                fmFileName: file.fileName,
                fmDraft: ContentType.getDraftStatus(article?.data),
                fmYear: article?.data[dateField] ? DateHelper.tryParse(article?.data[dateField])?.getFullYear() : null,
                // Make sure these are always set
                title: article?.data.title,
                slug: article?.data.slug,
                date: article?.data[dateField] || "",
                draft: article?.data.draft,
                description: article?.data[descriptionField] || "",
              };

              const contentType = ArticleHelper.getContentType(article.data);
              const previewField = contentType.fields.find(field => field.isPreviewImage && field.type === "image")?.name || "preview";

              if (article?.data[previewField] && wsFolder) {
                let fieldValue = article?.data[previewField];
                if (fieldValue && Array.isArray(fieldValue)) {
                  if (fieldValue.length > 0) {
                    fieldValue = fieldValue[0];
                  } else {
                    fieldValue = undefined;
                  }
                }

                // Revalidate as the array could have been empty
                if (fieldValue) {
                  const staticPath = join(wsFolder.fsPath, staticFolder || "", fieldValue);
                  const contentFolderPath = join(dirname(file.filePath), fieldValue);

                  let previewUri = null;
                  if (existsSync(staticPath)) {
                    previewUri = staticPath.replace(wsFolder.fsPath, "");
                  } else if (existsSync(contentFolderPath)) {
                    previewUri = contentFolderPath.replace(wsFolder.fsPath, "");
                  }

                  if (previewUri) {
                    page[previewField] = `${imgSrcUrl}${previewUri}`;
                  } else {
                    page[previewField] = "";
                  }
                }
              }
    
              pages.push(page);
            }
          } catch (error: any) {
            Notifications.error(`File error: ${file.filePath} - ${error?.message || error}`);
          }
        }
      }
    }
  }

  return pages;
}

export default router;