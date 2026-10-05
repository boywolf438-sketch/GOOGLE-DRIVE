import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  CornerUpLeft,
  FileText,
  Info,
  MoreVertical,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Send,
  Search,
  Smile,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { Conversation, Message, User } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import { Avatar, Button, Card, ConfirmDialog, EmptyState, Input } from '../components/ui'
import {
  conversationsFor,
  lastMessageOf,
  memberLabel,
  messagesOf,
  unreadCount,
  userById,
} from '../lib/selectors'
import { cx, dayLabel, formatTime, relativeTime, roleChipClass, roleLabel } from '../lib/utils'
import { getAutoReply, subscribeAutoReply } from '../lib/prefs'

const QUICK_EMOJIS = ['👍', '🤲', '❤️', '😄', '✅', '📚', '📝', '🙏', '❓', '🎉', '👏', '⚠️']
const REACTION_EMOJIS = ['👍', '🤲', '❤️', '✅', '📚', '🙏']

const ATTACHMENT_POOL = [
  { name: 'Class-Timetable.pdf', kind: 'pdf' },
  { name: 'Revision-Notes.pdf', kind: 'pdf' },
  { name: 'Homework-Guidelines.docx', kind: 'doc' },
  { name: 'Exam-Schedule.pdf', kind: 'pdf' },
  { name: 'Fee-Structure.pdf', kind: 'pdf' },
]

function useAutoReplyFlag() {
  const [enabled, setEnabled] = useState(() => getAutoReply())
  useEffect(() => subscribeAutoReply(setEnabled), [])
  return enabled
}

/* ------------------------------------------------------------------- bubbles */

function ReplyQuote({
  message,
  senderName,
  onJump,
}: {
  message: Message
  senderName: string
  onJump: () => void
}) {
  return (
    <button
      type="button"
      onClick={onJump}
      className="mb-1.5 flex w-full gap-2 rounded-lg border-l-[3px] border-brand-500 bg-navy-50/80 px-2 py-1.5 text-left transition hover:bg-navy-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-bold text-brand-700">{senderName}</span>
        <span className="line-clamp-2 block text-[12px] text-navy-600">
          {message.deleted ? 'message deleted' : message.attachment && !message.text ? `📎 ${message.attachment.name}` : message.text}
        </span>
      </span>
    </button>
  )
}

function MessageBubble({
  message,
  sender,
  isOwn,
  showHeader,
  currentUser,
  canModerate,
  replyTarget,
  replySenderName,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onJumpTo,
  highlighted,
}: {
  message: Message
  sender?: User
  isOwn: boolean
  showHeader: boolean
  currentUser: User
  canModerate: boolean
  replyTarget?: Message
  replySenderName: string
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onReact: (emoji: string) => void
  onPin: () => void
  onJumpTo: (id: string) => void
  highlighted: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const reactions = Object.entries(message.reactions ?? {}).filter(([, users]) => users.length > 0)

  return (
    <div
      id={`msg-${message.id}`}
      className={cx(
        'group flex w-full gap-2 px-3 sm:px-5',
        isOwn ? 'justify-end' : 'justify-start',
        showHeader ? 'mt-3' : 'mt-0.5',
        highlighted && 'rounded-xl bg-gold-100/60 transition',
      )}
    >
      {!isOwn ? (
        <div className="w-8 shrink-0">
          {showHeader && sender ? <Avatar name={sender.name} size="sm" seed={sender.id} /> : null}
        </div>
      ) : null}

      <div className={cx('relative max-w-[85%] min-w-0 sm:max-w-[70%] lg:max-w-[62%]', isOwn && 'items-end')}>
        <div
          className={cx(
            'relative rounded-2xl px-3 py-2 shadow-sm transition',
            isOwn
              ? 'rounded-br-md bg-navy-900 text-white'
              : 'rounded-bl-md border border-navy-100 bg-white text-navy-900',
            message.pinned && 'ring-2 ring-brand-400/70',
          )}
        >
          {showHeader && !isOwn && sender ? (
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[13px] font-bold text-navy-800">{sender.name}</span>
              <span className={cx('rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase', roleChipClass(sender.role))}>
                {roleLabel(sender.role)}
              </span>
            </div>
          ) : null}

          {message.replyToId && replyTarget ? (
            <ReplyQuote
              message={replyTarget}
              senderName={replySenderName}
              onJump={() => onJumpTo(replyTarget.id)}
            />
          ) : null}

          {message.deleted ? (
            <p className={cx('text-[13px] italic', isOwn ? 'text-navy-300' : 'text-navy-400')}>This message was deleted</p>
          ) : (
            <>
              {message.attachment ? (
                <div
                  className={cx(
                    'mb-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2',
                    isOwn ? 'bg-white/10' : 'bg-navy-50',
                  )}
                >
                  <FileText className={cx('h-4 w-4 shrink-0', isOwn ? 'text-brand-300' : 'text-navy-500')} />
                  <span className="truncate text-[12px] font-semibold">{message.attachment.name}</span>
                </div>
              ) : null}
              {message.text ? (
                <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
              ) : null}
            </>
          )}

          <div className={cx('mt-1 flex items-center justify-end gap-1.5', isOwn ? 'text-navy-300' : 'text-navy-400')}>
            {message.editedAt ? <span className="text-[10px] italic">edited</span> : null}
            {message.pinned ? <Pin className="h-3 w-3 text-brand-400" /> : null}
            <span className="text-[10px] font-medium tabular-nums">{formatTime(message.createdAt)}</span>
          </div>
        </div>

        {/* reactions */}
        {reactions.length > 0 ? (
          <div className={cx('mt-1 flex flex-wrap gap-1', isOwn && 'justify-end')}>
            {reactions.map(([emoji, users]) => {
              const mine = users.includes(currentUser.id)
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  title={`${users.length} reaction${users.length === 1 ? '' : 's'}`}
                  className={cx(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold transition',
                    mine ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-navy-100 bg-white text-navy-600 hover:bg-navy-50',
                  )}
                >
                  <span>{emoji}</span>
                  <span className="tabular-nums">{users.length}</span>
                </button>
              )
            })}
          </div>
        ) : null}

        {/* hover / tap actions */}
        <div
          className={cx(
            'absolute top-1 flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100',
            isOwn ? 'right-full mr-1' : 'left-full ml-1',
            (menuOpen || pickerOpen) && 'opacity-100',
          )}
        >
          <button
            type="button"
            onClick={() => {
              setPickerOpen((v) => !v)
              setMenuOpen(false)
            }}
            className="rounded-full border border-navy-100 bg-white p-1.5 text-navy-500 shadow-sm transition hover:bg-navy-50 hover:text-navy-800"
            aria-label="Add reaction"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v)
              setPickerOpen(false)
            }}
            className="rounded-full border border-navy-100 bg-white p-1.5 text-navy-500 shadow-sm transition hover:bg-navy-50 hover:text-navy-800"
            aria-label="Message actions"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        {pickerOpen ? (
          <div
            className={cx(
              'absolute z-20 mt-1 flex gap-1 rounded-xl border border-navy-100 bg-white p-1.5 shadow-pop animate-pop',
              isOwn ? 'right-0' : 'left-0',
            )}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact(emoji)
                  setPickerOpen(false)
                }}
                className="rounded-lg px-1.5 py-1 text-base transition hover:bg-navy-50"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        {menuOpen ? (
          <div
            className={cx(
              'absolute z-20 mt-1 w-40 overflow-hidden rounded-xl border border-navy-100 bg-white py-1 text-left shadow-pop animate-pop',
              isOwn ? 'right-0' : 'left-0',
            )}
          >
            <button
              type="button"
              onClick={() => {
                onReply()
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-navy-700 hover:bg-navy-50"
            >
              <CornerUpLeft className="h-3.5 w-3.5" /> Reply
            </button>
            {isOwn && !message.deleted ? (
              <button
                type="button"
                onClick={() => {
                  onEdit()
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-navy-700 hover:bg-navy-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            ) : null}
            {canModerate ? (
              <button
                type="button"
                onClick={() => {
                  onPin()
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-navy-700 hover:bg-navy-50"
              >
                {message.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                {message.pinned ? 'Unpin' : 'Pin message'}
              </button>
            ) : null}
            {isOwn || canModerate ? (
              <button
                type="button"
                onClick={() => {
                  onDelete()
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ chat pane */

function ChatWindow({
  conversation,
  onBack,
}: {
  conversation: Conversation
  onBack?: () => void
}) {
  const { user } = useAuth()
  const { db, sendMessage, editMessage, deleteMessage, toggleReaction, togglePinMessage, markRead } = useData()
  const { success, info } = useToast()
  const autoReply = useAutoReplyFlag()

  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [attachment, setAttachment] = useState<Message['attachment']>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Message | null>(null)
  const [typingUser, setTypingUser] = useState<User | null>(null)
  const [showJump, setShowJump] = useState(false)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastReplyAt = useRef(0)

  const messages = useMemo(() => messagesOf(db, conversation.id), [db, conversation.id])
  const filtered = useMemo(() => {
    if (!searchOpen || !query.trim()) return messages
    const q = query.trim().toLowerCase()
    return messages.filter((m) => m.text.toLowerCase().includes(q) || m.attachment?.name.toLowerCase().includes(q))
  }, [messages, query, searchOpen])

  const members = useMemo(
    () => conversation.memberIds.map((id) => userById(db, id)).filter((u): u is User => Boolean(u)),
    [db, conversation.memberIds],
  )
  const pinned = [...messages].reverse().find((m) => m.pinned && !m.deleted)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current
    if (!el) return
    // `scrollTo` with options is missing in some embedded webviews — degrade gracefully.
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior })
    else el.scrollTop = el.scrollHeight
  }, [])

  useLayoutEffect(() => {
    scrollToBottom('auto')
  }, [conversation.id, scrollToBottom])

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    if (user) markRead(conversation.id, user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, messages.length, user?.id])

  useEffect(() => {
    setDraft('')
    setReplyTo(null)
    setEditing(null)
    setAttachment(null)
    setEmojiOpen(false)
    setSearchOpen(false)
    setQuery('')
  }, [conversation.id])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 260)
  }

  const jumpTo = (id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (!el) {
      info('That message is not in the current view.')
      return
    }
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    else el.scrollTop = el.offsetTop
    setHighlightId(id)
    window.setTimeout(() => setHighlightId(null), 1600)
  }

  const submit = () => {
    if (!user) return
    if (editing) {
      if (!draft.trim()) return
      editMessage(editing.id, draft.trim())
      setEditing(null)
      setDraft('')
      success('Message updated.')
      return
    }
    if (!draft.trim() && !attachment) return
    sendMessage(conversation.id, user.id, draft, { replyToId: replyTo?.id ?? null, attachment })
    setDraft('')
    setReplyTo(null)
    setAttachment(null)
    setEmojiOpen(false)
    window.setTimeout(() => scrollToBottom('smooth'), 40)

    /* Demo auto-reply so the chat feels alive (rate limited). */
    if (!autoReply) return
    const now = Date.now()
    if (now - lastReplyAt.current < 12000) return
    const others = members.filter((m) => m.id !== user.id)
    if (others.length === 0) return
    lastReplyAt.current = now
    const responder = others[Math.floor(Math.random() * others.length)]
    const replies = [
      'Jazakallahu khairan for the update.',
      'Noted, thank you. We will follow up at home inshaallah.',
      'Barakallahu feek. Kindly share any extra revision material.',
      'Understood. Shall we discuss this on Saturday after the meeting?',
      'Well received. I appreciate the quick response.',
    ]
    const text = replies[Math.floor(Math.random() * replies.length)]
    window.setTimeout(() => setTypingUser(responder), 700)
    window.setTimeout(() => {
      setTypingUser(null)
      sendMessage(conversation.id, responder.id, text, { replyToId: null })
    }, 2400)
  }

  if (!user) return null

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
    if (event.key === 'Escape') {
      setEditing(null)
      setReplyTo(null)
    }
  }

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }

  let lastSender = ''
  let lastTime = 0
  let lastDay = ''

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-navy-100 lg:shadow-card">
      {/* header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-navy-100 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 rounded-xl p-2 text-navy-700 transition hover:bg-navy-100 lg:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
        <Avatar
          name={conversation.name}
          size="md"
          seed={conversation.id}
          soft={false}
          className={conversation.type === 'direct' ? '' : 'rounded-xl'}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-bold text-navy-900">{conversation.name}</h2>
            {conversation.type === 'class' ? (
              <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 uppercase sm:inline">
                Class group
              </span>
            ) : conversation.type === 'school' ? (
              <span className="hidden rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-700 uppercase sm:inline">
                Whole school
              </span>
            ) : null}
          </div>
          <p className="truncate text-[11px] text-navy-500">
            {typingUser ? (
              <span className="font-semibold text-brand-600">{typingUser.name} is typing…</span>
            ) : (
              memberLabel(db, conversation)
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchOpen((v) => !v)
            setQuery('')
          }}
          className={cx(
            'rounded-xl p-2 transition',
            searchOpen ? 'bg-navy-100 text-navy-900' : 'text-navy-500 hover:bg-navy-100 hover:text-navy-800',
          )}
          aria-label="Search messages"
        >
          <Search className="h-4.5 w-4.5" />
        </button>
      </header>

      {searchOpen ? (
        <div className="shrink-0 border-b border-navy-100 bg-navy-50/60 px-3 py-2 sm:px-4">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this conversation…"
            className="py-2"
          />
          {query ? (
            <p className="mt-1.5 text-[11px] font-semibold text-navy-500">
              {filtered.length} matching message{filtered.length === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      ) : null}

      {pinned && !searchOpen ? (
        <button
          type="button"
          onClick={() => jumpTo(pinned.id)}
          className="flex shrink-0 items-center gap-2 border-b border-brand-100 bg-brand-50/70 px-3 py-2 text-left sm:px-4"
        >
          <Pin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold tracking-wide text-brand-700 uppercase">Pinned message</span>
            <span className="block truncate text-[12px] text-navy-700">{pinned.text}</span>
          </span>
        </button>
      ) : null}

      {/* messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scroll-slim chat-canvas relative min-h-0 flex-1 overflow-y-auto py-3"
      >
        {conversation.description && conversation.type !== 'direct' ? (
          <div className="mx-auto mb-3 max-w-lg rounded-xl bg-white/80 px-4 py-3 text-center">
            <Users className="mx-auto h-5 w-5 text-navy-400" />
            <p className="mt-1.5 text-[13px] font-bold text-navy-800">{conversation.name}</p>
            <p className="text-[12px] text-navy-500">{conversation.description}</p>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Send className="h-6 w-6" />}
            title={searchOpen && query ? 'No messages match your search' : 'No messages yet'}
            message={
              searchOpen && query
                ? 'Try a different keyword or clear the search.'
                : 'Say assalamu alaikum and start the conversation with parents and teachers.'
            }
          />
        ) : (
          filtered.map((message) => {
            const sender = userById(db, message.senderId)
            const isOwn = message.senderId === user.id
            const time = new Date(message.createdAt).getTime()
            const day = dayLabel(message.createdAt)
            const newDay = day !== lastDay
            const showHeader = newDay || message.senderId !== lastSender || time - lastTime > 5 * 60 * 1000
            const replyTarget = message.replyToId ? messages.find((m) => m.id === message.replyToId) : undefined
            lastDay = day
            lastSender = message.senderId
            lastTime = time
            const canModerate = user.role === 'admin' || user.role === 'teacher'
            return (
              <div key={message.id}>
                {newDay ? (
                  <div className="my-3 flex items-center justify-center">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-navy-600 shadow-sm">
                      {day}
                    </span>
                  </div>
                ) : null}
                <MessageBubble
                  message={message}
                  sender={sender}
                  isOwn={isOwn}
                  showHeader={showHeader}
                  currentUser={user}
                  canModerate={canModerate}
                  replyTarget={replyTarget}
                  replySenderName={userById(db, replyTarget?.senderId)?.name ?? 'Message'}
                  highlighted={highlightId === message.id}
                  onReply={() => {
                    setReplyTo(message)
                    setEditing(null)
                    inputRef.current?.focus()
                  }}
                  onEdit={() => {
                    setEditing(message)
                    setDraft(message.text)
                    setReplyTo(null)
                    inputRef.current?.focus()
                  }}
                  onDelete={() => setConfirmDelete(message)}
                  onReact={(emoji) => toggleReaction(message.id, emoji, user.id)}
                  onPin={() => {
                    togglePinMessage(message.id)
                    info(message.pinned ? 'Message unpinned.' : 'Message pinned.')
                  }}
                  onJumpTo={jumpTo}
                />
              </div>
            )
          })
        )}

        {typingUser ? (
          <div className="mt-3 flex items-center gap-2 px-3 sm:px-5">
            <Avatar name={typingUser.name} size="sm" seed={typingUser.id} />
            <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-navy-100 bg-white px-3 py-2.5 shadow-sm">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="typing-dot h-1.5 w-1.5 rounded-full bg-navy-400"
                  style={{ animationDelay: `${i * 140}ms` }}
                />
              ))}
            </span>
          </div>
        ) : null}
      </div>

      {showJump ? (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute right-4 bottom-24 z-20 rounded-full border border-navy-100 bg-white p-2.5 text-navy-600 shadow-pop lg:bottom-28"
          aria-label="Jump to latest messages"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      ) : null}

      {/* composer */}
      <div className="shrink-0 border-t border-navy-100 bg-white px-3 py-2.5 sm:px-4">
        {editing ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-gold-100 px-3 py-1.5">
            <Pencil className="h-3.5 w-3.5 shrink-0 text-gold-700" />
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-gold-700">Editing message</span>
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setDraft('')
              }}
              className="rounded-lg p-1 text-gold-700 hover:bg-white/60"
              aria-label="Cancel editing"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {replyTo ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-navy-50 px-3 py-1.5">
            <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-navy-600" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-bold text-navy-800">
                Replying to {userById(db, replyTo.senderId)?.name ?? 'message'}
              </span>
              <span className="block truncate text-[11px] text-navy-500">{replyTo.text}</span>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="rounded-lg p-1 text-navy-500 hover:bg-white"
              aria-label="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {attachment ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5">
            <FileText className="h-3.5 w-3.5 shrink-0 text-brand-700" />
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-brand-800">{attachment.name}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="rounded-lg p-1 text-brand-700 hover:bg-white"
              aria-label="Remove attachment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {emojiOpen ? (
          <div className="mb-2 grid grid-cols-6 gap-1 rounded-xl border border-navy-100 bg-white p-2 shadow-sm sm:grid-cols-12">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setDraft((d) => `${d}${emoji}`)
                  inputRef.current?.focus()
                }}
                className="rounded-lg py-1.5 text-lg transition hover:bg-navy-50"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            className={cx(
              'rounded-xl p-2.5 transition',
              emojiOpen ? 'bg-navy-100 text-navy-900' : 'text-navy-500 hover:bg-navy-100 hover:text-navy-800',
            )}
            aria-label="Insert emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const next = ATTACHMENT_POOL[Math.floor(Math.random() * ATTACHMENT_POOL.length)]
              setAttachment(next)
              info(`${next.name} attached — add a note and send.`)
            }}
            className="rounded-xl p-2.5 text-navy-500 transition hover:bg-navy-100 hover:text-navy-800"
            aria-label="Attach a document"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            onChange={(e) => {
              setDraft(e.target.value)
              autoGrow(e.target)
            }}
            onKeyDown={onKeyDown}
            placeholder={editing ? 'Update your message…' : `Message ${conversation.name}…`}
            className="scroll-slim max-h-[132px] min-h-11 flex-1 resize-none rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed shadow-sm transition placeholder:text-navy-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
          />
          <Button
            variant="success"
            size="icon"
            onClick={submit}
            disabled={!editing && !draft.trim() && !attachment}
            aria-label={editing ? 'Save message' : 'Send message'}
            className="h-11 w-11 shrink-0"
          >
            {editing ? <Pencil className="h-4.5 w-4.5" /> : <Send className="h-4.5 w-4.5" />}
          </Button>
        </div>
        <p className="mt-1 hidden text-[10px] text-navy-400 sm:block">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this message?"
        message="The message will be removed for everyone in the conversation. This cannot be undone."
        confirmLabel="Delete message"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMessage(confirmDelete.id)
          setConfirmDelete(null)
          success('Message deleted.')
        }}
      />
    </div>
  )
}

/* --------------------------------------------------------------- conversation list */

function ConversationRow({
  conversation,
  active,
  userId,
}: {
  conversation: Conversation
  active: boolean
  userId: string
}) {
  const { db } = useData()
  const last = lastMessageOf(db, conversation.id)
  const sender = userById(db, last?.senderId)
  const unread = unreadCount(db, conversation.id, userId)

  return (
    <Link
      to={`/chat/${conversation.id}`}
      className={cx(
        'flex items-start gap-3 border-b border-navy-50 px-3 py-3 transition',
        active ? 'bg-navy-100/70' : 'hover:bg-navy-50',
      )}
    >
      <Avatar name={conversation.name} size="lg" seed={conversation.id} soft={conversation.type === 'direct'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-navy-900">{conversation.name}</p>
          {last ? <span className="shrink-0 text-[10px] text-navy-400">{relativeTime(last.createdAt)}</span> : null}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p className={cx('min-w-0 flex-1 truncate text-[12px]', unread ? 'font-semibold text-navy-700' : 'text-navy-500')}>
            {last ? (
              <>
                {sender && sender.id !== userId ? <span className="font-semibold text-navy-700">{sender.name.split(' ')[0]}: </span> : null}
                {last.deleted ? 'message deleted' : last.attachment && !last.text ? `📎 ${last.attachment.name}` : last.text}
              </>
            ) : (
              'No messages yet'
            )}
          </p>
          {unread > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export default function ChatPage() {
  const { user } = useAuth()
  const { db } = useData()
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const conversations = useMemo(() => (user ? conversationsFor(db, user) : []), [db, user])
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q),
    )
  }, [conversations, search])

  const active = conversations.find((c) => c.id === conversationId)
  const groups: Array<{ label: string; items: Conversation[] }> = [
    { label: 'Class groups', items: visible.filter((c) => c.type === 'class') },
    { label: 'Direct messages', items: visible.filter((c) => c.type === 'direct') },
    { label: 'Whole school', items: visible.filter((c) => c.type === 'school') },
  ]

  if (!user) return null

  return (
    <div className="flex min-h-0 flex-1 gap-0 pb-[76px] lg:gap-4 lg:pb-4">
      {/* list */}
      <aside
        className={cx(
          'flex min-h-0 flex-col bg-white lg:w-80 lg:shrink-0 lg:rounded-2xl lg:border lg:border-navy-100 lg:shadow-card',
          conversationId ? 'hidden lg:flex' : 'flex w-full',
        )}
      >
        <div className="shrink-0 border-b border-navy-100 px-3 py-3 lg:px-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-900">Messages</h2>
            <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-bold text-navy-700">
              {conversations.length}
            </span>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="py-2"
            type="search"
          />
        </div>
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <EmptyState icon={<Search className="h-5 w-5" />} title="No conversations found" message="Try a different search term." />
          ) : (
            groups.map((group) =>
              group.items.length === 0 ? null : (
                <div key={group.label}>
                  <p className="bg-navy-50/70 px-3 py-1.5 text-[10px] font-bold tracking-wider text-navy-500 uppercase lg:px-4">
                    {group.label}
                  </p>
                  {group.items.map((conversation) => (
                    <ConversationRow
                      key={conversation.id}
                      conversation={conversation}
                      active={conversation.id === conversationId}
                      userId={user.id}
                    />
                  ))}
                </div>
              ),
            )
          )}
        </div>
        <div className="hidden shrink-0 items-start gap-2 border-t border-navy-100 bg-navy-50/60 px-4 py-3 lg:flex">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-400" />
          <p className="text-[11px] leading-relaxed text-navy-500">
            Messages are stored on this device for the demo. Teachers and admins can pin and moderate messages.
          </p>
        </div>
      </aside>

      {/* window */}
      <section className={cx('min-h-0 flex-1 flex-col', conversationId ? 'flex' : 'hidden lg:flex')}>
        {active ? (
          <ChatWindow conversation={active} onBack={() => navigate('/chat')} />
        ) : (
          <Card className="flex min-h-0 flex-1 items-center justify-center">
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="Select a conversation"
              message="Choose a class group or a direct message on the left to start chatting with parents and teachers."
            />
          </Card>
        )}
      </section>
    </div>
  )
}
