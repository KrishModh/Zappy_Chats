export const serializeMessage = (messageDoc) => ({
  _id: messageDoc._id,
  chatId: messageDoc.chatId,
  sender: messageDoc.sender,
  message: messageDoc.message,
  image: messageDoc.image,
  clientMessageId: messageDoc.clientMessageId,
  status: messageDoc.status,
  isDeleted: Boolean(messageDoc.isDeleted),
  deletedFor: (messageDoc.deletedFor || []).map((entry) => entry.toString()),
  isEdited: Boolean(messageDoc.isEdited),
  editedAt: messageDoc.editedAt,
  timestamp: messageDoc.timestamp
});
