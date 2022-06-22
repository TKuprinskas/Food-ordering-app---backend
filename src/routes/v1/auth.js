const express = require('express');

const router = express.Router();
const mysql = require('mysql2/promise');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const { dbConfig, jwtSecret } = require('../../config');

const userSchema = Joi.object({
  first_name: Joi.string().min(2).trim(),
  last_name: Joi.string().min(2).trim(),
  phone_number: Joi.string().trim(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(1).max(15).required(),
});

// Register post
router.post('/register', async (req, res) => {
  let userInput = req.body;
  try {
    userInput = await userSchema.validateAsync(userInput);
  } catch (err) {
    return res.status(400).send({ err: 'Incorrect data passed' });
  }

  const encryptedPassword = bcrypt.hashSync(userInput.password);

  try {
    const first_name = userInput.first_name.charAt(0).toUpperCase() + userInput.first_name.slice(1);
    const last_name = userInput.last_name.charAt(0).toUpperCase() + userInput.last_name.slice(1);
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(
      `INSERT INTO food_users (first_name, last_name, phone_number, email, password) VALUES ('${first_name}','${last_name}','${userInput.phone}','${userInput.email}', '${encryptedPassword}')`,
    );

    await con.end();
    res.send({ status: 'SUCCESS', msg: 'Sėkmingai prisiregistravote!', data });
  } catch (err) {
    if (err.errno === 1062) {
      const errWords = err.sqlMessage.split(' ');
      const entry = errWords[2];
      const fieldDB = errWords[5];
      const formatField = fieldDB.split('.').slice(1);
      const format = formatField[0].slice(0, -1);
      res.status(400).send({ err: `Email already exists - ${format}: ${entry}` });
    }
  }
});

// Login post
router.post('/login', async (req, res) => {
  let userInput = req.body;
  try {
    userInput = await userSchema.validateAsync(userInput);
  } catch (err) {
    return res.status(400).send({ err: 'Incorrect email or password' });
  }

  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(`SELECT * FROM food_users WHERE email = '${userInput.email}'`);
    await con.end();

    const answer = bcrypt.compareSync(userInput.password, data[0].password);

    const token = jwt.sign(
      {
        user_id: data[0].id,
        email: data[0].email,
      },
      jwtSecret,
    );

    return answer
      ? res.send({ status: 'SUCCESS', msg: 'Sėkmingai prisijungėte!', token, data })
      : res.status(400).send({ msg: 'Neteisingas el.paštas arba slaptažodis' });
  } catch (err) {
    return res.status(500).send({ err: 'Please try again' });
  }
});

module.exports = router;
