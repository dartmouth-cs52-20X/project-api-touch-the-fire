/* eslint-disable import/prefer-default-export */
import ChatMessage from '../models/chat_message';

// Only need to be able to get the chat messages and to create a new chat message
// Maybe need a deleteAllChatMessages? So that the messages are cleared after every round?
// Maybe each game should have a game ID, so then that can be an additional field in the ChatMessage model? That way we can get chatMessages by game_id?

export const createChatMessage = (fields) => {
  // Takes in a JSON object w/ username and message assigned
  // Create a new ChatMessage w/ those given fields
  const chatMessage = new ChatMessage();
  chatMessage.username = fields.username;
  chatMessage.message = fields.message;

  // Return the save of the new ChatMessage
  return chatMessage.save();
};

export const getChatMessages = () => {
  return ChatMessage.find({});
};
