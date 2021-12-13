import express from "express";

const router = express.Router();

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  next()
});

// define the home page route
router.get('/', function (req, res) {
  return res.send('Hello from pages API!');
});

export default router;