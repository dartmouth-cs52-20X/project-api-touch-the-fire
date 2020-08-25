import mongoose, { Schema } from 'mongoose';

const ChatMessageSchema = new Schema({
  username: String,
  message: String,
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const ChatMessageModel = mongoose.model('ChatMessage', ChatMessageSchema);

export default ChatMessageModel;
