import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  Announcement,
  Assessment,
  Conversation,
  DB,
  Message,
  Result,
  SchoolInfo,
  Student,
  Subject,
  User,
} from '../types'
import { loadDB, resetDB, saveDB } from '../lib/db'
import { uid } from '../lib/utils'

interface DataContextValue {
  db: DB
  /* subjects */
  createSubject: (input: Omit<Subject, 'id' | 'createdAt'>) => Subject
  updateSubject: (id: string, patch: Partial<Subject>) => void
  deleteSubject: (id: string) => void
  /* assessments */
  createAssessment: (input: Omit<Assessment, 'id' | 'createdAt'>) => Assessment
  updateAssessment: (id: string, patch: Partial<Assessment>) => void
  deleteAssessment: (id: string) => void
  /* results */
  saveResult: (assessmentId: string, studentId: string, score: number, postedBy: string, remark?: string) => void
  removeResult: (assessmentId: string, studentId: string) => void
  saveResultBatch: (
    assessmentId: string,
    rows: Array<{ studentId: string; score: number; remark?: string }>,
    postedBy: string,
  ) => void
  /* chat */
  sendMessage: (
    conversationId: string,
    senderId: string,
    text: string,
    options?: { replyToId?: string | null; attachment?: Message['attachment'] },
  ) => Message | undefined
  editMessage: (id: string, text: string) => void
  deleteMessage: (id: string) => void
  toggleReaction: (messageId: string, emoji: string, userId: string) => void
  togglePinMessage: (id: string) => void
  markRead: (conversationId: string, userId: string) => void
  createConversation: (input: Omit<Conversation, 'id' | 'createdAt'>) => Conversation
  updateConversation: (id: string, patch: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  /* announcements */
  createAnnouncement: (input: Omit<Announcement, 'id' | 'createdAt'>) => Announcement
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => void
  deleteAnnouncement: (id: string) => void
  /* students */
  createStudent: (input: Omit<Student, 'id' | 'createdAt'>) => Student
  updateStudent: (id: string, patch: Partial<Student>) => void
  deleteStudent: (id: string) => void
  toggleParentLink: (studentId: string, parentId: string) => void
  /* users */
  createUser: (input: Omit<User, 'id' | 'createdAt'>) => User
  updateUser: (id: string, patch: Partial<User>) => void
  deleteUser: (id: string) => void
  /* school + maintenance */
  updateSchool: (patch: Partial<SchoolInfo>) => void
  resetDemoData: () => void
  exportJson: () => string
  importJson: (raw: string) => { ok: boolean; error?: string }
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => loadDB())
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    saveDB(db)
  }, [db])

  useEffect(() => {
    // Keep multiple tabs of the demo in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'ibnuhajar.db' && event.newValue) {
        try {
          setDb(JSON.parse(event.newValue) as DB)
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const mutate = useCallback((updater: (draft: DB) => DB) => {
    setDb((current) => updater(current))
  }, [])

  const value = useMemo<DataContextValue>(() => {
    const now = () => new Date().toISOString()

    return {
      db,

      /* ------------------------------------------------------------ subjects */
      createSubject(input) {
        const subject: Subject = { ...input, id: uid('sub'), createdAt: now() }
        mutate((current) => ({ ...current, subjects: [subject, ...current.subjects] }))
        return subject
      },
      updateSubject(id, patch) {
        mutate((current) => ({
          ...current,
          subjects: current.subjects.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: now() } : s)),
        }))
      },
      deleteSubject(id) {
        mutate((current) => {
          const assessmentIds = current.assessments.filter((a) => a.subjectId === id).map((a) => a.id)
          return {
            ...current,
            subjects: current.subjects.filter((s) => s.id !== id),
            assessments: current.assessments.filter((a) => a.subjectId !== id),
            results: current.results.filter((r) => !assessmentIds.includes(r.assessmentId)),
          }
        })
      },

      /* --------------------------------------------------------- assessments */
      createAssessment(input) {
        const assessment: Assessment = { ...input, id: uid('as'), createdAt: now() }
        mutate((current) => ({ ...current, assessments: [assessment, ...current.assessments] }))
        return assessment
      },
      updateAssessment(id, patch) {
        mutate((current) => ({
          ...current,
          assessments: current.assessments.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now() } : a)),
        }))
      },
      deleteAssessment(id) {
        mutate((current) => ({
          ...current,
          assessments: current.assessments.filter((a) => a.id !== id),
          results: current.results.filter((r) => r.assessmentId !== id),
        }))
      },

      /* ------------------------------------------------------------- results */
      saveResult(assessmentId, studentId, score, postedBy, remark) {
        mutate((current) => {
          const existing = current.results.find(
            (r) => r.assessmentId === assessmentId && r.studentId === studentId,
          )
          if (existing) {
            return {
              ...current,
              results: current.results.map((r) =>
                r.id === existing.id ? { ...r, score, remark: remark ?? r.remark, updatedAt: now() } : r,
              ),
            }
          }
          const result: Result = {
            id: uid('res'),
            assessmentId,
            studentId,
            score,
            remark,
            postedAt: now(),
            postedBy,
          }
          return { ...current, results: [...current.results, result] }
        })
      },
      removeResult(assessmentId, studentId) {
        mutate((current) => ({
          ...current,
          results: current.results.filter(
            (r) => !(r.assessmentId === assessmentId && r.studentId === studentId),
          ),
        }))
      },
      saveResultBatch(assessmentId, rows, postedBy) {
        mutate((current) => {
          let results = [...current.results]
          for (const row of rows) {
            const existing = results.find(
              (r) => r.assessmentId === assessmentId && r.studentId === row.studentId,
            )
            if (existing) {
              results = results.map((r) =>
                r.id === existing.id
                  ? { ...r, score: row.score, remark: row.remark ?? r.remark, updatedAt: now() }
                  : r,
              )
            } else {
              results = [
                ...results,
                {
                  id: uid('res'),
                  assessmentId,
                  studentId: row.studentId,
                  score: row.score,
                  remark: row.remark,
                  postedAt: now(),
                  postedBy,
                },
              ]
            }
          }
          return { ...current, results }
        })
      },

      /* ---------------------------------------------------------------- chat */
      sendMessage(conversationId, senderId, text, options) {
        const trimmed = text.trim()
        if (!trimmed && !options?.attachment) return undefined
        const message: Message = {
          id: uid('msg'),
          conversationId,
          senderId,
          text: trimmed,
          createdAt: now(),
          replyToId: options?.replyToId ?? null,
          attachment: options?.attachment ?? null,
          reactions: {},
          editedAt: null,
          pinned: false,
        }
        mutate((current) => ({
          ...current,
          messages: [...current.messages, message],
          reads: {
            ...current.reads,
            [conversationId]: { ...(current.reads[conversationId] ?? {}), [senderId]: message.createdAt },
          },
        }))
        return message
      },
      editMessage(id, text) {
        mutate((current) => ({
          ...current,
          messages: current.messages.map((m) => (m.id === id ? { ...m, text, editedAt: now() } : m)),
        }))
      },
      deleteMessage(id) {
        mutate((current) => ({
          ...current,
          messages: current.messages.map((m) =>
            m.id === id ? { ...m, deleted: true, text: '', attachment: null, reactions: {} } : m,
          ),
        }))
      },
      toggleReaction(messageId, emoji, userId) {
        mutate((current) => ({
          ...current,
          messages: current.messages.map((m) => {
            if (m.id !== messageId) return m
            const reactions = { ...(m.reactions ?? {}) }
            const users = new Set(reactions[emoji] ?? [])
            if (users.has(userId)) users.delete(userId)
            else users.add(userId)
            if (users.size === 0) delete reactions[emoji]
            else reactions[emoji] = [...users]
            return { ...m, reactions }
          }),
        }))
      },
      togglePinMessage(id) {
        mutate((current) => ({
          ...current,
          messages: current.messages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)),
        }))
      },
      markRead(conversationId, userId) {
        mutate((current) => ({
          ...current,
          reads: {
            ...current.reads,
            [conversationId]: { ...(current.reads[conversationId] ?? {}), [userId]: now() },
          },
        }))
      },
      createConversation(input) {
        const conversation: Conversation = { ...input, id: uid('conv'), createdAt: now() }
        mutate((current) => ({ ...current, conversations: [...current.conversations, conversation] }))
        return conversation
      },
      updateConversation(id, patch) {
        mutate((current) => ({
          ...current,
          conversations: current.conversations.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
      },
      deleteConversation(id) {
        mutate((current) => ({
          ...current,
          conversations: current.conversations.filter((c) => c.id !== id),
          messages: current.messages.filter((m) => m.conversationId !== id),
        }))
      },

      /* ------------------------------------------------------- announcements */
      createAnnouncement(input) {
        const announcement: Announcement = { ...input, id: uid('an'), createdAt: now() }
        mutate((current) => ({ ...current, announcements: [announcement, ...current.announcements] }))
        return announcement
      },
      updateAnnouncement(id, patch) {
        mutate((current) => ({
          ...current,
          announcements: current.announcements.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now() } : a)),
        }))
      },
      deleteAnnouncement(id) {
        mutate((current) => ({
          ...current,
          announcements: current.announcements.filter((a) => a.id !== id),
        }))
      },

      /* ------------------------------------------------------------ students */
      createStudent(input) {
        const student: Student = { ...input, id: uid('stu'), createdAt: now() }
        mutate((current) => ({ ...current, students: [...current.students, student] }))
        return student
      },
      updateStudent(id, patch) {
        mutate((current) => ({
          ...current,
          students: current.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }))
      },
      deleteStudent(id) {
        mutate((current) => ({
          ...current,
          students: current.students.filter((s) => s.id !== id),
          results: current.results.filter((r) => r.studentId !== id),
        }))
      },
      toggleParentLink(studentId, parentId) {
        mutate((current) => ({
          ...current,
          students: current.students.map((s) => {
            if (s.id !== studentId) return s
            const has = s.parentIds.includes(parentId)
            return {
              ...s,
              parentIds: has ? s.parentIds.filter((p) => p !== parentId) : [...s.parentIds, parentId],
            }
          }),
        }))
      },

      /* --------------------------------------------------------------- users */
      createUser(input) {
        const user: User = { ...input, id: uid('usr'), createdAt: now() }
        mutate((current) => ({ ...current, users: [...current.users, user] }))
        return user
      },
      updateUser(id, patch) {
        mutate((current) => ({
          ...current,
          users: current.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        }))
      },
      deleteUser(id) {
        mutate((current) => ({
          ...current,
          users: current.users.filter((u) => u.id !== id),
          students: current.students.map((s) => ({ ...s, parentIds: s.parentIds.filter((p) => p !== id) })),
          conversations: current.conversations.map((c) => ({
            ...c,
            memberIds: c.memberIds.filter((m) => m !== id),
          })),
        }))
      },

      /* --------------------------------------------------- school + settings */
      updateSchool(patch) {
        mutate((current) => ({ ...current, school: { ...current.school, ...patch } }))
      },
      resetDemoData() {
        setDb(resetDB())
      },
      exportJson() {
        return JSON.stringify(db, null, 2)
      },
      importJson(raw) {
        try {
          const parsed = JSON.parse(raw) as DB
          if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.messages)) {
            return { ok: false, error: 'That file does not look like a MADRASAT IBNUHAJAR backup.' }
          }
          setDb({ ...loadDB(), ...parsed })
          return { ok: true }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'Invalid JSON file.' }
        }
      },
    }
  }, [db, mutate])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
