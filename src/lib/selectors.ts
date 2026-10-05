import type { Announcement, Assessment, Conversation, DB, Message, Student, Subject, User } from '../types'
import { percentage } from './grades'
import { average } from './utils'

export function userById(db: DB, id?: string | null): User | undefined {
  if (!id) return undefined
  return db.users.find((u) => u.id === id)
}

export function studentById(db: DB, id?: string | null): Student | undefined {
  if (!id) return undefined
  return db.students.find((s) => s.id === id)
}

export function subjectById(db: DB, id?: string | null): Subject | undefined {
  if (!id) return undefined
  return db.subjects.find((s) => s.id === id)
}

export function assessmentById(db: DB, id?: string | null): Assessment | undefined {
  if (!id) return undefined
  return db.assessments.find((a) => a.id === id)
}

export function studentsInClass(db: DB, className: string): Student[] {
  return db.students
    .filter((s) => s.className === className)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function childrenOf(db: DB, parentId: string): Student[] {
  return db.students.filter((s) => s.parentIds.includes(parentId)).sort((a, b) => a.name.localeCompare(b.name))
}

export function parentsOf(db: DB, student: Student): User[] {
  return student.parentIds.map((id) => userById(db, id)).filter((u): u is User => Boolean(u))
}

export function unlinkedParents(db: DB): User[] {
  const linked = new Set(db.students.flatMap((s) => s.parentIds))
  return db.users.filter((u) => u.role === 'parent' && !linked.has(u.id))
}

export function subjectsVisibleTo(db: DB, user: User): Subject[] {
  const sorted = [...db.subjects].sort((a, b) => a.name.localeCompare(b.name))
  if (user.role === 'teacher') {
    const mine = sorted.filter((s) => s.teacherId === user.id)
    const others = sorted.filter((s) => s.teacherId !== user.id)
    return [...mine, ...others]
  }
  if (user.role === 'parent') {
    const classes = new Set(childrenOf(db, user.id).map((s) => s.className))
    return sorted.filter((s) => classes.has(s.className))
  }
  return sorted
}

export function assessmentsVisibleTo(db: DB, user: User): Assessment[] {
  const list = [...db.assessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  if (user.role === 'parent') {
    const classes = new Set(childrenOf(db, user.id).map((s) => s.className))
    return list.filter((a) => classes.has(a.className) && a.published)
  }
  if (user.role === 'teacher') {
    const mine = list.filter((a) => a.createdBy === user.id || subjectById(db, a.subjectId)?.teacherId === user.id)
    const rest = list.filter((a) => !mine.includes(a))
    return [...mine, ...rest]
  }
  return list
}

export function resultsForAssessment(db: DB, assessmentId: string) {
  return db.results.filter((r) => r.assessmentId === assessmentId)
}

export function resultFor(db: DB, assessmentId: string, studentId: string) {
  return db.results.find((r) => r.assessmentId === assessmentId && r.studentId === studentId)
}

export function resultsForStudent(db: DB, studentId: string) {
  return db.results
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
}

export interface StudentResultRow {
  resultId: string
  assessment: Assessment
  subject: Subject | undefined
  score: number
  maxScore: number
  percent: number
  postedAt: string
}

export function resultRowsForStudent(db: DB, studentId: string): StudentResultRow[] {
  const rows: StudentResultRow[] = []
  for (const result of db.results) {
    if (result.studentId !== studentId) continue
    const assessment = assessmentById(db, result.assessmentId)
    if (!assessment) continue
    if (assessment.className && studentById(db, studentId)?.className !== assessment.className) continue
    rows.push({
      resultId: result.id,
      assessment,
      subject: subjectById(db, assessment.subjectId),
      score: result.score,
      maxScore: assessment.maxScore,
      percent: percentage(result.score, assessment.maxScore),
      postedAt: result.updatedAt ?? result.postedAt,
    })
  }
  return rows.sort((a, b) => new Date(b.assessment.date).getTime() - new Date(a.assessment.date).getTime())
}

export function studentAveragePercent(db: DB, studentId: string): number {
  const rows = resultRowsForStudent(db, studentId)
  return average(rows.map((r) => r.percent))
}

export function classAveragePercent(db: DB, className: string): number {
  const ids = studentsInClass(db, className).map((s) => s.id)
  const values = ids.flatMap((id) => resultRowsForStudent(db, id).map((r) => r.percent))
  return average(values)
}

export function subjectAverageForStudent(db: DB, studentId: string, subjectId: string): number {
  return average(resultRowsForStudent(db, studentId).filter((r) => r.assessment.subjectId === subjectId).map((r) => r.percent))
}

export function assessmentStats(db: DB, assessmentId: string) {
  const assessment = assessmentById(db, assessmentId)
  if (!assessment) return { count: 0, average: 0, highest: 0, lowest: 0, pending: 0 }
  const scores = resultsForAssessment(db, assessmentId).map((r) => r.score)
  const enrolled = studentsInClass(db, assessment.className).length
  return {
    count: scores.length,
    average: average(scores),
    highest: scores.length ? Math.max(...scores) : 0,
    lowest: scores.length ? Math.min(...scores) : 0,
    pending: Math.max(0, enrolled - scores.length),
  }
}

export function conversationsFor(db: DB, user: User): Conversation[] {
  const classes =
    user.role === 'parent' ? new Set(childrenOf(db, user.id).map((s) => s.className)) : new Set(db.school.classes)
  return db.conversations
    .filter((c) => {
      if (c.type === 'school') return true
      if (c.type === 'class') return c.className ? classes.has(c.className) : c.memberIds.includes(user.id)
      return c.memberIds.includes(user.id)
    })
    .sort((a, b) => {
      if (a.type !== b.type) {
        const order: Record<string, number> = { school: 0, class: 1, direct: 2 }
        return order[a.type] - order[b.type]
      }
      return a.name.localeCompare(b.name)
    })
}

export function messagesOf(db: DB, conversationId: string): Message[] {
  return db.messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function lastMessageOf(db: DB, conversationId: string): Message | undefined {
  const list = messagesOf(db, conversationId)
  return list[list.length - 1]
}

export function unreadCount(db: DB, conversationId: string, userId: string): number {
  const since = db.reads[conversationId]?.[userId]
  const sinceTime = since ? new Date(since).getTime() : 0
  return db.messages.filter(
    (m) =>
      m.conversationId === conversationId &&
      m.senderId !== userId &&
      new Date(m.createdAt).getTime() > sinceTime,
  ).length
}

export function totalUnread(db: DB, user: User): number {
  return conversationsFor(db, user).reduce((sum, c) => sum + unreadCount(db, c.id, user.id), 0)
}

export function announcementsFor(db: DB, user: User): Announcement[] {
  const classes =
    user.role === 'parent'
      ? new Set(childrenOf(db, user.id).map((s) => s.className))
      : new Set(db.school.classes)
  return db.announcements
    .filter((a) => a.audience === 'all' || classes.has(a.audience))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export function conversationsForClass(db: DB, className: string): Conversation | undefined {
  return db.conversations.find((c) => c.type === 'class' && c.className === className)
}

export function memberLabel(db: DB, conversation: Conversation): string {
  if (conversation.type === 'school') return `All parents & staff · ${db.users.length} members`
  if (conversation.type === 'class') {
    const count = db.students.filter((s) => s.className === conversation.className).length
    return `${conversation.className} · ${count} learners`
  }
  return conversation.description ?? 'Direct message'
}
