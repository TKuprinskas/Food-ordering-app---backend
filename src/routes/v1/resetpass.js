const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const router = express.Router();

const fetch = require('node-fetch');
const util = require('util');
const apiToken = '8vMolvjpQlutPy-YYpGgv6kDz5-k8vKfTfCC28WR8Pndv_Cco96rUrBWeI_6E06w';
const encodedAuth = Buffer.from(`${apiToken}:`).toString('base64');

const { v4: uuid } = require('uuid');
const { dbConfig } = require('../../config');

// POST - SEND EMAIL TO USER WITH PASSWORD RESET LINK
router.post('/password-reset', async (req, res) => {
  const { email } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM tennis_users WHERE email = '${email}'`;
    const [user] = await connection.execute(query);

    if (user.length > 0) {
      const id = uuid();
      const con = await mysql.createConnection(dbConfig);
      const queryInsert = `INSERT INTO password_reset (id, email) VALUES ('${id}', '${user[0].email}')`;
      await con.execute(queryInsert);

      // eslint-disable-next-line no-inner-declarations
      async function sendResetPasswordEmail() {
        const resp = await fetch('https://gatewayapi.com/rest/email', {
          method: 'post',
          headers: {
            Accept: 'application/json, text/javascript',
            'Content-Type': 'application/json',
            Authorization: `Basic ${encodedAuth}`,
          },
          body: JSON.stringify({
            from: 'info@tenisopartneris.lt',
            html: `<div width="650" style="text-align:center">
                  <div style="text-align:center">
                  <img style="text-align:center" width="650" height="200" src="https://tenisopartneris.lt/static/media/banner.33b96a57.webp" alt="tenispartneris">
                  </div>
                  <h1 style="text-align:center">Sveiki, gavome Jūsų užklausą pakeisti slaptažodį!</h1>
                  <p style="text-align:center; font-size:18px">Norėdami pakeisti slaptažodį nauju, spauskite apačioje esantį mygtuką.</p>
                  </br>
                  <h3 style="text-align:center; color:#FFAE42; font-size:18px" >Ačiū!</h3>
                  </br>
                  <a href="https://tenisopartneris.lt/front/ResetPassword/ResetPassword.html?=${id}" style="text-align:center; font-size:18px; background-color: #FFAE42; color: white; text-decoration: none; padding: 5px 10px; border-radius: 3px">PAKEISTI SLAPTAŽODĮ</a>
                  </br>
                  <p style="margin-top: 30px">Kilus nesklandumams, prašome kreiptis ir mes būtinai Jums pagelbėsime!
                  <a href="mailto:tenisopartneris@gmail.com">tenisopartneris@gmail.com</a></p>
                  </div>`,
            plaintext: '',
            subject: 'Teniso Partneris - Slaptažodžio keitimas',
            recipients: [{ address: email }],
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

      await con.end();
      sendResetPasswordEmail();
      res.send({ status: 'SUCCESS', msg: 'Slaptažodžio keitimo nuoroda išsiųsta el.paštu' });
      return;
    }
    await connection.end();
    res.status(400).send({ msg: 'Email does not exist in our records' });
    return;
  } catch (err) {
    res.status(500).send({ err });
  }
});

// GET - CHECK IF EMAIL EXISTS
router.get('/verify-email/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT email FROM password_reset WHERE id = ${mysql.escape(id)}`;
    const [data] = await con.execute(query);
    await con.end();
    return res.send(data);
  } catch (err) {
    return res.status(500).send({ err: 'Please try again' });
  }
});

// POST - CHANGE PASSWORD ROUTE
router.post('/change-password/:id', async (req, res) => {
  const { email, password } = req.body;
  const { id } = req.params;

  try {
    const con = await mysql.createConnection(dbConfig);
    const query = `SELECT email FROM password_reset WHERE email = ${mysql.escape(email)}`;
    const user = con.execute(query);

    if (user.length === 0) {
      res.status(400).send({ msg: 'An error occured' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hashSync(password, salt);

    const update = `UPDATE tennis_users SET password = '${hashedPassword}' WHERE email = '${email}'`;
    await con.execute(update);

    const deleteQuery = `DELETE FROM password_reset WHERE id = '${id}'`;
    await con.execute(deleteQuery);

    await con.end();
    res.send({ msg: 'Password changed' });
    return;
  } catch (err) {
    res.status(400).send({ err });
  }
});

module.exports = router;
