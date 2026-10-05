import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  BookMarked,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Layers,
  Megaphone,
  MessageSquare,
  Plus,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import type { User } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Avatar, Badge, Button, Card, EmptyState, ProgressBar, Ring, SectionTitle, Segmented } from '../components/ui'
import { AnnouncementCard, AssessmentChip, ScoreBar, StatTile, SubjectCard } from '../components/shared'
import {
  announcementsFor,
  assessmentsVisibleTo,
  childrenOf,
  classAveragePercent,
  conversationsFor,
  lastMessageOf,
  resultRowsForStudent,
  studentAveragePercent,
  studentsInClass,
  subjectById,
  subjectsVisibleTo,
  totalUnread,
  userById,
} from '../lib/selectors'
import {
  accentOf,
  assessmentTypeLabel,
  cx,
  formatDate,
  relativeTime,
  roleLabel,
  round,
} from '../lib/utils'
import { gradeForPercent, GRADE_LEGEND } from '../lib/grades'

function Hero({ user, chips }: { user: User; chips: Array<{ icon: typeof Bell; label: string }> }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-5 text-white shadow-card sm:p-6">
      <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="xl" seed={user.id} ring />
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.16em] text-brand-300 uppercase">{greeting}</p>
            <h1 className="mt-0.5 truncate text-xl font-extrabold tracking-tight sm:text-2xl">{user.name}</h1>
            <p className="mt-1 text-[13px] text-navy-200">
              {user.title ?? roleLabel(user.role)} · {roleLabel(user.role)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[12px] font-semibold backdrop-blur"
            >
              <chip.icon className="h-3.5 w-3.5 text-brand-300" />
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ===================================================================== parent */

function ParentDashboard({ user }: { user: User }) {
  const { db } = useData()
  const children = childrenOf(db, user.id)
  const [activeId, setActiveId] = useState(children[0]?.id ?? '')
  const activeChild = children.find((c) => c.id === activeId) ?? children[0]
  const unread = totalUnread(db, user)
  const notices = announcementsFor(db, user)

  const rows = activeChild ? resultRowsForStudent(db, activeChild.id) : []
  const average = activeChild ? studentAveragePercent(db, activeChild.id) : 0
  const classAverage = activeChild ? classAveragePercent(db, activeChild.className) : 0
  const delta = average - classAverage
  const exams = rows.filter((r) => r.assessment.type === 'exam')
  const quizzes = rows.filter((r) => r.assessment.type === 'quiz')
  const latest = rows.slice(0, 6)
  const bestSubject = useMemo(() => {
    const map = new Map<string, number[]>()
    rows.forEach((r) => {
      const key = r.subject?.id ?? 'unknown'
      map.set(key, [...(map.get(key) ?? []), r.percent])
    })
    let best: { name: string; value: number } | null = null
    map.forEach((values, key) => {
      const value = values.reduce((a, b) => a + b, 0) / values.length
      if (!best || value > best.value) best = { name: subjectById(db, key)?.name ?? 'Subject', value }
    })
    return best as { name: string; value: number } | null
  }, [rows, db])

  if (children.length === 0) {
    return (
      <div className="space-y-4">
        <Hero user={user} chips={[{ icon: MessageSquare, label: `${unread} unread messages` }]} />
        <Card>
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Your account is not yet linked to a learner"
            message="The school office links parents to their children. Once linked, exam and quiz results appear here automatically. You can already take part in the class group chats and read announcements."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/chat">
                  <Button icon={<MessageSquare className="h-4 w-4" />}>Open chats</Button>
                </Link>
                <Link to="/announcements">
                  <Button variant="outline" icon={<Megaphone className="h-4 w-4" />}>
                    Announcements
                  </Button>
                </Link>
              </div>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Hero
        user={user}
        chips={[
          { icon: MessageSquare, label: `${unread} unread` },
          { icon: GraduationCap, label: `${rows.length} results recorded` },
        ]}
      />

      {children.length > 1 ? (
        <Segmented
          options={children.map((child) => ({ value: child.id, label: `${child.name} · ${child.className}` }))}
          value={activeChild?.id ?? ''}
          onChange={setActiveId}
          className="max-w-2xl"
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Overall average"
          value={`${round(average)}%`}
          sub={`${gradeForPercent(average).grade} · ${gradeForPercent(average).remark}`}
          icon={<Target className="h-5 w-5" />}
          tone="brand"
        />
        <StatTile
          label="Compared to class"
          value={`${delta >= 0 ? '+' : ''}${round(delta)}%`}
          sub={`Class average ${round(classAverage)}%`}
          icon={<BarChart3 className="h-5 w-5" />}
          tone={delta >= 0 ? 'brand' : 'gold'}
        />
        <StatTile
          label="Exams recorded"
          value={exams.length}
          sub={`${quizzes.length} quizzes & tests`}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="navy"
        />
        <StatTile
          label="Best subject"
          value={bestSubject ? `${round(bestSubject.value)}%` : '—'}
          sub={bestSubject?.name ?? 'No scores yet'}
          icon={<Sparkles className="h-5 w-5" />}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            icon={<ClipboardCheck className="h-5 w-5" />}
            title={`${activeChild?.name}'s latest results`}
            subtitle={`${activeChild?.className} · ${db.school.term}`}
            action={
              <Link to="/results" className="inline-flex items-center gap-1 text-[13px] font-bold text-navy-700 hover:text-navy-900">
                All results <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {latest.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No results published yet"
              message="As soon as teachers publish exam or quiz scores, the latest ones will appear right here."
            />
          ) : (
            <div className="divide-y divide-navy-50">
              {latest.map((row) => (
                <div key={row.resultId} className="flex items-center gap-3 px-1 py-3 sm:gap-4">
                  <span
                    className={cx(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold',
                      accentOf(row.subject?.accent ?? 'navy').chip,
                    )}
                  >
                    {row.subject?.code.split('-')[0] ?? 'SUB'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13px] font-bold text-navy-900">{row.subject?.name}</span>
                      <AssessmentChip assessment={row.assessment} />
                    </div>
                    <p className="truncate text-xs text-navy-500">{row.assessment.title}</p>
                    <ScoreBar score={row.score} maxScore={row.maxScore} className="mt-1.5 max-w-sm" />
                  </div>
                  <span className="hidden shrink-0 text-right text-[11px] text-navy-500 sm:block">
                    {formatDate(row.assessment.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-navy-500 uppercase">Performance</p>
                <p className="mt-1 text-sm font-bold text-navy-900">{activeChild?.name}</p>
                <p className="text-xs text-navy-500">{activeChild?.admissionNo}</p>
              </div>
              <Ring value={average} size={92} stroke={9} color={gradeForPercent(average).hex} sublabel="Average" />
            </div>
            <div className="mt-4 space-y-2">
              {GRADE_LEGEND.slice(0, 5).map((entry) => (
                <div key={entry.grade} className="flex items-center gap-2 text-[11px]">
                  <span className="w-4 font-bold text-navy-800">{entry.grade}</span>
                  <span className="text-navy-400">{entry.min}%+</span>
                  <span className="flex-1 truncate text-navy-500">{entry.remark}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={<Megaphone className="h-5 w-5" />}
              title="Announcements"
              action={
                <Link to="/announcements" className="text-[13px] font-bold text-navy-700 hover:text-navy-900">
                  View all
                </Link>
              }
            />
            <div className="space-y-3 px-4 pb-4">
              {notices.slice(0, 2).map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  author={userById(db, announcement.authorId)}
                  compact
                />
              ))}
              {notices.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-navy-500">No announcements yet.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <ChatPreview user={user} />
    </div>
  )
}

function ChatPreview({ user }: { user: User }) {
  const { db } = useData()
  const conversations = conversationsFor(db, user).slice(0, 3)
  return (
    <Card>
      <SectionTitle
        icon={<MessageSquare className="h-5 w-5" />}
        title="Recent conversations"
        action={
          <Link to="/chat" className="inline-flex items-center gap-1 text-[13px] font-bold text-navy-700 hover:text-navy-900">
            Open chat <ChevronRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="grid gap-3 px-4 pb-4 md:grid-cols-3">
        {conversations.map((conversation) => {
          const last = lastMessageOf(db, conversation.id)
          const sender = userById(db, last?.senderId)
          return (
            <Link
              key={conversation.id}
              to="/chat"
              className="rounded-xl border border-navy-100 bg-white p-3 transition hover:border-navy-300 hover:bg-navy-50/50"
            >
              <div className="flex items-center gap-2">
                <Avatar name={conversation.name} size="sm" seed={conversation.id} soft />
                <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-navy-900">{conversation.name}</p>
                {last ? <span className="text-[10px] text-navy-400">{relativeTime(last.createdAt)}</span> : null}
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-navy-600">
                {last ? (
                  <>
                    <span className="font-semibold text-navy-800">{sender?.name.split(' ')[0]}: </span>
                    {last.deleted ? 'message deleted' : last.text}
                  </>
                ) : (
                  'No messages yet'
                )}
              </p>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

/* ==================================================================== teacher */

function TeacherDashboard({ user }: { user: User }) {
  const { db } = useData()
  const mySubjects = db.subjects.filter((s) => s.teacherId === user.id)
  const allSubjects = subjectsVisibleTo(db, user)
  const assessments = assessmentsVisibleTo(db, user)
  const myAssessments = assessments.filter((a) => a.createdBy === user.id || mySubjects.some((s) => s.id === a.subjectId))
  const postedResults = myAssessments.reduce(
    (sum, a) => sum + db.results.filter((r) => r.assessmentId === a.id).length,
    0,
  )
  const unread = totalUnread(db, user)
  const notices = announcementsFor(db, user)

  const needsResults = myAssessments
    .map((assessment) => {
      const enrolled = studentsInClass(db, assessment.className).length
      const posted = db.results.filter((r) => r.assessmentId === assessment.id).length
      return { assessment, enrolled, posted, missing: Math.max(0, enrolled - posted) }
    })
    .filter((row) => row.missing > 0)
    .sort((a, b) => new Date(b.assessment.date).getTime() - new Date(a.assessment.date).getTime())

  const upcoming = myAssessments
    .filter((a) => new Date(a.date).getTime() > Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="space-y-5">
      <Hero
        user={user}
        chips={[
          { icon: BookMarked, label: `${mySubjects.length} subjects` },
          { icon: MessageSquare, label: `${unread} unread` },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="My subjects" value={mySubjects.length} sub={`${allSubjects.length} across the school`} icon={<BookMarked className="h-5 w-5" />} tone="navy" to="/academics" />
        <StatTile label="Assessments" value={myAssessments.length} sub={`${postedResults} scores posted`} icon={<ClipboardList className="h-5 w-5" />} tone="brand" to="/academics" />
        <StatTile label="Awaiting results" value={needsResults.reduce((s, r) => s + r.missing, 0)} sub={`${needsResults.length} assessments`} icon={<ClipboardCheck className="h-5 w-5" />} tone="gold" to="/assessments" />
        <StatTile label="Upcoming" value={upcoming.length} sub={upcoming[0] ? `Next ${formatDate(upcoming[0].date)}` : 'Nothing scheduled'} icon={<CalendarClock className="h-5 w-5" />} tone="violet" to="/academics" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/academics">
          <Button icon={<Plus className="h-4 w-4" />} variant="success">
            New subject
          </Button>
        </Link>
        <Link to="/academics">
          <Button icon={<ClipboardList className="h-4 w-4" />} variant="primary">
            Create exam or quiz
          </Button>
        </Link>
        <Link to="/assessments">
          <Button icon={<ClipboardCheck className="h-4 w-4" />} variant="outline">
            Post results
          </Button>
        </Link>
        <Link to="/announcements">
          <Button icon={<Megaphone className="h-4 w-4" />} variant="outline">
            New announcement
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="Results to complete"
            subtitle="Assessments where some learners have no score yet."
            action={
              <Link to="/assessments" className="text-[13px] font-bold text-navy-700 hover:text-navy-900">
                Open assessments
              </Link>
            }
          />
          {needsResults.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="h-6 w-6" />}
              title="Everything is marked"
              message="All of your assessments have complete results. Jazakallahu khairan!"
            />
          ) : (
            <div className="divide-y divide-navy-50">
              {needsResults.slice(0, 5).map(({ assessment, enrolled, posted, missing }) => {
                const subject = subjectById(db, assessment.subjectId)
                return (
                  <Link
                    key={assessment.id}
                    to="/assessments"
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-navy-50/60"
                  >
                    <span className={cx('h-10 w-1.5 shrink-0 rounded-full', accentOf(subject?.accent ?? 'navy').bar)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13px] font-bold text-navy-900">{assessment.title}</span>
                        <AssessmentChip assessment={assessment} />
                      </div>
                      <p className="mt-0.5 text-xs text-navy-500">
                        {subject?.name} · {assessment.className} · {formatDate(assessment.date)}
                      </p>
                      <ProgressBar value={(posted / Math.max(1, enrolled)) * 100} className="mt-2 max-w-xs" />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-extrabold text-navy-900 tabular-nums">
                        {posted}/{enrolled}
                      </p>
                      <p className="text-[11px] font-semibold text-gold-700">{missing} pending</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={<Megaphone className="h-5 w-5" />} title="Recent announcements" />
          <div className="space-y-3 px-4 pb-4">
            {notices.slice(0, 2).map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} author={userById(db, announcement.authorId)} compact />
            ))}
            {notices.length === 0 ? <p className="py-4 text-center text-[13px] text-navy-500">No announcements yet.</p> : null}
            <Link
              to="/announcements"
              className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-navy-200 py-2.5 text-[13px] font-bold text-navy-700 transition hover:bg-navy-50"
            >
              <Plus className="h-4 w-4" /> Post an announcement
            </Link>
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle
          icon={<BookMarked className="h-5 w-5" />}
          title="My subjects"
          subtitle="Tap a subject to edit it or manage its exams."
          action={
            <Link to="/academics" className="text-[13px] font-bold text-navy-700 hover:text-navy-900">
              Manage subjects
            </Link>
          }
        />
        {mySubjects.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BookMarked className="h-6 w-6" />}
              title="No subjects yet"
              message="Create your first subject to start recording exams and quizzes."
              action={
                <Link to="/academics">
                  <Button icon={<Plus className="h-4 w-4" />}>Create subject</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mySubjects.slice(0, 6).map((subject) => {
              const count = db.assessments.filter((a) => a.subjectId === subject.id).length
              const results = db.results.filter((r) =>
                db.assessments.some((a) => a.id === r.assessmentId && a.subjectId === subject.id),
              ).length
              return (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  stats={
                    <>
                      <span className="rounded-full bg-navy-50 px-2 py-1">{count} assessments</span>
                      <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-700">{results} results</span>
                    </>
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <ChatPreview user={user} />
    </div>
  )
}

/* ====================================================================== admin */

function AdminDashboard({ user }: { user: User }) {
  const { db } = useData()
  const teachers = db.users.filter((u) => u.role === 'teacher')
  const parents = db.users.filter((u) => u.role === 'parent')
  const unread = totalUnread(db, user)
  const notices = announcementsFor(db, user)

  const classRows = db.school.classes.map((className) => {
    const students = studentsInClass(db, className)
    const average = classAveragePercent(db, className)
    const subjects = db.subjects.filter((s) => s.className === className).length
    return { className, students: students.length, average, subjects }
  })
  const overall = classRows.length
    ? classRows.reduce((sum, r) => sum + r.average, 0) / classRows.filter((r) => r.average > 0).length || 0
    : 0

  return (
    <div className="space-y-5">
      <Hero
        user={user}
        chips={[
          { icon: Users, label: `${db.students.length} learners` },
          { icon: MessageSquare, label: `${unread} unread` },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Learners" value={db.students.length} sub={`${db.school.classes.length} classes`} icon={<Users className="h-5 w-5" />} tone="navy" to="/people" />
        <StatTile label="Staff" value={teachers.length} sub={`${parents.length} parent accounts`} icon={<GraduationCap className="h-5 w-5" />} tone="violet" to="/people" />
        <StatTile label="Subjects" value={db.subjects.length} sub={`${db.assessments.length} assessments`} icon={<Layers className="h-5 w-5" />} tone="brand" to="/academics" />
        <StatTile label="Results posted" value={db.results.length} sub={`School average ${round(overall)}%`} icon={<ClipboardCheck className="h-5 w-5" />} tone="gold" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/people">
          <Button icon={<Users className="h-4 w-4" />} variant="success">
            Add learner
          </Button>
        </Link>
        <Link to="/announcements">
          <Button icon={<Megaphone className="h-4 w-4" />}>Post announcement</Button>
        </Link>
        <Link to="/academics">
          <Button icon={<Layers className="h-4 w-4" />} variant="outline">
            Manage academics
          </Button>
        </Link>
        <Link to="/settings">
          <Button icon={<Sparkles className="h-4 w-4" />} variant="outline">
            School settings
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle icon={<BarChart3 className="h-5 w-5" />} title="Class performance" subtitle="Averages across all recorded assessments." />
          <div className="space-y-4 px-4 pb-4">
            {classRows.map((row) => (
              <div key={row.className}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-bold text-navy-900">{row.className}</span>
                  <span className="text-navy-500">
                    {row.students} learners · {row.subjects} subjects ·{' '}
                    <span className="font-bold text-navy-800">{round(row.average)}% avg</span>
                  </span>
                </div>
                <ProgressBar value={row.average} tone={row.average >= 70 ? 'brand' : row.average >= 55 ? 'navy' : 'gold'} height="h-2.5" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<Megaphone className="h-5 w-5" />} title="Latest notices" />
          <div className="space-y-3 px-4 pb-4">
            {notices.slice(0, 2).map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} author={userById(db, announcement.authorId)} compact />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={<ClipboardList className="h-5 w-5" />} title="Recently posted results" />
          <div className="divide-y divide-navy-50">
            {[...db.results]
              .sort((a, b) => new Date(b.updatedAt ?? b.postedAt).getTime() - new Date(a.updatedAt ?? a.postedAt).getTime())
              .slice(0, 5)
              .map((result) => {
                const assessment = db.assessments.find((a) => a.id === result.assessmentId)
                const student = db.students.find((s) => s.id === result.studentId)
                const subject = subjectById(db, assessment?.subjectId)
                const grader = userById(db, result.postedBy)
                if (!assessment || !student) return null
                return (
                  <div key={result.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={student.name} size="sm" seed={student.id} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-navy-900">{student.name}</p>
                      <p className="truncate text-xs text-navy-500">
                        {subject?.name} · {assessmentTypeLabel(assessment.type)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-extrabold text-navy-900 tabular-nums">
                        {result.score}/{assessment.maxScore}
                      </p>
                      <p className="text-[10px] text-navy-400">{grader ? grader.name.split(' ').slice(-1)[0] : ''}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<Users className="h-5 w-5" />} title="Staff & parent accounts" />
          <div className="divide-y divide-navy-50">
            {[...teachers, ...parents].slice(0, 6).map((person) => (
              <div key={person.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={person.name} size="sm" seed={person.id} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-navy-900">{person.name}</p>
                  <p className="truncate text-xs text-navy-500">{person.email}</p>
                </div>
                <Badge tone={person.role === 'teacher' ? 'navy' : 'brand'}>{roleLabel(person.role)}</Badge>
              </div>
            ))}
          </div>
          <div className="border-t border-navy-50 p-3">
            <Link to="/people">
              <Button variant="outline" block>
                Manage people
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <ChatPreview user={user} />
    </div>
  )
}

/* ==================================================================== export */

export default function DashboardPage() {
  const { user } = useAuth()
  const { db } = useData()

  if (!user) return null

  return (
    <div className="pb-2">
      {user.role === 'parent' ? (
        <ParentDashboard user={user} />
      ) : user.role === 'teacher' ? (
        <TeacherDashboard user={user} />
      ) : (
        <AdminDashboard user={user} />
      )}
      <p className="mt-6 text-center text-[11px] text-navy-400">
        {db.school.name} · {db.school.motto} · {db.school.term}
      </p>
    </div>
  )
}
