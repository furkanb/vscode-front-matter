import bodyParser from "body-parser";
import express from "express";
import { unlinkSync } from "fs";
import { basename } from "path";
import { commands } from "vscode";
import { COMMAND_NAME } from "../constants";
import { CustomScript, MediaLibrary, Notifications } from "../helpers";
import { MediaHelpers } from "../helpers/MediaHelpers";

const router = express.Router();

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  next()
});

// define the home page route
router.get('/', async (req, res) => {
  const mediaFiles = await MediaHelpers.getFiles();
  return res.json(mediaFiles);
});

router.post('/', bodyParser.json(), async (req, res) => {
  const { page, folder, sorting } = req.body;
  const mediaFiles = await MediaHelpers.getFiles(page, folder, sorting);
  return res.json(mediaFiles);
});

router.post('/upload', bodyParser.json({ limit: '15mb' }), async (req, res) => {
  const data = req.body;
  await MediaHelpers.addFile(data);
  return res.sendStatus(201)
});

router.post('/refresh', bodyParser.json(), async (req, res) => {
  const { folder } = req.body;
  MediaHelpers.resetMedia();
  const mediaFiles = await MediaHelpers.getFiles(0, folder);
  return res.json(mediaFiles);
});

router.post('/createMediaFolder', bodyParser.json(), async (req, res) => {
  const { path } = req.body;

  if (path) {
    await commands.executeCommand(COMMAND_NAME.createFolder, { selectedFolder: path });
  }

  return res.sendStatus(200);
});

router.post('/runCustomScript', bodyParser.json(), async (req, res) => {
  const { script, path } = req.body;

  if (script && path) {
    CustomScript.run(script, path);
  }

  return res.sendStatus(200);
});

router.post('/updateMetadata', bodyParser.json(), async (req, res) => {
  const { file, filename, page, folder, ...metadata }: { file:string; filename:string; page: number; folder: string | null; metadata: any; } = req.body;

  if (file && metadata) {
    const lib = MediaLibrary.getInstance();
    lib.set(file, metadata);
  
    // Check if filename needs to be updated
    lib.updateFilename(file, filename);
  
    const mediaFiles = await MediaHelpers.getFiles(page || 0, folder || "");
    if (mediaFiles) {
      return res.json(mediaFiles);
    }
  }

  return res.json(null);
});

router.post('/insertPreviewImage', bodyParser.json(), async (req, res) => {
  const data = req.body;

  if (data) {
    MediaHelpers.insert(data);
  }

  return res.sendStatus(200);
});

router.post('/delete', bodyParser.json(), async (req, res) => {
  const { file, page, folder }: { file: string; page: number; folder: string | null; } = req.body;

  if (!file) {
    return;
  }

  try {
    unlinkSync(file);

    MediaHelpers.resetMedia();
    MediaHelpers.getFiles(page || 0, folder || "");
  } catch(err) {
    Notifications.error(`Something went wrong deleting ${basename(file)}`);
  }

  return res.sendStatus(200);
});

export default router;