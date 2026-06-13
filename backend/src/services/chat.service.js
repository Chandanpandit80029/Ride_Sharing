const prisma = require('../config/db');

const appError = (msg, code = 400) => Object.assign(new Error(msg), { statusCode: code });

// ─── Internal helper ──────────────────────────────────────────────────────────
/**
 * Fetch the chat for a given requestId, verifying that userId is a participant
 * and the request is in ACCEPTED state.
 */
const getChatByRequestId = async (requestId, userId) => {
  const request = await prisma.request.findUnique({
    where  : { id: requestId },
    include: { chat: true },
  });

  if (!request)                    throw appError('Request not found', 404);
  if (request.status !== 'ACCEPTED') throw appError('Chat is only available for accepted ride requests', 403);

  const isParticipant =
    request.requesterId === userId || request.rideCreatorId === userId;
  if (!isParticipant)              throw appError('Unauthorized: you are not a participant of this chat', 403);

  if (!request.chat)               throw appError('Chat room not found for this request', 404);

  return request.chat;
};

// ─── Get Messages ─────────────────────────────────────────────────────────────
const getMessages = async (requestId, userId, page = 1, limit = 50) => {
  const chat = await getChatByRequestId(requestId, userId);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where  : { chatId: chat.id },
      skip,
      take   : limit,
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, rollNo: true, profilePic: true } } },
    }),
    prisma.message.count({ where: { chatId: chat.id } }),
  ]);

  return {
    chatId    : chat.id,
    messages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

// ─── Send Message (REST fallback — Socket.io is preferred) ────────────────────
const sendMessage = async (requestId, senderId, text) => {
  const chat = await getChatByRequestId(requestId, senderId);

  return prisma.message.create({
    data   : { chatId: chat.id, senderId, text: text.trim() },
    include: { sender: { select: { id: true, name: true, rollNo: true, profilePic: true } } },
  });
};

// ─── Get Chat Info ────────────────────────────────────────────────────────────
/**
 * Returns chat metadata (participants, request info) — useful for the frontend
 * to render the chat header.
 */
const getChatInfo = async (requestId, userId) => {
  const request = await prisma.request.findUnique({
    where  : { id: requestId },
    include: {
      ride    : true,
      requester: { select: { id: true, name: true, rollNo: true, phone: true } },
      rideCreator: { select: { id: true, name: true, rollNo: true, phone: true } },
      chat    : { select: { id: true, createdAt: true } },
    },
  });

  if (!request)                    throw appError('Request not found', 404);
  if (request.status !== 'ACCEPTED') throw appError('Chat is only accessible for accepted requests', 403);

  const isParticipant =
    request.requesterId === userId || request.rideCreatorId === userId;
  if (!isParticipant)              throw appError('Unauthorized: not a participant', 403);

  if (!request.chat)               throw appError('Chat room not found', 404);

  return {
    chatId      : request.chat.id,
    createdAt   : request.chat.createdAt,
    ride        : request.ride,
    requester   : request.requester,
    rideCreator : request.rideCreator,
    phoneShared : request.phoneShared,
    currentUserId: userId,
  };
};

// ─── Create or Open Chat (by rideId) ──────────────────────────────────────────
/**
 * Given a rideId and userId:
 * 1. Finds the accepted request where userId is a participant.
 * 2. If a chat already exists, returns it.
 * 3. If no chat exists, creates one.
 * 4. Returns requestId, chatId, and whether it was newly created.
 *
 * This endpoint removes the dependency on passing requestId through multiple screens.
 */
const createOrOpenChat = async (rideId, userId) => {
  // Find the accepted request for this ride where user is a participant
  const request = await prisma.request.findFirst({
    where: {
      rideId,
      status: 'ACCEPTED',
      OR: [
        { requesterId: userId },
        { rideCreatorId: userId },
      ],
    },
    include: { chat: true },
  });

  if (!request) {
    throw appError('No accepted request found for this ride. You are not a participant.', 404);
  }

  // Determine the other participant's user ID
  const otherUserId = request.requesterId === userId
    ? request.rideCreatorId
    : request.requesterId;

  // If chat already exists, return it
  if (request.chat) {
    return {
      requestId: request.id,
      chatId: request.chat.id,
      wasCreated: false,
      otherUserId,
    };
  }

  // Create a new chat for this request
  const chat = await prisma.chat.create({
    data: { requestId: request.id },
  });

  return {
    requestId: request.id,
    chatId: chat.id,
    wasCreated: true,
    otherUserId,
  };
};

module.exports = {
  getChatByRequestId,
  getMessages,
  sendMessage,
  getChatInfo,
  createOrOpenChat,
};