import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function Messages() {
  const { t } = useTranslation()
  const { partnerId } = useParams()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [partner, setPartner] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (partnerId) {
      fetchConversation()
    } else {
      fetchConversations()
    }
  }, [partnerId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/messages/conversations')
      setConversations(response.data)
    } catch (err) {
      setError(t('messages.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const [messagesRes, partnerRes] = await Promise.all([
        api.get(`/api/messages/conversation/${partnerId}`),
        api.get(`/api/users/profile/id/${partnerId}`)
      ])
      setMessages(messagesRes.data)
      setPartner(partnerRes.data)
    } catch (err) {
      setError(t('messages.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      setSending(true)
      const response = await api.post('/api/messages', {
        receiverId: parseInt(partnerId),
        content: newMessage
      })
      setMessages(prev => [...prev, response.data])
      setNewMessage('')
    } catch (err) {
      setError(err.response?.data?.message || t('messages.sendError'))
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  // Conversation list view
  if (!partnerId) {
    return (
      <div className="messages-page">
        <div className="page-header">
          <h1>{t('messages.title')}</h1>
          <p>{t('messages.subtitle')}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="conversations-list">
          {conversations.length > 0 ? (
            conversations.map(conv => (
              <Link
                key={conv.partnerId}
                to={`/messages/${conv.partnerId}`}
                className="conversation-item"
              >
                <div className="conversation-avatar">
                  {(conv.partnerDisplayName || conv.partnerUsername).charAt(0).toUpperCase()}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="conversation-name">
                      {conv.partnerDisplayName || conv.partnerUsername}
                    </span>
                    <span className="conversation-time">
                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="conversation-preview">
                    {conv.lastMessage}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="unread-badge">{conv.unreadCount}</span>
                )}
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <h3>{t('messages.noConversations')}</h3>
              <p>{t('messages.startChat')}</p>
              <Link to="/friends" className="btn btn-primary">
                {t('messages.findFriends')}
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Single conversation view
  return (
    <div className="messages-page chat-view">
      <div className="chat-header">
        <Link to="/messages" className="back-btn">&larr;</Link>
        {partner && (
          <Link to={`/profile/${partner.username}`} className="chat-partner">
            <div className="chat-avatar">
              {(partner.displayName || partner.username).charAt(0).toUpperCase()}
            </div>
            <div className="chat-partner-info">
              <span className="chat-partner-name">{partner.displayName || partner.username}</span>
              <span className="chat-partner-streak">{partner.globalDayStreak} {t('profile.dayStreak')}</span>
            </div>
          </Link>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="chat-messages">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message ${msg.isOwn ? 'message-own' : 'message-other'}`}
          >
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          type="text"
          className="form-input"
          placeholder={t('messages.typeMessage')}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
          {sending ? '...' : t('messages.send')}
        </button>
      </form>
    </div>
  )
}

export default Messages
