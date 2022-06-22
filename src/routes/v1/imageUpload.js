const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const multer = require('multer');

const { loggedIn } = require('../../middleware');
const { dbConfig } = require('../../config');

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '--' + file.originalname);
  },
});

const upload = multer({ storage: fileStorageEngine });

router.post('/singleImage', loggedIn, upload.single('image'), async (req, res) => {
  const con = await mysql.createConnection(dbConfig);
  const sql = `UPDATE food_menu SET image = '${req.file.filename}' WHERE id = '${req.userData.user_id}'`;
  await con.execute(sql);
  console.log(req.file);
  console.log(req.file.filename);
  res.send('Single File upload success');
});

module.exports = router;
