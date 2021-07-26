/** Express router providing message related routes
 * @module routers/api/messages
 */
const router = require("express").Router();
const { Conversation, Message } = require("../../db/models");
const onlineUsers = require("../../onlineUsers");


/**
 * Route for processing incoming messages.
 * @name post/message
 * @route POST /api/message/
 * @param {number} recipientId - recipientId references the user the message is going to.
 * @param {number} converstaionId - conversationId will be null if no conversation exists yet
 * @param {string} text - Body of message.
 * @param {Object} user - Object of user data sent in header for validation
 * @param {Object} sender - If conversation doesn't exist, this will be object of sender info.
 * @param {callback} middleware - Express middleware.
 * @returns {Error}  401 - Validation error
 */
router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const senderId = req.user.id;
    const { recipientId, text, conversationId, sender } = req.body;

    // if we don't have conversation id, find a conversation to make sure it doesn't already exist
    if (!conversationId) {
      let conversation = await Conversation.findConversation(
        senderId,
        recipientId
      );

      //if no conversation exists, create a new one
      if (!conversation) {
        conversation = await Conversation.createConversation(senderId, recipientId);
        if (onlineUsers.has(sender.id)) {
          sender.online = true;
        }
      }

      const conversationId = conversation.id;
      const message = await Message.create({ senderId, text, conversationId });
      Conversation.incrementUnseenCount(conversationId);
      return res.json({ message, sender });
    }

    //If conversationId is valid and conversation exists
    const conversation = await Conversation.findConversationById(conversationId); 
    if (!conversation) {
      return res.sendStatus(401);
    }
    const {user1Id, user2Id} = conversation;
    if (senderId !== user1Id && senderId !== user2Id) {
      return res.sendStatus(403);
    }

    const message = await Message.create({
      senderId,
      text,
      conversationId: conversation.id,
    });
    Conversation.incrementUnseenCount(conversation.id);

    return res.json({ message, sender });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
