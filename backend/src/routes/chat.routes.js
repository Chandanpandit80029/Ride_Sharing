const express = require('express');
const router  = express.Router();

const {
  getChatInfoHandler, getMessagesHandler, sendMessageHandler,
  createOrOpenChatHandler,
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// POST /chats/create-or-open      — creates or returns existing chat by rideId (no requestId needed)
router.post('/create-or-open',     createOrOpenChatHandler);

// GET  /chats/:requestId          — chat metadata (participants, ride info)
router.get('/:requestId',          getChatInfoHandler);

// GET  /chats/:requestId/messages — paginated message history
router.get('/:requestId/messages', getMessagesHandler);

// POST /chats/:requestId/messages — REST fallback for sending (Socket.io preferred)
router.post('/:requestId/messages', sendMessageHandler);

module.exports = router;
