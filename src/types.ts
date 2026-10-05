export type Role = 'admin' | 'teacher' | 'parent'

export type AssessmentType = 'exam' | 'quiz' | 'test' | 'assignment'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  phone?: string
  title?: string
  bio?: string
  active: boolean
  createdAt: string
}

export interface Student {
  id: string
  name: string
  admissionNo: string
  className: string
  parentIds: string[]
  guardianPhone?: string
  createdAt: string
}

export interface Subject {
  id: string
  name: string
  code: string
  className: string
  teacherId: string
  description?: string
  accent: SubjectAccent
  createdAt: string
  updatedAt?: string
}

export type SubjectAccent = 'navy' | 'emerald' | 'gold' | 'violet' | 'rose' | 'cyan'

export interface Assessment {
  id: string
  title: string
  type: AssessmentType
  subjectId: string
  className: string
  term: string
  date: string
  maxScore: number
  published: boolean
  createdBy: string
  createdAt: string
  updatedAt?: string
}

export interface Result {
  id: string
  assessmentId: string
  studentId: string
  score: number
  remark?: string
  postedAt: string
  postedBy: string
  updatedAt?: string
}

export type ConversationType = 'school' | 'class' | 'direct'

export interface Conversation {
  id: string
  name: string
  type: ConversationType
  className?: string
  memberIds: string[]
  description?: string
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  createdAt: string
  editedAt?: string | null
  deleted?: boolean
  replyToId?: string | null
  reactions?: Record<string, string[]>
  attachment?: { name: string; kind: string } | null
  pinned?: boolean
}

export interface Announcement {
  id: string
  title: string
  body: string
  audience: string // 'all' or a class name
  authorId: string
  priority: 'normal' | 'high'
  pinned: boolean
  createdAt: string
  updatedAt?: string
}

export interface SchoolInfo {
  name: string
  motto: string
  term: string
  classes: string[]
  adminCode: string
}

export interface DB {
  version: number
  school: SchoolInfo
  users: User[]
  students: Student[]
  subjects: Subject[]
  assessments: Assessment[]
  results: Result[]
  conversations: Conversation[]
  messages: Message[]
  announcements: Announcement[]
  reads: Record<string, Record<string, string>> // conversationId -> userId -> lastRead ISO
}
