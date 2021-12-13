import bodyParser from "body-parser";
import express from "express";
import { commands, env } from "vscode";
import { Dashboard } from "../commands/Dashboard";
import { COMMAND_NAME } from "../constants";
import { Extension } from "../helpers";

const router = express.Router();

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  next()
});

// define the home page route
router.get('/', async (req, res) => {
  return res.send('Hello from pages API!');
});

router.get('init', async (req, res) => {
  await commands.executeCommand(COMMAND_NAME.init);
  return res.send('Init done!');
});

router.get('reload', async (req, res) => {
  Dashboard.reload();
  return res.send('Reload done!');
});

router.post('setState', bodyParser.json(), async (req, res) => {
  const { key, value } = req.body;
  if (key && value) {
    Extension.getInstance().setState(key, value, "workspace");
  }
  
  return res.sendStatus(200);
});

router.post('copyToClipboard', bodyParser.json(), async (req, res) => {
  const { data } = req.body;
  
  if (data) {
    env.clipboard.writeText(data);
  }
  
  return res.sendStatus(200);
});

export default router;