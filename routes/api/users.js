/** Express router providing user related routes
 * @module routers/api/users
 */

 const router = require("express").Router();
 const { User } = require("../../db/models");
 const { Op } = require("sequelize");
 const onlineUsers = require("../../onlineUsers");
 
 /**
  * Route for fetching User data based on matching username.
  * @name get/username
  * @route GET /api/users/{username} 
  * @param {string} username 
  * @param {Object} user - Object of user data sent in header for validation
  * @param {callback} middleware - Express middleware.
  * @returns {Array} 200 - returns array of User objects
  * @returns {Error}  401 
  */
 router.get("/:username", async (req, res, next) => {
   try {
     if (!req.user) {
       return res.sendStatus(401);
     }
     const { username } = req.params;
 
     const users = await User.findAll({
       where: {
         username: {
           [Op.substring]: username,
         },
         id: {
           [Op.not]: req.user.id,
         },
       },
     });
 
     // add online status to each user that is online
     for (let i = 0; i < users.length; i++) {
       const userJSON = users[i].toJSON();
       if (onlineUsers.has(userJSON.id)) {
         userJSON.online = true;
       }
       users[i] = userJSON;
     }
     res.json(users);
   } catch (error) {
     next(error);
   }
 });
 
 module.exports = router;