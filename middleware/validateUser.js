
const jwt = require("jsonwebtoken");
const { User } = require("../db/models/");

/** validateUser is validation middleware for the express server.*/
validateUser = function () {
  return function(req, res, next) {
    const token = req.headers["x-access-token"];
    if (token) {
      jwt.verify(token, process.env.SESSION_SECRET, (err, decoded) => {
        if (err) {
          return next();
        }
        User.findOne({
          where: { id: decoded.id },
        }).then((user) => {
          req.user = user;
          return next();
        });
      });
    } else {
      return next();
    }
  }
}

/** validateSocket is validation middleware for the websocket.*/
validateSocket = function (socket, data, callback) {
  const token = data.token;
  if (token) {
    jwt.verify(token, process.env.SESSION_SECRET, (err, decoded) => {
      if (err) {
        return callback(new Error(err));;
      }
      User.findOne({
        where: { id: decoded.id },
      }).then(callback(null, true));
    });
  } else {
    return callback(new Error("User not found"));
  }
}

module.exports = {validateUser, validateSocket};
