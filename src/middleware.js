const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config');

module.exports = {
  loggedIn: (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decodedToken = jwt.verify(token, jwtSecret);
      req.userData = decodedToken;
      return next();
    } catch (err) {
      return res.status(401).send({ err: 'Validation failed' });
    }
  },
};
