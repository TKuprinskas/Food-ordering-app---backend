const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const router = express.Router();

const { dbConfig } = require('../../config');

// GET - Email verification check
router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM tennis_users WHERE emailToken = '${token}'`;
    const [user] = await con.execute(query);
    const updateQuery = `UPDATE tennis_users SET emailToken = NULL, isVerified = 1 WHERE emailToken = '${token}'`;
    await con.execute(updateQuery);

    if (!user) {
      res.status(400).send({ err: 'Invalid token. Please contact us for assistance' });
    }

    await con.end();
    res.send(user);
  } catch (err) {
    res.status(400).send({ err: 'Invalid token. Please contact us for assistance' });
  }
});

module.exports = router;
