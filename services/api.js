const onlineUsers = require("../onlineUsers");

/** composeConversationData processes the conversation data and
 * prepares it to be sent to the frontend.
 * @param {Array} conversations -  array of conversation objects
 * @returns {Array} returns an array of updated conversation objects
 */
composeConversationData = function(conversations) {
  const newConvo = new Array(conversations.length)
  for (let i = 0; i < conversations.length; i++) {
    const convo = conversations[i];
    const convoJSON = convo.toJSON();
    // set properties "otherUser" and "lastMessageReadId" so that frontend
    // will have easier access.
    if (convoJSON.user1) {
      convoJSON.otherUser = convoJSON.user1;
      convoJSON.lastMessageReadId = convoJSON.lastMessageReadUser2;
    } else if (convoJSON.user2) {
      convoJSON.otherUser = convoJSON.user2;
      convoJSON.lastMessageReadId = convoJSON.lastMessageReadUser1;
    }

    delete convoJSON.user1;
    delete convoJSON.lastMessageReadUser1;
    delete convoJSON.user2;
    delete convoJSON.lastMessageReadUser2;

    // set property for online status of the other user
    if (onlineUsers.has(convoJSON.otherUser.id)) {
      convoJSON.otherUser.online = true;
    } else {
      convoJSON.otherUser.online = false;
    }

    // set properties for notification count and latest message preview
    const lastIndex = convoJSON.messages.length-1;
    convoJSON.latestMessageText = lastIndex >= 0 ? convoJSON.messages[lastIndex].text : '';
    convoJSON.isTyping = false;
    newConvo[i] = convoJSON;
  }
  return newConvo;
}

module.exports = {composeConversationData};
