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

// GET - get all match information
router.get('/matchinfo/:id', loggedIn, async (req, res) => {
  const { id = '' } = req.params;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT f.user_id, f.id, f.match_date, f.match_time, f.place, f.ntrp, f.type, f.city,
     f.match_status, f.comment, f.doubles_partner, f.court_nr, CONCAT(tu.first_name,' ',tu.last_name) as doubles_partner_name,
     t.first_name, t.last_name, t.email, t.phone_number 
    FROM tennis_partners f 
    LEFT JOIN tennis_users t ON f.user_id = t.id 
    LEFT JOIN tennis_users tu ON f.doubles_partner = tu.id
    WHERE f.id = ${mysql.escape(id)}
    `;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// POST - update status of match
router.post('/matchstatus/:id', loggedIn, async (req, res) => {
  const { id } = req.params;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `UPDATE tennis_partners SET match_status = 'Partneris rastas!' WHERE id = ${mysql.escape(id)}`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - details of played match
router.get('/playedmatch/:id', loggedIn, async (req, res) => {
  const { id = '' } = req.params;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT
    top.match_id, top.opponent_id, top.doubles_partner as op_doubles_partner_id,
    tp.user_id as challenger_id, 
    tp.doubles_partner as ch_doubles_partner_id, 
    tp.type, tp.match_date, tp.match_time, tp.place, tp.ntrp, tp.city, tp.comment, tp.match_status,
    CONCAT(tu1.first_name,' ',tu1.last_name) as challenger_full_name,
    CONCAT(tu2.first_name,' ',tu2.last_name) as ch_doubles_partner_name,
    CONCAT(tu3.first_name,' ',tu3.last_name) as opponent_full_name,
    CONCAT(tu4.first_name,' ',tu4.last_name) as op_doubles_partner_name
    FROM tennis_opponents top 
    LEFT JOIN tennis_partners tp ON top.match_id = tp.id
    LEFT JOIN tennis_users tu1 ON tp.user_id = tu1.id
    LEFT JOIN tennis_users tu2 ON tp.doubles_partner = tu2.id
    LEFT JOIN tennis_users tu3 ON top.opponent_id = tu3.id
    LEFT JOIN tennis_users tu4 ON top.doubles_partner = tu4.id
    WHERE tp.id = ${mysql.escape(id)}`;
    const [data] = await con.execute(query);
    await con.end();

    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - Matches statistics
router.get('/matchesstats', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT 
    SUM(CASE WHEN user_id LIKE ${req.userData.user_id} 
      THEN 1 WHEN opponent_id LIKE ${req.userData.user_id} 
      THEN 1 END) AS matches_total,
      COUNT(CASE WHEN match_winner LIKE ${req.userData.user_id} THEN 1 END) AS matches_won,
      SUM(CASE WHEN user_id LIKE ${req.userData.user_id} 
        THEN 1 WHEN opponent_id LIKE ${req.userData.user_id} 
        THEN 1 END) - COUNT(CASE WHEN match_winner LIKE ${req.userData.user_id} THEN 1 END) as matches_lost 
      FROM tennis_result`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// GET - Users Matches statistics
router.get('/usermatchesstats/:id', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT 
    SUM(CASE WHEN user_id LIKE ${req.params.id} 
      THEN 1 WHEN opponent_id LIKE ${req.params.id} 
      THEN 1 END) AS matches_total,
      COUNT(CASE WHEN match_winner LIKE ${req.params.id} THEN 1 END) AS matches_won,
      SUM(CASE WHEN user_id LIKE ${req.params.id} 
        THEN 1 WHEN opponent_id LIKE ${req.params.id} 
        THEN 1 END) - COUNT(CASE WHEN match_winner LIKE ${req.params.id} THEN 1 END) as matches_lost 
      FROM tennis_result`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

// PUT - Cancel and update status of the match
router.post('/cancelmatch', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `UPDATE tennis_partners 
    SET match_status = 'Partneris ieškomas' 
    WHERE id = ${req.body.id}`;
    const query1 = `DELETE FROM tennis_opponents where match_id = ${req.body.id}`;
    const query2 = `SELECT tp.id, tp.user_id, tp.match_date, tp.match_time, tp.place, tp.city, tp.type, tu.email, 
    CONCAT(tu.first_name,' ', tu.last_name) as full_name, tu1.email as opponent_email, tu.phone_number as challenger_phone_number, tu.first_name as challenger_first_name,
    CONCAT(tu1.first_name,' ', tu1.last_name) as opponent_full_name, tu1.phone_number as opponent_phone_number, tu1.first_name as opponent_first_name
    FROM tennis_partners tp
    LEFT JOIN tennis_users tu ON tp.user_id = tu.id
    LEFT JOIN tennis_opponents top ON tp.id = top.match_id
    LEFT JOIN tennis_users tu1 ON top.opponent_id = tu1.id
    WHERE tp.id = ${req.body.id}`;
    const [data] = await con.execute(query);
    const [data2] = await con.execute(query2);
    await con.execute(query1);

    // eslint-disable-next-line no-inner-declarations
    async function sendEmailCanceledMatchChallenger() {
      const resp = await fetch('https://gatewayapi.com/rest/email', {
        method: 'post',
        headers: {
          Accept: 'application/json, text/javascript',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedAuth}`,
        },
        body: JSON.stringify({
          from: 'info@tenisopartneris.lt',
          html: `
                <div style="text-align:center">
                <img style="text-align:center" width="650" height="200" src="https://tenisopartneris.lt/static/media/banner.33b96a57.webp" alt="tenispartneris">
                <h1 style="text-align:center">Sveiki, ${data2[0].full_name}!</h1>
                </div>

                <h3>Jūsų teniso partneris pasikeitus planams atšaukė Jūsų mačą:</h3>
               <ul>
                <li>Data: <strong>${data2[0].match_date}</strong></li>
                <li>Laikas: <strong>${data2[0].match_time}</strong></li>
                <li>Miestas: <strong>${data2[0].city}</strong></li>
                <li>Teniso Kortas: <strong>${data2[0].place}</strong></li>
                <li>Mačo tipas: <strong>${data2[0].type}</strong></li>
                </ul>

                </br>
                <p style="font-size:14px; padding-top:20px">Jūsų teniso partnerio paieška buvo sėkmingai sugrąžinta į paiešką, todėl tikėtina, jog greitu metu atsiras naujas Teniso Partneris.</p>
                </br>
                <p style=""font-size:14px; padding-top:20px">Jeigu persigalvojote, ir visgi nebenorite ieškoti Teniso Partnerio, Jūs galite atšaukti paiešką prisijungęs prie sistemos.</p>
                <p style="margin-top: 30px">Kilus nesklandumams, prašome kreiptis ir mes būtinai Jums pagelbėsime!
                <a href="mailto:tenisopartneris@gmail.com">tenisopartneris@gmail.com</a></p>
                `,
          plaintext: '',
          subject: `Teniso Partneris - Jūsų teniso mačas ${data2[0].match_date} buvo atšauktas`,
          recipients: [{ address: data2[0].email }],
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
    async function sendEmailCanceledMatchOpponent() {
      const resp = await fetch('https://gatewayapi.com/rest/email', {
        method: 'post',
        headers: {
          Accept: 'application/json, text/javascript',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedAuth}`,
        },
        body: JSON.stringify({
          from: 'info@tenisopartneris.lt',
          html: `
                <div style="text-align:center">
                <img style="text-align:center" width="650" height="200" src="https://tenisopartneris.lt/static/media/banner.33b96a57.webp" alt="tenispartneris">
                <h1 style="text-align:center">Sveiki, ${data2[0].opponent_full_name}!</h1>
                </div>

                <h3>Jūsų teniso partneris pasikeitus planams atšaukė Jūsų mačą:</h3>
               <ul>
                <li>Data: <strong>${data2[0].match_date}</strong></li>
                <li>Laikas: <strong>${data2[0].match_time}</strong></li>
                <li>Miestas: <strong>${data2[0].city}</strong></li>
                <li>Teniso Kortas: <strong>${data2[0].place}</strong></li>
                <li>Mačo tipas: <strong>${data2[0].type}</strong></li>
                </ul>

                <p style="font-size:14px; padding-top:20px">Jūsų teniso partnerio paieška buvo sėkmingai sugrąžinta į paiešką, todėl tikėtina, jog greitu metu atsiras naujas Teniso Partneris.</p>

                <p style=""font-size:14px; padding-top:20px">Jeigu persigalvojote, ir visgi nebenorite ieškoti Teniso Partnerio, Jūs galite atšaukti paiešką prisijungęs prie sistemos.</p>
                <p style="margin-top: 30px">Kilus nesklandumams, prašome kreiptis ir mes būtinai Jums pagelbėsime!
                <a href="mailto:tenisopartneris@gmail.com">tenisopartneris@gmail.com</a></p>
                `,
          plaintext: '',
          subject: `Teniso Partneris - Jūsų teniso mačas ${data2[0].match_date} buvo atšauktas`,
          recipients: [{ address: data2[0].opponent_email }],
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

    sendEmailCanceledMatchChallenger();
    sendEmailCanceledMatchOpponent();

    // eslint-disable-next-line no-inner-declarations
    async function cancelMatchChallengerSMS() {
      const payload = {
        sender: 'TP Paieska',
        message: `Sveiki, ${data2[0].challenger_first_name}, Jusu teniso partneris atsauke ${data2[0].match_date} dienos teniso maca. Linkejimai, Teniso Partneris!`,
        recipients: [{ msisdn: data2[0].challenger_phone_number }],
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

    cancelMatchChallengerSMS();

    // eslint-disable-next-line no-inner-declarations
    async function cancelMatchOpponentSMS() {
      const payload = {
        sender: 'TP Paieska',
        message: `Sveiki, ${data2[0].opponent_first_name}, Jusu teniso partneris atsauke ${data2[0].match_date} dienos teniso maca. Linkejimai, Teniso Partneris!`,
        recipients: [{ msisdn: data2[0].opponent_phone_number }],
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

    cancelMatchOpponentSMS();

    await con.end();
    res.send({ msg: 'You have confirmed to be a tennis partner!' });

    await con.end();
    return res.send(data);
  } catch (err) {
    logger.error(err);
    return res.status(500).send({ err: 'Please try again' });
  }
});

module.exports = router;
