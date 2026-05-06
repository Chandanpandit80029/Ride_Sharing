import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { chatAPI, requestsAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../services/socket'
import { format } from 'date-fns'

function ChatBubble({ msg, isMe }) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={isMe ? 'chat-bubble-right' : 'chat-bubble-left'}>
        <p className="text-sm leading-relaxed">{msg.text}</p>
        <p className={`text-xs mt-1 ${isMe ? 'text-amber-200' : 'text-gray-400'}`}>
          {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
        </p>
      </div>
    </div>
  )
}

function ConversationItem({ req, active, onClick }) {
  const ride = req.ride
  const other = req.requester || req.rideCreator
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
        active ? 'bg-amber-100 border border-amber-200' : 'hover:bg-amber-50'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 text-sm">
        {other?.name?.[0] || '?'}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-charcoal truncate">{other?.name || 'Unknown'}</p>
        <p className="text-xs text-muted truncate">{ride?.from} → {ride?.to}</p>
      </div>
    </button>
  )
}

export default function Chat() {
  const location = useLocation()
  const [acceptedRequests, setAcceptedRequests] = useState([])
  const [activeReqId, setActiveReqId] = useState(location.state?.requestId || null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const { user } = useAuth()
  const toast = useToast()

  useEffect(() => { fetchAcceptedRequests() }, [])

  useEffect(() => {
    if (!activeReqId) return
    fetchMessages(activeReqId)
    setupSocket(activeReqId)
    return () => {
      try {
        const sock = getSocket()
        sock.emit('leave-chat', `chat_${activeReqId}`)
        sock.off('new-message')
      } catch {}
    }
  }, [activeReqId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchAcceptedRequests = async () => {
    try {
      setLoading(true)
      const res = await requestsAPI.getAll()
      const d = res.data.data || res.data
      const inc = d.incoming || []
      const out = d.outgoing || []
      const accepted = [
        ...inc.filter(r => r.status === 'ACCEPTED' || r.status === 'accepted'),
        ...out.filter(r => r.status === 'ACCEPTED' || r.status === 'accepted'),
      ]
      setAcceptedRequests(accepted)
      // Set first if no active, or navigate from request page
      if (!activeReqId && accepted.length > 0) setActiveReqId(accepted[0].id)
      if (location.state?.requestId && accepted.find(r => r.id === location.state.requestId)) {
        setActiveReqId(location.state.requestId)
      }
    } catch {
      toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (requestId) => {
    try {
      const res = await chatAPI.getMessages(requestId)
      const d = res.data.data || res.data
      setMessages(d.messages || [])
    } catch (err) {
      if (err.response?.status !== 403) toast.error('Failed to load messages')
      setMessages([])
    }
  }

  const setupSocket = useCallback((requestId) => {
    try {
      const sock = getSocket()
      sock.emit('join-chat', `chat_${requestId}`)
      sock.off('new-message')
      sock.on('new-message', (msg) => {
        setMessages(prev => [...prev, msg])
      })
    } catch {}
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !activeReqId) return
    try {
      setSending(true)
      const res = await chatAPI.sendMessage(activeReqId, newMsg.trim())
      const d = res.data.data || res.data
      // Optimistically add or wait for socket
      setMessages(prev => [...prev, d.message || { text: newMsg.trim(), senderId: user?.id, createdAt: new Date() }])
      setNewMsg('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const activeReq = acceptedRequests.find(r => r.id === activeReqId)

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="page-hero relative overflow-hidden py-14 px-6">
        {/* Background illustration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 1200 500" className="absolute right-0 top-0 h-full w-2/3" fill="none">
            <circle cx="900" cy="160" r="75" fill="#6EE7B7" opacity="0.22"/>
            <rect x="580" y="310" width="360" height="105" rx="22" fill="#E8C87A" opacity="0.38"/>
            <rect x="620" y="250" width="280" height="80" rx="16" fill="#F5D687" opacity="0.42"/>
            <circle cx="628" cy="425" r="40" fill="#374151" opacity="0.22"/>
            <circle cx="888" cy="425" r="40" fill="#374151" opacity="0.22"/>
            <circle cx="960" cy="215" r="26" fill="#FDE68A" opacity="0.45"/>
            <rect x="949" y="241" width="22" height="60" rx="10" fill="#86EFAC" opacity="0.38"/>
            <rect x="1050" y="40" width="8" height="360" rx="4" fill="#92400E" opacity="0.28"/>
            <ellipse cx="1054" cy="40" rx="20" ry="12" fill="#FCD34D" opacity="0.42"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal leading-tight max-w-2xl">
            Chat with your college mates, coordinate rides, and make your journey{' '}
            <span className="text-primary">smooth and social.</span>
          </h1>

          {/* ── Chat UI ── */}
          <div className="mt-10 max-w-2xl bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : acceptedRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted">
                <div className="text-5xl mb-4">💬</div>
                <p className="font-display text-lg text-charcoal">No conversations yet</p>
                <p className="text-sm mt-1">Accept a ride request to start chatting</p>
              </div>
            ) : (
              <div className="flex h-[480px]">
                {/* Sidebar */}
                <div className="w-56 border-r border-gray-100 overflow-y-auto p-3 flex-shrink-0 bg-amber-50/30">
                  <p className="text-xs text-muted uppercase tracking-wider font-semibold px-2 mb-3">Chats</p>
                  {acceptedRequests.map(req => (
                    <ConversationItem
                      key={req.id}
                      req={req}
                      active={activeReqId === req.id}
                      onClick={() => setActiveReqId(req.id)}
                    />
                  ))}
                </div>

                {/* Messages panel */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Chat header */}
                  {activeReq && (
                    <div className="px-4 py-3 border-b border-gray-100 bg-amber-50/40">
                      <p className="font-semibold text-sm text-charcoal">
                        {activeReq.requester?.name || activeReq.rideCreator?.name || 'Partner'}
                      </p>
                      <p className="text-xs text-muted">
                        {activeReq.ride?.from} → {activeReq.ride?.to}
                      </p>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {messages.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-muted text-sm">
                        Say hello! 👋
                      </div>
                    ) : (
                      messages.map((msg, i) => (
                        <ChatBubble
                          key={msg.id || i}
                          msg={msg}
                          isMe={msg.senderId === user?.id || msg.sender?.id === user?.id}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={handleSend}
                    className="p-3 border-t border-gray-100 flex gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      placeholder="Chatting ..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-body"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMsg.trim()}
                      className="w-10 h-10 bg-primary hover:bg-primary-dark rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
