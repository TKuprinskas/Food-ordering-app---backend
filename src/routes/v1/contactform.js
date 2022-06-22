const express = require('express');
require('dotenv').config();

const router = express.Router();

const fetch = require('node-fetch');
const util = require('util');
const apiToken = '8vMolvjpQlutPy-YYpGgv6kDz5-k8vKfTfCC28WR8Pndv_Cco96rUrBWeI_6E06w';
const encodedAuth = Buffer.from(`${apiToken}:`).toString('base64');

// POST - user sends email to us through contact form
router.post('/contactform', async (req, res) => {
  const { firstname, lastname, email, message } = req.body;

  async function sendContactFormEmail() {
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
              <h1 style="text-align:center">Sveiki, Jūs gavote žinutę iš puslapio svečio!</h1>
              <p>Vardas: <strong>${firstname} ${lastname}.</strong></p>
              <p>El.Paštas: <strong>${email}</strong></p>
              <p><strong>Žinutė:</strong> ${message}</p>
              </div>`,
        plaintext: '',
        subject: 'Teniso Partneris - Jūs gavote žinutę iš puslapio svečio',
        recipients: [{ address: 'tenisopartneris@gmail.com' }],
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

  try {
    sendContactFormEmail();
    res.send({ msg: 'Jūsų žinutė buvo sėkmingai išsiųsta!' });
    return;
  } catch (error) {
    res.status(400).send({ msg: 'Jūsų žinutė nebuvo išsiųsta, pamėginkite dar kartą.' });
  }
});

module.exports = router;
