const {
  getMessages,
  sendMessage,
  getChatInfo,
  createOrOpenChat,
} = require('../services/chat.service');
const { sendSuccess }      = require('../utils/response.utils');
const { sendMessageSchema } = require('../validations/request.validation');
const { SOCKET_EVENTS }    = require('../config/constants');

const getChatInfoHandler = async (req, res, next) => {
  try {
    const info = await getChatInfo(req.params.requestId, req.user.id);
    sendSuccess(res, 200, 'Chat info fetched', info);
  } catch (e) { next(e); }
};

const getMessagesHandler = async (req, res, next) => {
  try {
    const result = await getMessages(
      req.params.requestId,
      req.user.id,
      parseInt(req.query.page, 10)  || 1,
      parseInt(req.query.limit, 10) || 50
    );
    sendSuccess(res, 200, 'Messages fetched', result);
  } catch (e) { next(e); }
};

const sendMessageHandler = async (req, res, next) => {
  try {
    // Validate with Zod
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const message = await sendMessage(req.params.requestId, req.user.id, parsed.data.text);

    // Broadcast via Socket.io if available (preferred real-time path)
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${req.params.requestId}`).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
    }

    sendSuccess(res, 201, 'Message sent', { message });
  } catch (e) { next(e); }
};

/**
 * POST /chats/create-or-open
 * Body: { rideId }
 *
 * Looks up the accepted request for the current user + ride,
 * finds or creates the chat, and returns the chat info + requestId.
 * This removes the dependency on passing requestId through multiple screens.
 */
const createOrOpenChatHandler = async (req, res, next) => {
  try {
    const { rideId } = req.body;
    if (!rideId) {
      return res.status(400).json({ success: false, message: 'rideId is required' });
    }

    const result = await createOrOpenChat(rideId, req.user.id);

    // Broadcast chat_created event via Socket.io if new chat was created
    if (result.wasCreated) {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${req.user.id}`).emit(SOCKET_EVENTS.CHAT_CREATED, {
          requestId: result.requestId,
          chatId: result.chatId,
          rideId,
        });
        // Also notify the other participant
        if (result.otherUserId) {
          io.to(`user_${result.otherUserId}`).emit(SOCKET_EVENTS.CHAT_CREATED, {
            requestId: result.requestId,
            chatId: result.chatId,
            rideId,
          });
        }
      }
    }

    sendSuccess(res, 200, 'Chat opened successfully', result);
  } catch (e) { next(e); }
};

module.exports = {
  getChatInfoHandler,
  getMessagesHandler,
  sendMessageHandler,
  createOrOpenChatHandler,
};