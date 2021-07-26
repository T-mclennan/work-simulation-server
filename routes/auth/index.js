/** Express router providing auth related routes
 * @module routers/auth/
 */
const router = require("express").Router();
const { User } = require("../../db/models");
const jwt = require("jsonwebtoken");


/**
 * Route for User registration service.
 * @name post/register
 * @route POST /auth/register 
 * @param {string} username 
 * @param {string} password 
 * @param {string} email 
 * @param {Object} user - Object of user data sent in header for validation
 * @param {callback} middleware - Express middleware.
 * @returns {Object} 200 - Returns Object of user related data
 * @returns {Error}  401 - Validation error
 * @returns {Error}  400 - "Username, password, and email required"
 */
router.post("/register", async (req, res, next) => {
  try {
    // expects {username, email, password} in req.body
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ error: "Username, password, and email required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.create(req.body);

    const token = jwt.sign(
      { id: user.dataValues.id },
      process.env.SESSION_SECRET,
      { expiresIn: 86400 }
    );
    res.json({
      ...user.dataValues,
      token,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(401).json({ error: "User already exists" });
    } else if (error.name === "SequelizeValidationError") {
      return res.status(401).json({ error: "Validation error" });
    } else next(error);
  }
});

/**
 * Route for User authentication service.
 * @name post/login
 * @route POST /auth/login 
 * @param {string} username 
 * @param {string} password 
 * @param {Object} user - Object of user data sent in header for validation
 * @param {callback} middleware - Express middleware.
 * @returns {Object} 200 - Returns Object of user related data
 * @returns {Error}  401 - Wrong username and/or password
 * @returns {Error}  400 - "Username, password, and email required"
 */
router.post("/login", async (req, res, next) => {
  try {
    // expects username and password in req.body
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const user = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (!user) {
      console.log({ error: `No user found for username: ${username}` });
      res.status(401).json({ error: "Wrong username and/or password" });
    } else if (!user.correctPassword(password)) {
      console.log({ error: "Wrong username and/or password" });
      res.status(401).json({ error: "Wrong username and/or password" });
    } else {
      const token = jwt.sign(
        { id: user.dataValues.id },
        process.env.SESSION_SECRET,
        { expiresIn: 86400 }
      );
      res.json({
        ...user.dataValues,
        token,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Route for User logout service.
 * @name delete/logout
 * @route DELETE /auth/logout 
 * @returns 204 
 */
router.delete("/logout", (req, res, next) => {
  res.sendStatus(204);
});

/**
 * Route for fetching current User.
 * @name get/user
 * @route GET /auth/user 
 * @param {Object} - If user exists returns Object of user data
 */
router.get("/user", (req, res, next) => {
  if (req.user) {
    return res.json(req.user);
  } else {
    return res.json({});
  }
});

module.exports = router;
