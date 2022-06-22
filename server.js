const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { port } = require('./src/config');
const auth = require('./src/routes/v1/auth');
const accounts = require('./src/routes/v1/accounts');
const matchinfo = require('./src/routes/v1/matchinfo');
const matches = require('./src/routes/v1/matches');
const resetpass = require('./src/routes/v1/resetpass');
const verifyemail = require('./src/routes/v1/verifyemail');
const contactform = require('./src/routes/v1/contactform');
const singleImage = require('./src/routes/v1/imageUpload');
const menu = require('./src/routes/v1/menu');

const logger = require('./src/logger');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/v1/auth', auth);
app.use('/v1/accounts', accounts);
app.use('/v1/matchinfo', matchinfo);
app.use('/v1/matches', matches);
app.use('/v1/resetpass', resetpass);
app.use('/v1/verifyemail', verifyemail);
app.use('/v1/sendmail', contactform);
app.use('/v1/menu', menu);
app.use('/v1', singleImage);

// GET - check server is running
app.get('/', (req, res) => {
  res.send({ msg: 'Server is running successfully' });
});

// GET - all other routes
app.all('*', (req, res) => {
  logger.warn(`Page not found: ${req.url}`);
  res.status(404).send({ msg: 'Page Not Found' });
});

app.listen(port, () => logger.info(`Server is running on port ${port}`));
