/** Express router providing conversation related routes
 * @module routers/api/conversation
 */const router = require("express").Router();

const {Conversation} = require("../../db/models")
const {findConversationByUserId} = require("../../db/queries")
const {composeConversationData} = require("../../services/api")

/**
 * Route for fetching all conversations by a user, include latest message text for preview,
 * and all messages.include other user model so we have info on username/profile pic
 * (don't include current user info). TODO: for scalability, implement lazy loading
 * @name get/conversation
 * @route GET /api/conversation/
 * @param {Object} user - Object of user data sent in header for validation
 * @returns {Array} 200 - returns array of conversation objects
 * @returns {Error}  401 - Validation error
 */
router.get("/", async (req, res, next) => {
  const {user} = req;
  try {
    if (!user) {
      return res.sendStatus(401);
    }
    const conversations = await findConversationByUserId(user.id);
    const convoData = composeConversationData(conversations);
    res.json(convoData);
  } catch (error) {
    next(error);
  }
});

/**
 * Route for resetting unseen message counter for the conversation by id.
 * @name patch/conversation/viewed/:id/:senderId
 * @route PATCH /api/conversation/viewed/:id/:senderId
 * @param {number} id - id of given Conversation
 * @param {string} senderId - id of user who is resetting unseenCount
 * @param {Object} user - Object of user data sent in header for validation
 * @param {callback} middleware - Express middleware.
 * @returns {object} 200 - success
 * @returns {Error}  401 - Validation error
 * @returns {Error}  403 - Forbidden error
 */

router.patch("/viewed/:id/:senderId", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    // userId is the recipient of the unseen message. Given this we can verify that
    // this action is authorized by comparing it to userId found in the request header. 
    const authId = req.user.id;
    const senderId = req.params.senderId;
    const id = req.params.id
    if (!checkValidUserAccess(id, senderId, authId)) return res.sendStatus(403);

    await Conversation.resetUnseenCount(id);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

/**
 * Route for updating the last seen message for the conversation by a particular user. 
 * Saves this information for use by the message sender. 
 * @name patch/conversation/markSeen/:id/:senderId/:messageId
 * @route PATCH /markSeen/:id/:senderId/:messageId"
 * @param {number} id - id of given Conversation
 * @param {number} senderId - Name of sender of unseen messages. Used in validation.
 * @param {number} messageId - id of the message.
 * @param {Object} user - Object of user data sent in header for validation
 * @param {callback} middleware - Express middleware.
 * @returns {object} 200 - success
 * @returns {Error}  401 - Validation error
 * @returns {Error}  403 - Forbidden error
 */
 router.patch("/markSeen/:id/:senderId/:messageId", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    // userId is the recipient of the unseen message. Given this we can verify that
    // this action is authorized by comparing it to userId found in the request header. 
    const authId = req.user.id;
    const senderId = req.params.senderId;
    const id = req.params.id

    if (!checkValidUserAccess(id, senderId, authId)) return res.sendStatus(403);

    const messageId = req.params.messageId
    const updatedConvo = await Conversation.setLastUnseenMessageForUser(
      id, senderId, messageId
    );
    if(!updatedConvo) throw ('Error while setting last message of user.');

    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

const checkValidUserAccess = async (convoId, senderId, authId) => {
  const convo = await Conversation.findConversationById(convoId);
  let targetUser;
  if (convo.user1Id === senderId) {
    targetUser = convo.user2Id;
  } else if (convo.user2Id === senderId) {
    targetUser = convo.user1Id
  } else return false;

  return targetUser == authId;
}

module.exports = router;
