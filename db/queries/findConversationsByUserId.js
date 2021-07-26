
const { User, Conversation, Message } = require("../models");
const { Op } = require("sequelize");

/** findConverSationByUserId is a funciton that queries the postgres
 * database for all conversations that contain the user with matching userId.
 * @param {Number} userId -  userId of current user.
 * @returns {Array} - array of conversation objects.
 */
findConversationsByUserId = async function(userId) {
  try {
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id", "unseenCount", "lastMessageReadUser1", "lastMessageReadUser2"],
      order: [[Message, "createdAt", "ASC"]],
      include: [
        { model: Message, order: ["createdAt", "ASC"] },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },

      ],
    });

    return conversations;
  
  } catch (error) {
    console.log(error)
  }
}

module.exports = findConversationsByUserId;
