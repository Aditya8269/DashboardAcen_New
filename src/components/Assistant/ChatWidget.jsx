import { useEffect, useRef, useState } from 'react'
import MaterialIcon from '../Master/MaterialIcon.jsx'
import FormattedText from './FormattedText.jsx'
import { getOfflineAnswer } from './offlineHelp.js'
import './ChatWidget.css'

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || '/api/chat'
const STORAGE_KEY = 'etms-assistant-chat'

const SUGGESTIONS = [
  'Driver ne route refuse kar diya, ab kya karu?',
  'How do I reassign a vehicle to a route?',
  'What does "Not Started" mean?',
  'Guard is not assigned for a night trip',
]

// Thrown when the AI backend isn't set up (no API key) or isn't deployed - we answer from built-in help instead.
class AiUnavailableError extends Error {}

const loadHistory = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

// Floating AI assistant, rendered on every page by MasterLayout.
// `context` is a short text description of the current page sent along with each question.
// `open` / `onOpenChange` are controlled by MasterLayout so pages can open the assistant.
function ChatWidget({ context = '', open, onOpenChange }) {
  const setOpen = (value) => onOpenChange(typeof value === 'function' ? value(open) : value)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const abortRef = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch { /* storage unavailable - chat still works for this session */ }
  }, [messages])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, open, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = async (text) => {
    const question = text.trim()
    if (!question || loading) return
    setError('')
    setInput('')

    const history = [...messages, { role: 'user', content: question }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller
    let reply = ''
    let replyIsOffline = false

    try {
      let response
      try {
        response = await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Only real AI turns are sent as history; built-in help answers stay local.
          body: JSON.stringify({ messages: history.filter((m) => !m.offline), context }),
          signal: controller.signal,
        })
      } catch (err) {
        if (err.name === 'AbortError') throw err
        throw new AiUnavailableError()
      }

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        if (data.code === 'not_configured' || response.status === 404 || response.status === 405) throw new AiUnavailableError()
        throw new Error(data.error || 'The assistant is unavailable right now. Please try again.')
      }

      setOffline(false)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages([...history, { role: 'assistant', content: reply }])
      }
    } catch (err) {
      if (err instanceof AiUnavailableError) {
        setOffline(true)
        reply = getOfflineAnswer(question)
        replyIsOffline = true
      } else if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      // Drop an empty assistant bubble (failed or stopped before any text arrived).
      setMessages(reply.trim() ? [...history, { role: 'assistant', content: reply, offline: replyIsOffline }] : history)
      setLoading(false)
      abortRef.current = null
    }
  }

  const stop = () => abortRef.current?.abort()

  const clearChat = () => {
    stop()
    setMessages([])
    setError('')
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send(input)
    }
  }

  const lastMessage = messages[messages.length - 1]

  return (
    <div className={`chat-widget ${open ? 'is-open' : ''}`}>
      {open && (
        <section className="chat-panel" role="dialog" aria-label="eTMS Assistant">
          <header className="chat-panel__head">
            <span className="chat-panel__avatar"><MaterialIcon name="smart_toy" /></span>
            <div className="chat-panel__title">
              <strong>eTMS Assistant</strong>
              <small className={offline ? 'is-offline' : ''}><i /> {offline ? 'Built-in help mode (AI not connected)' : 'AI help · Ask anything about eTMS'}</small>
            </div>
            {messages.length > 0 && (
              <button type="button" className="chat-panel__icon-btn" onClick={clearChat} aria-label="Start a new chat" title="New chat"><MaterialIcon name="restart_alt" /></button>
            )}
            <button type="button" className="chat-panel__icon-btn" onClick={() => setOpen(false)} aria-label="Close assistant" title="Close"><MaterialIcon name="close" /></button>
          </header>

          <div className="chat-panel__body" ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="chat-bubble chat-bubble--assistant">
                  <p><strong>Namaste! 👋</strong> I’m your eTMS Assistant.</p>
                  <p>Tell me your problem - routes, drivers, guards, vehicles, reports - and I’ll help you solve it step by step.</p>
                </div>
                <p className="chat-welcome__label">Try asking</p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button type="button" key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              message.content && (
                <div key={index} className={`chat-bubble chat-bubble--${message.role}`}>
                  {message.role === 'assistant' ? <FormattedText text={message.content} /> : <p>{message.content}</p>}
                  {message.offline && <span className="chat-bubble__tag">Built-in help</span>}
                  {loading && index === messages.length - 1 && message.role === 'assistant' && <span className="chat-cursor" aria-hidden="true" />}
                </div>
              )
            ))}

            {loading && !lastMessage?.content && (
              <div className="chat-bubble chat-bubble--assistant chat-typing" aria-label="Assistant is typing"><span /><span /><span /></div>
            )}

            {error && (
              <div className="chat-error" role="alert">
                <MaterialIcon name="error_outline" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <form className="chat-panel__composer" onSubmit={(event) => { event.preventDefault(); send(input) }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={4000}
              placeholder="Type your problem or question..."
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Message the assistant"
            />
            {loading
              ? <button type="button" className="chat-send is-stop" onClick={stop} aria-label="Stop response"><MaterialIcon name="stop" /></button>
              : <button type="submit" className="chat-send" disabled={!input.trim()} aria-label="Send message"><MaterialIcon name="send" /></button>}
          </form>
          <p className="chat-panel__note">AI can make mistakes. Please verify important details.</p>
        </section>
      )}

      <button type="button" className="chat-fab" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close assistant' : 'Open AI assistant'} aria-expanded={open}>
        <MaterialIcon name={open ? 'close' : 'chat'} />
        {!open && <span className="chat-fab__label">Ask AI</span>}
      </button>
    </div>
  )
}

export default ChatWidget
