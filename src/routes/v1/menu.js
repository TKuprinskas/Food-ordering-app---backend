const express = require('express');
const mysql = require('mysql2/promise');

const router = express.Router();

const { loggedIn } = require('../../middleware');
const { dbConfig } = require('../../config');
const logger = require('../../logger');

// GET - get opponent name
router.get('/menu', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = 'SELECT * FROM food_menu';
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get opponent name
router.post('/menu', async (req, res) => {
  const { title, description, price, week_day, image } = req.body;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO food_menu (title, description, price, week_day, image) VALUES (${mysql.escape(title)}, ${mysql.escape(
      description,
    )}, ${mysql.escape(price)}, ${mysql.escape(week_day)}, ${mysql.escape(image)})`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get opponent name version2
router.get('/opponentname', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT u.id, u.first_name, u.last_name, o.match_id FROM tennis_users u 
    LEFT JOIN tennis_opponents o ON u.id = o.opponent_id
    LEFT JOIN tennis_partners p ON o.match_id = p.id
    WHERE o.opponent_id = u.id AND o.match_id = p.id
    GROUP BY u.id, u.first_name, u.last_name, o.match_id`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get challengers name
router.get('/challengername', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT id,first_name,last_name FROM tennis_users WHERE id = ${mysql.escape(req.userData.user_id)} GROUP BY id`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get match id
router.get('/matchid', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = 'SELECT * FROM tennis_partners';
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// DELETE - delete group from account
router.delete('/accounts/:id?', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(500).send({ msg: 'Incorrect request' });
  }
  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(`DELETE FROM accounts WHERE group_id=${mysql.escape(id)} `);
    await con.end();
    return res.send(data);
  } catch (e) {
    return res.status(500).send({ msg: 'Please try again' });
  }
});

module.exports = router;
