const express = require('express');
const mysql = require('mysql2/promise');

const router = express.Router();

const fetch = require('node-fetch');
const util = require('util');
const apiToken = '8vMolvjpQlutPy-YYpGgv6kDz5-k8vKfTfCC28WR8Pndv_Cco96rUrBWeI_6E06w';
const encodedAuth = Buffer.from(`${apiToken}:`).toString('base64');

const { loggedIn } = require('../../middleware');
const { dbConfig } = require('../../config');
const logger = require('../../logger');

// POST - post new match search
router.post('/matches', loggedIn, async (req, res) => {
  const { match_date, match_time, match_length, place, ntrp, type, city, comment, doubles_partner, court_nr } = req.body;
  if (!match_date || !match_time || !match_length || !place || !ntrp || !type || !city) {
    return res.status(400).send({ err: 'Incorrect data passed' });
  }
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO tennis_partners (user_id,match_date,match_time,match_length,place,ntrp,type,city,comment,doubles_partner,court_nr) VALUES (${mysql.escape(
      req.userData.user_id,
    )}, ${mysql.escape(match_date)}, ${mysql.escape(match_time)}, ${mysql.escape(match_length)}, ${mysql.escape(place)},${mysql.escape(
      ntrp,
    )},${mysql.escape(type)}, ${mysql.escape(city)}, ${mysql.escape(comment)}, ${mysql.escape(doubles_partner)}, ${mysql.escape(
      court_nr,
    )})`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send({ data, status: 'SUCCESS', msg: 'Paieška sėkmingai patalpinta' });
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ msg: 'Įvyko klaida, pamėginkite dar kartą' });
  }
});

// GET - get all matches
router.get('/matches', async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = 'SELECT * FROM tennis_partners WHERE match_date > DATE_SUB(NOW(),INTERVAL 1 DAY) ORDER BY match_date, match_time ASC';
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// DELETE - delete match search
router.delete('/matches/:id?', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(500).send({ msg: 'Incorrect request' });
  }
  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(`DELETE FROM tennis_partners WHERE id=${mysql.escape(id)} `);
    await con.end();
    return res.send(data);
  } catch (e) {
    return res.status(500).send({ msg: 'Please try again' });
  }
});

// GET - get all courts available
router.get('/courts', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = 'SELECT * FROM tennis_courts ORDER BY court_name ASC';
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// POST - CHALLENGE A PLAYER
router.post('/challengeuser/:id', loggedIn, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `
    (SELECT tu.id as opponent_id, tu.first_name as op_name, CONCAT(tu.first_name,' ',tu.last_name) as opponent_full_name, tu.email as opponent_email, tu.phone_number as opponent_phone
      FROM tennis_users tu
      WHERE id=${mysql.escape(req.params.id)})
    UNION ALL
    (SELECT tu2.id as challenger_id, tu2.first_name as ch_name, CONCAT(tu2.first_name,' ',tu2.last_name) as challenger_full_name, tu2.email as challenger_email, tu2.phone_number as challenger_phone
      FROM tennis_users tu2
      WHERE id=${mysql.escape(req.userData.user_id)})`;
    const [data] = await connection.execute(query);

    // eslint-disable-next-line no-inner-declarations
    async function sendChallengeUserEmail() {
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
                <h1 style="text-align:center">Sveiki, ${data[0].opponent_full_name}, Jus kviečia į dvikovą!</h1>
                <h3>Jus į dvikovą kviečia:</h3>
                <ul>
                <li>Vardas: <strong>${data[1].opponent_full_name}</strong></li>
                <li>El. paštas: <strong>${data[1].opponent_email}</strong></li>
                <li>Telefono numeris: <strong>${data[1].opponent_phone}</strong></li>
                </ul>
                </br>
                <p style="text-align: justify; font-size: 14px; font-weight:bold">Jeigu sutinkate su šiuo kvietimu į dvikovą, prašome susisiekti su oponentu aukščiau pateiktais kontaktais ir susitarti dėl mačo. Norint, kad mačas atsispindėtų Jūsų mačų istorijoje ir statistikoje, Jums reikia sukurti Teniso Partnerio paiešką kaip įprastai, ir oponentui reikia paspausti žaisti. Po įvykusio mačo suveskite rezultatą, ir Jūsų mačas bus užskaitytas.</p>
                </br>
                <h3 style="text-align:center; color:#FFAE42; font-size:18px" >Sėkmės žaidime!</h3>
                </br>
                <p style="margin-top: 30px">Kilus nesklandumams, prašome kreiptis ir mes būtinai Jums pagelbėsime!
                <a href="mailto:tenisopartneris@gmail.com">tenisopartneris@gmail.com</a></p>
                </div>`,
          plaintext: '',
          subject: 'Teniso Partneris - Kvietimas į dvikovą',
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

    // eslint-disable-next-line no-inner-declarations
    async function challengeSMS() {
      const payload = {
        sender: 'TP Paieska',
        message: `Sveiki, ${data[0].op_name}, Jus kviecia i dvikova! Pasitikrinkite el.pasta del informacijos. Linkejimai, Teniso Partneris!`,
        recipients: [{ msisdn: data[0].opponent_phone }],
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

    challengeSMS();

    await connection.end();
    sendChallengeUserEmail();
    res.send(data);
    return;
  } catch (err) {
    res.status(500).send({ err });
  }
});

module.exports = router;
