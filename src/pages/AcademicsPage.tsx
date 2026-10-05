import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookMarked,
  CalendarClock,
  ClipboardList,
  Eye,
  EyeOff,
  Filter,
  Layers,
  Pencil,
  Plus,
  Trash2,
  UserCog,
} from 'lucide-react'
import type { Assessment, AssessmentType, Subject, SubjectAccent } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  SearchInput,
  SectionTitle,
  Segmented,
  Select,
  Textarea,
} from '../components/ui'
import { AssessmentChip, SubjectCard } from '../components/shared'
import { assessmentStats, studentsInClass, subjectById } from '../lib/selectors'
import {
  accentOf,
  assessmentTypeLabel,
  cx,
  formatDate,
  isPast,
  round,
  termOptions,
  toDateInput,
} from '../lib/utils'

const ACCENTS: SubjectAccent[] = ['navy', 'emerald', 'gold', 'violet', 'rose', 'cyan']
const TYPES: AssessmentType[] = ['exam', 'quiz', 'test', 'assignment']

interface SubjectDraft {
  id?: string
  name: string
  code: string
  className: string
  teacherId: string
  description: string
  accent: SubjectAccent
}

interface AssessmentDraft {
  id?: string
  title: string
  type: AssessmentType
  subjectId: string
  className: string
  term: string
  date: string
  maxScore: number
  published: boolean
}

export default function AcademicsPage() {
  const { user } = useAuth()
  const { db, createSubject, updateSubject, deleteSubject, createAssessment, updateAssessment, deleteAssessment } = useData()
  const { success, error: errorToast } = useToast()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'assessments' ? 'assessments' : 'subjects'
  const setTab = (value: string) => setParams(value === 'subjects' ? {} : { tab: value })

  const [classFilter, setClassFilter] = useState('all')
  const [subjectSearch, setSubjectSearch] = useState('')
  const [assessmentSearch, setAssessmentSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | AssessmentType>('all')
  const [subjectFilter, setSubjectFilter] = useState('all')

  const [subjectDraft, setSubjectDraft] = useState<SubjectDraft | null>(null)
  const [assessmentDraft, setAssessmentDraft] = useState<AssessmentDraft | null>(null)
  const [confirm, setConfirm] = useState<{ kind: 'subject' | 'assessment'; id: string; name: string } | null>(null)

  if (!user)
    return null

  const isAdmin = user.role === 'admin'
  const canManage = (subject: Subject) => isAdmin || subject.teacherId === user.id
  const teachers = db.users.filter((u) => u.role === 'teacher' || u.role === 'admin')

  /* -------------------------------------------------------------- subjects */
  const subjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase()
    return db.subjects
      .filter((s) => (classFilter === 'all' ? true : s.className === classFilter))
      .filter((s) => (q ? s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const mine = Number(b.teacherId === user.id) - Number(a.teacherId === user.id)
        if (mine !== 0) return mine
        return `${a.className}${a.name}`.localeCompare(`${b.className}${b.name}`)
      })
  }, [db.subjects, classFilter, subjectSearch, user.id])

  /* ----------------------------------------------------------- assessments */
  const assessments = useMemo(() => {
    const q = assessmentSearch.trim().toLowerCase()
    return db.assessments
      .filter((a) => (classFilter === 'all' ? true : a.className === classFilter))
      .filter((a) => (typeFilter === 'all' ? true : a.type === typeFilter))
      .filter((a) => (subjectFilter === 'all' ? true : a.subjectId === subjectFilter))
      .filter((a) =>
        q
          ? a.title.toLowerCase().includes(q) ||
            (subjectById(db, a.subjectId)?.name ?? '').toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [db, classFilter, typeFilter, subjectFilter, assessmentSearch])

  /* ------------------------------------------------------------- handlers */
  const openNewSubject = () =>
    setSubjectDraft({
      name: '',
      code: '',
      className: db.school.classes[0] ?? 'Form 1',
      teacherId: user.role === 'teacher' ? user.id : teachers[0]?.id ?? user.id,
      description: '',
      accent: ACCENTS[db.subjects.length % ACCENTS.length],
    })

  const openEditSubject = (subject: Subject) =>
    setSubjectDraft({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      className: subject.className,
      teacherId: subject.teacherId,
      description: subject.description ?? '',
      accent: subject.accent,
    })

  const saveSubject = () => {
    if (!subjectDraft) return
    const name = subjectDraft.name.trim()
    const code = subjectDraft.code.trim() || name.slice(0, 3).toUpperCase()
    if (name.length < 2) {
      errorToast('Please enter a subject name.')
      return
    }
    const duplicate = db.subjects.some(
      (s) =>
        s.id !== subjectDraft.id &&
        s.className === subjectDraft.className &&
        (s.name.toLowerCase() === name.toLowerCase() || s.code.toLowerCase() === code.toLowerCase()),
    )
    if (duplicate) {
      errorToast('That subject name or code already exists for this class.')
      return
    }
    if (subjectDraft.id) {
      updateSubject(subjectDraft.id, {
        name,
        code,
        className: subjectDraft.className,
        teacherId: subjectDraft.teacherId,
        description: subjectDraft.description.trim(),
        accent: subjectDraft.accent,
      })
      success('Subject updated.')
    } else {
      createSubject({
        name,
        code,
        className: subjectDraft.className,
        teacherId: subjectDraft.teacherId,
        description: subjectDraft.description.trim(),
        accent: subjectDraft.accent,
      })
      success('Subject created.')
    }
    setSubjectDraft(null)
  }

  const openNewAssessment = (subjectId?: string) => {
    const subject = subjectId ? subjectById(db, subjectId) : undefined
    setAssessmentDraft({
      title: '',
      type: 'exam',
      subjectId: subject?.id ?? db.subjects[0]?.id ?? '',
      className: subject?.className ?? db.school.classes[0] ?? 'Form 1',
      term: db.school.term,
      date: toDateInput(new Date().toISOString()),
      maxScore: 100,
      published: false,
    })
  }

  const openEditAssessment = (assessment: Assessment) =>
    setAssessmentDraft({
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      subjectId: assessment.subjectId,
      className: assessment.className,
      term: assessment.term,
      date: toDateInput(assessment.date),
      maxScore: assessment.maxScore,
      published: assessment.published,
    })

  const saveAssessment = () => {
    if (!assessmentDraft) return
    const title = assessmentDraft.title.trim()
    if (title.length < 3) {
      errorToast('Please enter a title for the assessment.')
      return
    }
    if (!assessmentDraft.subjectId) {
      errorToast('Create a subject first, then add exams and quizzes to it.')
      return
    }
    if (!assessmentDraft.maxScore || assessmentDraft.maxScore <= 0) {
      errorToast('Maximum score must be greater than zero.')
      return
    }
    const date = new Date(`${assessmentDraft.date}T09:00:00`).toISOString()
    if (assessmentDraft.id) {
      updateAssessment(assessmentDraft.id, {
        title,
        type: assessmentDraft.type,
        subjectId: assessmentDraft.subjectId,
        className: assessmentDraft.className,
        term: assessmentDraft.term,
        date,
        maxScore: assessmentDraft.maxScore,
        published: assessmentDraft.published,
      })
      success('Assessment updated.')
    } else {
      createAssessment({
        title,
        type: assessmentDraft.type,
        subjectId: assessmentDraft.subjectId,
        className: assessmentDraft.className,
        term: assessmentDraft.term,
        date,
        maxScore: assessmentDraft.maxScore,
        published: assessmentDraft.published,
        createdBy: user.id,
      })
      success('Assessment created. You can now post results.')
    }
    setAssessmentDraft(null)
  }

  const subjectChoices = db.subjects.filter((s) => s.className === (assessmentDraft?.className ?? ''))
  const otherSubjectChoices = db.subjects.filter((s) => s.className !== (assessmentDraft?.className ?? ''))

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<Layers className="h-5 w-5" />}
        title="Academics & Exam Management"
        subtitle="Create subjects, schedule exams and quizzes, then post results."
        action={
          tab === 'subjects' ? (
            <Button icon={<Plus className="h-4 w-4" />} variant="success" onClick={openNewSubject}>
              New subject
            </Button>
          ) : (
            <Button
              icon={<Plus className="h-4 w-4" />}
              variant="success"
              onClick={() => (db.subjects.length ? openNewAssessment() : errorToast('Create a subject first.'))}
            >
              New exam / quiz
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          className="sm:max-w-sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'subjects', label: 'Subjects', count: db.subjects.length, icon: <BookMarked className="h-4 w-4" /> },
            {
              value: 'assessments',
              label: 'Exams & Quizzes',
              count: db.assessments.length,
              icon: <ClipboardList className="h-4 w-4" />,
            },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-navy-500">
            <Filter className="h-3.5 w-3.5" /> Class
          </span>
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-10 w-auto py-0">
            <option value="all">All classes</option>
            {db.school.classes.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {tab === 'subjects' ? (
        <>
          <SearchInput value={subjectSearch} onChange={setSubjectSearch} placeholder="Search subjects or codes…" className="sm:max-w-md" />
          {subjects.length === 0 ? (
            <Card>
              <EmptyState
                icon={<BookMarked className="h-6 w-6" />}
                title="No subjects found"
                message="Create a subject such as Qur’an Recitation, Tajweed, Fiqh, Arabic or Mathematics to begin recording assessments."
                action={
                  <Button icon={<Plus className="h-4 w-4" />} onClick={openNewSubject}>
                    Create subject
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => {
                const teacher = db.users.find((u) => u.id === subject.teacherId)
                const list = db.assessments.filter((a) => a.subjectId === subject.id)
                const results = db.results.filter((r) => list.some((a) => a.id === r.assessmentId)).length
                const editable = canManage(subject)
                return (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    teacherName={teacher?.name}
                    stats={
                      <>
                        <span className="rounded-full bg-navy-50 px-2 py-1">{list.length} assessments</span>
                        <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-700">{results} results</span>
                        {!editable ? (
                          <span className="rounded-full bg-gold-100 px-2 py-1 text-gold-700">View only</span>
                        ) : null}
                      </>
                    }
                    actions={
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openNewAssessment(subject.id)}
                          className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100 hover:text-navy-900"
                          aria-label={`Add assessment to ${subject.name}`}
                          title="Add exam or quiz"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {editable ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditSubject(subject)}
                              className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100 hover:text-navy-900"
                              aria-label={`Edit ${subject.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirm({ kind: 'subject', id: subject.id, name: subject.name })}
                              className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                              aria-label={`Delete ${subject.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    }
                  />
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={assessmentSearch}
              onChange={setAssessmentSearch}
              placeholder="Search exams & quizzes…"
              className="sm:max-w-xs"
            />
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="sm:w-40">
              <option value="all">All types</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {assessmentTypeLabel(type)}
                </option>
              ))}
            </Select>
            <Select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="sm:w-56"
            >
              <option value="all">All subjects</option>
              {db.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} · {subject.className}
                </option>
              ))}
            </Select>
          </div>

          {assessments.length === 0 ? (
            <Card>
              <EmptyState
                icon={<ClipboardList className="h-6 w-6" />}
                title="No assessments match these filters"
                message="Create an exam, quiz, test or assignment and it will appear here for results entry."
                action={
                  <Button icon={<Plus className="h-4 w-4" />} onClick={() => openNewAssessment()}>
                    Create assessment
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {assessments.map((assessment) => {
                const subject = subjectById(db, assessment.subjectId)
                const stats = assessmentStats(db, assessment.id)
                const enrolled = studentsInClass(db, assessment.className).length
                const editable = isAdmin || assessment.createdBy === user.id || subject?.teacherId === user.id
                const tone = accentOf(subject?.accent ?? 'navy')
                return (
                  <Card key={assessment.id} className="overflow-hidden">
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <span className={cx('hidden h-12 w-1.5 shrink-0 rounded-full sm:block', tone.bar)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[14px] font-bold text-navy-900">{assessment.title}</h3>
                          <AssessmentChip assessment={assessment} />
                          {assessment.published ? (
                            <Badge tone="brand" className="gap-1">
                              <Eye className="h-3 w-3" /> Published
                            </Badge>
                          ) : (
                            <Badge tone="slate" className="gap-1">
                              <EyeOff className="h-3 w-3" /> Draft
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-navy-500">
                          <span className="font-semibold text-navy-700">{subject?.name ?? 'Subject removed'}</span>
                          <span>{assessment.className}</span>
                          <span>{assessment.term}</span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDate(assessment.date)}
                            {isPast(assessment.date) ? '' : ' (upcoming)'}
                          </span>
                          <span>Max {assessment.maxScore}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                          <span className="rounded-full bg-navy-50 px-2 py-1 text-navy-700">
                            {stats.count}/{enrolled} results posted
                          </span>
                          {stats.count > 0 ? (
                            <>
                              <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-700">
                                Avg {round(stats.average)}/{assessment.maxScore}
                              </span>
                              <span className="rounded-full bg-gold-100 px-2 py-1 text-gold-700">High {stats.highest}</span>
                              <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-600">Low {stats.lowest}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <Link to={`/assessments?assessmentId=${assessment.id}`} className="w-full sm:w-auto">
                          <Button variant="primary" size="sm" icon={<ClipboardList className="h-3.5 w-3.5" />} block>
                            Results
                          </Button>
                        </Link>
                        <div className="flex items-center gap-1">
                          {editable ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditAssessment(assessment)}
                                className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100 hover:text-navy-900"
                                aria-label="Edit assessment"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateAssessment(assessment.id, { published: !assessment.published })
                                  success(
                                    assessment.published
                                      ? 'Assessment moved back to draft.'
                                      : 'Assessment published to parents.',
                                  )
                                }}
                                className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100 hover:text-navy-900"
                                aria-label={assessment.published ? 'Unpublish assessment' : 'Publish assessment'}
                                title={assessment.published ? 'Unpublish' : 'Publish to parents'}
                              >
                                {assessment.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirm({ kind: 'assessment', id: assessment.id, name: assessment.title })}
                                className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                                aria-label="Delete assessment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <Badge tone="slate">View only</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------- subject editor */}
      <Modal
        open={Boolean(subjectDraft)}
        onClose={() => setSubjectDraft(null)}
        title={subjectDraft?.id ? 'Edit subject' : 'New subject'}
        description="Subjects group all exams, quizzes and results for a class."
        footer={
          <>
            <Button variant="outline" onClick={() => setSubjectDraft(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={saveSubject}>
              {subjectDraft?.id ? 'Save changes' : 'Create subject'}
            </Button>
          </>
        }
      >
        {subjectDraft ? (
          <div className="space-y-4">
            <Field label="Subject name" required>
              <Input
                value={subjectDraft.name}
                onChange={(e) => setSubjectDraft({ ...subjectDraft, name: e.target.value })}
                placeholder="e.g. Tajweed"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject code" hint="Short code shown on result cards.">
                <Input
                  value={subjectDraft.code}
                  onChange={(e) => setSubjectDraft({ ...subjectDraft, code: e.target.value.toUpperCase() })}
                  placeholder="TAJ-201"
                />
              </Field>
              <Field label="Class" required>
                <Select
                  value={subjectDraft.className}
                  onChange={(e) => setSubjectDraft({ ...subjectDraft, className: e.target.value })}
                >
                  {db.school.classes.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Subject teacher" hint="Only the assigned teacher (or an admin) can edit the subject.">
              <Select
                value={subjectDraft.teacherId}
                onChange={(e) => setSubjectDraft({ ...subjectDraft, teacherId: e.target.value })}
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} · {teacher.title ?? teacher.role}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" hint="Optional — shown to parents on the subject card.">
              <Textarea
                rows={3}
                value={subjectDraft.description}
                onChange={(e) => setSubjectDraft({ ...subjectDraft, description: e.target.value })}
                placeholder="What does this subject cover this term?"
              />
            </Field>
            <Field label="Accent colour">
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((accent) => (
                  <button
                    key={accent}
                    type="button"
                    onClick={() => setSubjectDraft({ ...subjectDraft, accent })}
                    className={cx(
                      'h-9 w-9 rounded-xl border-2 transition',
                      accentOf(accent).bar,
                      subjectDraft.accent === accent ? 'border-navy-900 ring-2 ring-navy-900/20' : 'border-transparent',
                    )}
                    aria-label={`Use ${accent} accent`}
                  />
                ))}
              </div>
            </Field>
          </div>
        ) : null}
      </Modal>

      {/* ---------------------------------------------- assessment editor */}
      <Modal
        open={Boolean(assessmentDraft)}
        onClose={() => setAssessmentDraft(null)}
        title={assessmentDraft?.id ? 'Edit exam / quiz' : 'Create exam or quiz'}
        description="Assessments are attached to a subject and a class. Publish when you are ready for parents to see it."
        footer={
          <>
            <Button variant="outline" onClick={() => setAssessmentDraft(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={saveAssessment}>
              {assessmentDraft?.id ? 'Save changes' : 'Create assessment'}
            </Button>
          </>
        }
      >
        {assessmentDraft ? (
          <div className="space-y-4">
            <Field label="Title" required>
              <Input
                value={assessmentDraft.title}
                onChange={(e) => setAssessmentDraft({ ...assessmentDraft, title: e.target.value })}
                placeholder="e.g. End-Term Exam — Tajweed"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" required>
                <Select
                  value={assessmentDraft.type}
                  onChange={(e) => setAssessmentDraft({ ...assessmentDraft, type: e.target.value as AssessmentType })}
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {assessmentTypeLabel(type)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Class" required>
                <Select
                  value={assessmentDraft.className}
                  onChange={(e) => {
                    const className = e.target.value
                    const matches = db.subjects.filter((s) => s.className === className)
                    setAssessmentDraft({
                      ...assessmentDraft,
                      className,
                      subjectId: matches.some((s) => s.id === assessmentDraft.subjectId)
                        ? assessmentDraft.subjectId
                        : matches[0]?.id ?? '',
                    })
                  }}
                >
                  {db.school.classes.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Subject" required hint={subjectChoices.length === 0 ? 'No subjects for this class yet — create one first.' : undefined}>
              <Select
                value={assessmentDraft.subjectId}
                onChange={(e) => setAssessmentDraft({ ...assessmentDraft, subjectId: e.target.value })}
              >
                <option value="">Select a subject…</option>
                {subjectChoices.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
                {otherSubjectChoices.length ? (
                  <optgroup label="Other classes">
                    {otherSubjectChoices.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} · {subject.className}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" required>
                <Input
                  type="date"
                  value={assessmentDraft.date}
                  onChange={(e) => setAssessmentDraft({ ...assessmentDraft, date: e.target.value })}
                />
              </Field>
              <Field label="Maximum score" required>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={assessmentDraft.maxScore}
                  onChange={(e) => setAssessmentDraft({ ...assessmentDraft, maxScore: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="Term" required>
              <Select
                value={assessmentDraft.term}
                onChange={(e) => setAssessmentDraft({ ...assessmentDraft, term: e.target.value })}
              >
                {[db.school.term, ...termOptions().filter((t) => t !== db.school.term)].map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </Select>
            </Field>
            <label className="flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50/60 p-3.5">
              <input
                type="checkbox"
                checked={assessmentDraft.published}
                onChange={(e) => setAssessmentDraft({ ...assessmentDraft, published: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                <span className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
                  <UserCog className="h-4 w-4 text-navy-500" /> Publish to parents
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-navy-500">
                  Published assessments and their results appear on parent dashboards. Keep it as a draft while marking.
                </span>
              </span>
            </label>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.kind === 'subject' ? 'Delete subject?' : 'Delete assessment?'}
        message={
          confirm?.kind === 'subject'
            ? `“${confirm?.name}” and every exam, quiz and result recorded under it will be permanently removed.`
            : `“${confirm?.name}” and all of its posted results will be permanently removed.`
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return
          if (confirm.kind === 'subject') {
            deleteSubject(confirm.id)
            success('Subject deleted.')
          } else {
            deleteAssessment(confirm.id)
            success('Assessment deleted.')
          }
          setConfirm(null)
        }}
      />
    </div>
  )
}
