const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const fetch = require('node-fetch');
const util = require('util');
const apiToken = '8vMolvjpQlutPy-YYpGgv6kDz5-k8vKfTfCC28WR8Pndv_Cco96rUrBWeI_6E06w';
const encodedAuth = Buffer.from(`${apiToken}:`).toString('base64');

const router = express.Router();

const { loggedIn } = require('../../middleware');
const { dbConfig } = require('../../config');
const logger = require('../../logger');

// GET - get account details
router.get('/mymatches', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT p.id, p.user_id as challenger_id, CONCAT(ur.first_name,' ', ur.last_name) as challenger_full_name, ur.email as challenger_email, p.match_date, p.match_time, p.place, p.ntrp, p.type, p.city, r.opponent_id, CONCAT(u.first_name,' ', u.last_name) as opponent_full_name, u.email as opponent_email, r.ch_set1, r.op_set1, r.ch_set2, r.op_set2, r.ch_set3, r.op_set3, op.opponent_id AS opponent 
    FROM tennis_partners p
    LEFT JOIN tennis_result r ON p.id = r.match_id
    LEFT JOIN tennis_users u ON r.opponent_id = u.id
    LEFT JOIN tennis_users ur ON p.user_id = ur.id
    LEFT JOIN tennis_opponents op ON p.id = op.match_id
    WHERE (op.opponent_id = ${mysql.escape(req.userData.user_id)} OR p.user_id = ${mysql.escape(req.userData.user_id)})
    AND (op.opponent_id IS NOT NULL)`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get matches details
router.get('/matchdetails/:start/:end', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT
    p.id, p.type, p.match_date, p.match_time, p.place, p.ntrp, p.city, p.court_nr,
    p.user_id as challenger_id, CONCAT(ch.first_name,' ', ch.last_name) as challenger_full_name,
    p.doubles_partner as ch_doubles_partner_id, CONCAT(chdp.first_name,' ', chdp.last_name) as ch_doubles_partner_name,
    r.ch_set1, r.op_set1, r.ch_set2, r.op_set2, r.ch_set3, r.op_set3, r.opponent_id as opponent_check,
    op.opponent_id, CONCAT(opu.first_name,' ', opu.last_name) as opponent_full_name,
    op.doubles_partner as op_doubles_partner_id, CONCAT(opdp.first_name,' ', opdp.last_name) as op_doubles_partner_name
    FROM tennis_partners p
    LEFT JOIN tennis_opponents op ON p.id = op.match_id
    LEFT JOIN tennis_result r ON p.id = r.match_id
    LEFT JOIN tennis_users ch ON p.user_id = ch.id
    LEFT JOIN tennis_users chdp ON p.doubles_partner = chdp.id
    LEFT JOIN tennis_users opu ON op.opponent_id = opu.id
    LEFT JOIN tennis_users opdp ON op.doubles_partner = opdp.id
    WHERE ${mysql.escape(req.userData.user_id)} IN (p.user_id, op.opponent_id, p.doubles_partner, op.doubles_partner)
    AND (op.opponent_id IS NOT NULL)
    ORDER BY p.match_date DESC, p.match_time DESC
    LIMIT ${req.params.start}, ${req.params.end}`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get matches details
router.get('/matchdetails', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT
    p.id, p.type, p.match_date, p.match_time, p.place, p.ntrp, p.city, p.court_nr,
    p.user_id as challenger_id, CONCAT(ch.first_name,' ', ch.last_name) as challenger_full_name,
    p.doubles_partner as ch_doubles_partner_id, CONCAT(chdp.first_name,' ', chdp.last_name) as ch_doubles_partner_name,
    r.ch_set1, r.op_set1, r.ch_set2, r.op_set2, r.ch_set3, r.op_set3, r.opponent_id as opponent_check,
    op.opponent_id, CONCAT(opu.first_name,' ', opu.last_name) as opponent_full_name,
    op.doubles_partner as op_doubles_partner_id, CONCAT(opdp.first_name,' ', opdp.last_name) as op_doubles_partner_name
    FROM tennis_partners p
    LEFT JOIN tennis_opponents op ON p.id = op.match_id
    LEFT JOIN tennis_result r ON p.id = r.match_id
    LEFT JOIN tennis_users ch ON p.user_id = ch.id
    LEFT JOIN tennis_users chdp ON p.doubles_partner = chdp.id
    LEFT JOIN tennis_users opu ON op.opponent_id = opu.id
    LEFT JOIN tennis_users opdp ON op.doubles_partner = opdp.id
    WHERE ${mysql.escape(req.userData.user_id)} IN (p.user_id, op.opponent_id, p.doubles_partner, op.doubles_partner)
    AND (op.opponent_id IS NOT NULL)
    ORDER BY p.match_date DESC, p.match_time DESC`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get matches details
router.get('/viewmymatch/:id', loggedIn, async (req, res) => {
  const { id } = req.params;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT
    p.id, p.type, p.match_date, p.match_time, p.place, p.ntrp, p.city, p.court_nr,
    p.user_id as challenger_id, CONCAT(ch.first_name,' ', ch.last_name) as challenger_full_name,
    p.doubles_partner as ch_doubles_partner_id, CONCAT(chdp.first_name,' ', chdp.last_name) as ch_doubles_partner_name,
    r.ch_set1, r.op_set1, r.ch_set2, r.op_set2, r.ch_set3, r.op_set3, r.opponent_id as opponent_check,
    op.opponent_id, CONCAT(opu.first_name,' ', opu.last_name) as opponent_full_name,
    op.doubles_partner as op_doubles_partner_id, CONCAT(opdp.first_name,' ', opdp.last_name) as op_doubles_partner_name
    FROM tennis_partners p
    LEFT JOIN tennis_opponents op ON p.id = op.match_id
    LEFT JOIN tennis_result r ON p.id = r.match_id
    LEFT JOIN tennis_users ch ON p.user_id = ch.id
    LEFT JOIN tennis_users chdp ON p.doubles_partner = chdp.id
    LEFT JOIN tennis_users opu ON op.opponent_id = opu.id
    LEFT JOIN tennis_users opdp ON op.doubles_partner = opdp.id
    WHERE p.id = ${mysql.escape(id)}
    ORDER BY p.match_date DESC, p.match_time DESC`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get opponent name
router.get('/opponent', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = 'SELECT id,first_name,last_name FROM tennis_users';
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - get opponent name
router.get('/usersearch', async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = 'SELECT id,first_name,last_name FROM tennis_users';
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
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

// POST - post the result of the match version
router.post('/challengervsopponent', loggedIn, async (req, res) => {
  const {
    match_id,
    opponent_id,
    user_id,
    ch_set1,
    op_set1,
    ch_set2,
    op_set2,
    ch_set3,
    op_set3,
    match_winner,
    match_type,
    ch_dp_partner_id,
    op_dp_partner_id,
  } = req.body;
  if (!ch_set1 || !op_set1 || !ch_set2 || !op_set2 || !match_winner) {
    return res.status(400).send({ err: 'Incorrect data passed' });
  }
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO tennis_result (match_id,user_id,opponent_id,ch_set1,op_set1,ch_set2,op_set2,ch_set3,op_set3,match_winner,match_type,ch_dp_partner_id,op_dp_partner_id) VALUES (${mysql.escape(
      match_id,
    )},${mysql.escape(user_id)},${mysql.escape(opponent_id)}, ${mysql.escape(ch_set1)},${mysql.escape(op_set1)},${mysql.escape(
      ch_set2,
    )},${mysql.escape(op_set2)},${mysql.escape(ch_set3)},${mysql.escape(op_set3)},${mysql.escape(match_winner)},${mysql.escape(
      match_type,
    )}, ${mysql.escape(ch_dp_partner_id)}, ${mysql.escape(op_dp_partner_id)})`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send({ status: 'SUCCESS', msg: 'Rezultatas įvestas', data });
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// POST - post the opponent of the match version
router.post('/opponent/:id', loggedIn, async (req, res) => {
  const { id } = req.params;
  const { doubles_partner, user_id } = req.body;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO tennis_opponents (match_id,opponent_id,doubles_partner) VALUES (${mysql.escape(id)},${mysql.escape(
      user_id,
    )},${mysql.escape(doubles_partner)})`;
    await con.execute(query);
    await con.end();

    const query2 = `SELECT DISTINCT p.id, p.user_id as challenger_id, CONCAT(ur.first_name,' ',
     ur.last_name) as challenger_full_name, ur.email as challenger_email, ur.phone_number as challenger_phone, ur.ntrp as challenger_ntrp,
     p.match_date, p.match_time, p.match_length, p.place, p.ntrp as challenger_ntrp, p.type, p.city, p.court_nr, ur.first_name as challanger_first_name,
     CONCAT(up.first_name,' ',up.last_name) as ch_doubles_partner_name, up.email as ch_doubles_partner_email,
     CONCAT(u.first_name,' ', u.last_name) as opponent_full_name, u.email as opponent_email,
     CONCAT(udp.first_name,' ',udp.last_name) as op_doubles_partner_name, udp.email as op_doubles_partner_email,
      u.ntrp as opponent_ntrp, u.phone_number as opponent_phone, op.opponent_id AS opponent_id 
    FROM tennis_partners p
    LEFT JOIN tennis_opponents op ON p.id = op.match_id
    LEFT JOIN tennis_users ur ON p.user_id = ur.id
    LEFT JOIN tennis_users up ON p.doubles_partner = up.id
    LEFT JOIN tennis_users u ON op.opponent_id = u.id
    LEFT JOIN tennis_users udp ON op.doubles_partner = udp.id
    WHERE p.id = ${mysql.escape(id)}`;
    const connection = await mysql.createConnection(dbConfig);
    const [data] = await connection.execute(query2);

    // eslint-disable-next-line no-inner-declarations
    async function sendEmailPartnerFoundChallenger() {
      const resp = await fetch('https://gatewayapi.com/rest/email', {
        method: 'post',
        headers: {
          Accept: 'application/json, text/javascript',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedAuth}`,
        },
        body: JSON.stringify({
          from: 'info@tenisopartneris.lt',
          html: `<div width="650; text-align:center">
                <div style="text-align:center">
                <img style="text-align:center" width="650" height="200" src="https://tenisopartneris.lt/static/media/banner.33b96a57.webp" alt="tenispartneris">
                </div>
                <h1 style="text-align:center">Sveiki, ${data[0].challenger_full_name}, suradome Jums Teniso Partnerį!</h1>
                <h3>Jūsų Teniso Partnerio duomenys:</h3>
                <ul>
                <li>Vardas: <strong>${data[0].opponent_full_name} ${data[0].op_doubles_partner_name}</strong></li>
                <li>NTRP: <strong>${data[0].opponent_ntrp}</strong></li>
                <li>El. paštas: <strong>${data[0].opponent_email}</strong></li>
                <li>Telefono numeris: <strong>${data[0].opponent_phone}</strong></li>
                </ul>
                </br>
                <h3>Jūsų teniso mačo informacija:</h3>
               <ul>
                <li>Data: <strong>${data[0].match_date}</strong></li>
                <li>Laikas: <strong>${data[0].match_time}</strong></li>
                <li>Trukmė: <strong>${data[0].match_length}</strong></li>
                <li>Miestas: <strong>${data[0].city}</strong></li>
                <li>Teniso Kortas: <strong>${data[0].place}</strong></li>
                <li>Aikštelė: <strong>${data[0].court_nr}</strong></li>
                <li>Mačo tipas: <strong>${data[0].type}</strong></li>
                </ul>
                </br>
                <h4>Sužaidę mačą, nepamirškite suvesti rezultato sistemoje, taip matysite ne tik pilną mačų istoriją, bet ir statistiką.</h4>
                </br>
                <h3 style="text-align:center; color:#FFAE42; font-size:18px" >Sėkmės žaidime!</h3>
                </br>
                <p style="margin-top: 30px">Kilus nesklandumams, prašome kreiptis ir mes būtinai Jums pagelbėsime!
                <a href="mailto:tenisopartneris@gmail.com">tenisopartneris@gmail.com</a></p>
                </div>`,
          plaintext: '',
          subject: 'Teniso Partneris - Jūsų teniso partneris rastas!',
          recipients: [{ address: data[0].challenger_email }],
        }),
      });

      const json = await resp.json();
      console.log(util.inspect(json, { showHidden: false, depth: null }));
      if (resp.ok) {
        console.log('congrats! messages are on their way!');
      } else {
        console.log('oh-no! something went wrong...');
      }
    }

    // eslint-disable-next-line no-inner-declarations
    async function sendEmailPartnerFoundOpponent() {
      const resp = await fetch('https://gatewayapi.com/rest/email', {
        method: 'post',
        headers: {
          Accept: 'application/json, text/javascript',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedAuth}`,
        },
        body: JSON.stringify({
          from: 'info@tenisopartneris.lt',
          html: `<div width="650; text-align:center">
            <div style="text-align:center">
            <img style="text-align:center" width="650" height="200" src="https://tenisopartneris.lt/static/media/banner.33b96a57.webp" alt="tenispartneris">
            </div>
            <h1 style="text-align:center">Sveiki, ${data[0].opponent_full_name}, Jūs sėkmingai tapote teniso partneriu!</h1>
            <h3>Jūsų Teniso Partnerio duomenys:</h3>
            <ul>
            <li>Vardas: <strong>${data[0].challenger_full_name} ${data[0].ch_doubles_partner_name}</strong></li>
            <li>NTRP: <strong>${data[0].challenger_ntrp}</strong></li>
            <li>El. paštas: <strong>${data[0].challenger_email}</strong></li>
            <li>Telefono numeris: <strong>${data[0].challenger_phone}</strong></li>
            </ul>
            </br>
            <h3>Jūsų teniso mačo informacija:</h3>
           <ul>
            <li>Data: <strong>${data[0].match_date}</strong></li>
            <li>Laikas: <strong>${data[0].match_time}</strong></li>
            <li>Trukmė: <strong>${data[0].match_length}</strong></li>
            <li>Miestas: <strong>${data[0].city}</strong></li>
            <li>Teniso Kortas: <strong>${data[0].place}</strong></li>
            <li>Aikštelė: <strong>${data[0].court_nr}</strong></li>
            <li>Mačo tipas: <strong>${data[0].type}</strong></li>
            </ul>
            </br>
            <h4>Sužaidę mačą, nepamirškite suvesti rezultato sistemoje, taip matysite ne tik pilną mačų istoriją, bet ir statistiką.</h4>
            </br>
            <h3 style="text-align:center; color:#FFAE42; font-size:18px" >Sėkmės žaidime!</h3>
            </br>
            <p style="margin-top: 30px">Kilus nesklandumams, prašome kreiptis ir mes būtinai Jums pagelbėsime!
            <a href="mailto:tenisopartneris@gmail.com">tenisopartneris@gmail.com</a></p>
            </div>`,
          plaintext: '',
          subject: 'Teniso Partneris - Jūs tapote teniso partneriu!',
          recipients: [{ address: data[0].opponent_email }],
        }),
      });

      const json = await resp.json();
      console.log(util.inspect(json, { showHidden: false, depth: null }));
      if (resp.ok) {
        console.log('congrats! messages are on their way!');
      } else {
        console.log('oh-no! something went wrong...');
      }
    }

    sendEmailPartnerFoundChallenger();
    sendEmailPartnerFoundOpponent();

    // eslint-disable-next-line no-inner-declarations
    async function partnerFoundSMS() {
      const payload = {
        sender: 'TP Paieska',
        message: `Sveiki, ${data[0].challanger_first_name}, Jusu teniso partneris rastas! Pasitikrinkite el.pasta del informacijos. Linkejimai, Teniso Partneris!`,
        recipients: [{ msisdn: data[0].challenger_phone }],
      };

      const resp = await fetch('https://gatewayapi.com/rest/mtsms', {
        method: 'post',
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Basic ${encodedAuth}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await resp.json();
      console.log(util.inspect(json, { showHidden: false, depth: null }));
      if (resp.ok) {
        console.log('congrats! messages are on their way!');
      } else {
        console.log('oh-no! something went wrong...');
      }
    }

    partnerFoundSMS();

    await connection.end();
    res.send({ msg: 'You have confirmed to be a tennis partner!' });
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - profile information
router.get('/myprofile', loggedIn, async (req, res) => {
  const { user_id } = req.userData;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM tennis_users where id = ${mysql.escape(user_id)}`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - user profiles information
router.get('/profiles/:id', loggedIn, async (req, res) => {
  const { id } = req.params;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM tennis_users where id = ${mysql.escape(id)}`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// UPDATE - profile information
router.put('/myprofiles', loggedIn, async (req, res) => {
  const { user_id } = req.userData;
  const encryptedPassword = bcrypt.hashSync(req.body.password);
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `UPDATE tennis_users SET 
    phone_number = CASE 
    WHEN '${req.body.phone_number}' = '' THEN phone_number
    ELSE '+370${req.body.phone_number}'
    END,
    messenger = CASE 
    WHEN '${req.body.messenger}' = '' THEN messenger
    ELSE 'https://m.me/${req.body.messenger}'
    END,
    ntrp = CASE 
    WHEN '${req.body.ntrp}' = '' THEN ntrp
    ELSE '${req.body.ntrp}'
    END,
    city = CASE 
    WHEN '${req.body.city}' = '' THEN city
    ELSE '${req.body.city}'
    END,
    password = CASE 
    WHEN '${req.body.password}' = '' THEN password
    ELSE '${encryptedPassword}'
    END,
    age = CASE 
    WHEN '${req.body.age}' = '' THEN age
    ELSE '${req.body.age}'
    END,
    description = CASE 
    WHEN '${req.body.description}' = '' THEN description
    ELSE '${req.body.description}'
    END
    WHERE id = ${mysql.escape(user_id)}`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send({ status: 'SUCCESS', msg: 'Profilis sėkmingai atnaujintas!', data });
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// UPDATE - profile information, mobile version
router.put('/editmyprofile/:id', loggedIn, async (req, res) => {
  const encryptedPassword = bcrypt.hashSync(req.body.password);
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `UPDATE tennis_users SET 
    ntrp = CASE 
    WHEN '${req.body.ntrp}' = 'undefined' THEN ntrp
    ELSE '${req.body.ntrp}'
    END,
    city = CASE 
    WHEN '${req.body.city}' = 'undefined' THEN city
    ELSE '${req.body.city}'
    END,
    password = CASE 
    WHEN '${req.body.password}' = '' THEN password
    ELSE '${encryptedPassword}'
    END,
    description = CASE 
    WHEN '${req.body.description}' = '' THEN description
    ELSE '${req.body.description}'
    END
    WHERE id = ${req.params.id}`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send({ status: 'SUCCESS', msg: 'Profilis sėkmingai atnaujintas!', data });
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

module.exports = router;
