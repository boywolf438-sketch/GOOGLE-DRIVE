import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCheck,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  Percent,
  Save,
  Search,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  ProgressBar,
  SectionTitle,
  Select,
} from '../components/ui'
import { AssessmentChip } from '../components/shared'
import { assessmentStats, resultFor, studentsInClass, subjectById } from '../lib/selectors'
import { assessmentTypeLabel, cx, formatDate, isPast, round, toCsv, download } from '../lib/utils'
import { gradeFor, gradeForPercent } from '../lib/grades'

interface RowState {
  score: string
  remark: string
}

export default function ResultsEntryPage() {
  const { user } = useAuth()
  const { db, saveResultBatch, removeResult, updateAssessment } = useData()
  const { success, error: errorToast, info } = useToast()
  const [params, setParams] = useSearchParams()

  const userId = user?.id ?? ''
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [dirty, setDirty] = useState(false)

  const assessments = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...db.assessments]
      .filter((a) => (classFilter === 'all' ? true : a.className === classFilter))
      .filter((a) =>
        q
          ? a.title.toLowerCase().includes(q) ||
            a.className.toLowerCase().includes(q) ||
            (subjectById(db, a.subjectId)?.name ?? '').toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => {
        // Assessments the signed-in teacher owns are listed first.
        const mine =
          Number(b.createdBy === userId || subjectById(db, b.subjectId)?.teacherId === userId) -
          Number(a.createdBy === userId || subjectById(db, a.subjectId)?.teacherId === userId)
        if (mine !== 0) return mine
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
  }, [db, search, classFilter, userId])

  const selectedId = params.get('assessmentId') ?? assessments[0]?.id ?? ''
  const selected = db.assessments.find((a) => a.id === selectedId)
  const subject = subjectById(db, selected?.subjectId)
  const students = selected ? studentsInClass(db, selected.className) : []

  useEffect(() => {
    if (!selected) {
      setRows({})
      return
    }
    const next: Record<string, RowState> = {}
    for (const student of studentsInClass(db, selected.className)) {
      const existing = resultFor(db, selected.id, student.id)
      next[student.id] = { score: existing ? String(existing.score) : '', remark: existing?.remark ?? '' }
    }
    setRows(next)
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, db.results.length, db.students.length])

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Results entry is for teachers and admins"
          message="Sign in with a teacher or admin account to record exam and quiz scores."
        />
      </Card>
    )
  }

  const setRow = (studentId: string, patch: Partial<RowState>) => {
    setRows((current) => ({ ...current, [studentId]: { ...current[studentId], ...patch } }))
    setDirty(true)
  }

  const save = () => {
    if (!selected) return
    const valid: Array<{ studentId: string; score: number; remark?: string }> = []
    for (const [studentId, row] of Object.entries(rows)) {
      if (row.score.trim() === '') continue
      const score = Number(row.score)
      if (Number.isNaN(score) || score < 0 || score > selected.maxScore) {
        errorToast(`Scores must be between 0 and ${selected.maxScore}.`)
        return
      }
      valid.push({ studentId, score, remark: row.remark.trim() || undefined })
    }
    if (valid.length === 0) {
      errorToast('Enter at least one score before saving.')
      return
    }
    saveResultBatch(selected.id, valid, user.id)
    setDirty(false)
    success(`${valid.length} result${valid.length === 1 ? '' : 's'} saved for ${selected.title}.`)
  }

  const stats = selected ? assessmentStats(db, selected.id) : null

  const exportCsv = () => {
    if (!selected) return
    const header = ['Admission No', 'Student', 'Class', 'Subject', 'Assessment', 'Type', 'Score', 'Max', 'Percent', 'Grade']
    const body = students.map((student) => {
      const row = rows[student.id]
      const score = row?.score ? Number(row.score) : 0
      const pct = selected.maxScore ? (score / selected.maxScore) * 100 : 0
      return [
        student.admissionNo,
        student.name,
        student.className,
        subject?.name ?? '',
        selected.title,
        assessmentTypeLabel(selected.type),
        row?.score ?? '',
        selected.maxScore,
        row?.score ? round(pct) : '',
        row?.score ? gradeForPercent(pct).grade : '',
      ]
    })
    download(`${selected.title.replace(/[^\w]+/g, '-')}-results.csv`, toCsv([header, ...body]))
    info('Results exported as CSV.')
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<ClipboardList className="h-5 w-5" />}
        title="Post exam & quiz results"
        subtitle="Select an assessment, enter scores and save — parents see published results instantly."
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        {/* assessment picker */}
        <Card className="flex max-h-[80vh] flex-col overflow-hidden">
          <div className="shrink-0 space-y-2 border-b border-navy-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assessments…"
                className="py-2 pl-9"
              />
            </div>
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="py-2">
              <option value="all">All classes</option>
              {db.school.classes.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </Select>
          </div>
          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
            {assessments.length === 0 ? (
              <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="No assessments" message="Create one under Academics." />
            ) : (
              assessments.map((assessment) => {
                const assessmentSubject = subjectById(db, assessment.subjectId)
                const row = assessmentStats(db, assessment.id)
                const enrolled = studentsInClass(db, assessment.className).length
                const active = assessment.id === selectedId
                return (
                  <button
                    key={assessment.id}
                    type="button"
                    onClick={() => setParams({ assessmentId: assessment.id })}
                    className={cx(
                      'flex w-full flex-col gap-1 border-b border-navy-50 px-3 py-3 text-left transition',
                      active ? 'bg-navy-100/70' : 'hover:bg-navy-50',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-navy-900">{assessment.title}</span>
                      {assessment.published ? null : <EyeOff className="h-3.5 w-3.5 shrink-0 text-navy-400" />}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-navy-500">
                      <span className="font-semibold text-navy-700">{assessmentSubject?.name}</span>
                      <span>{assessment.className}</span>
                      <span>{formatDate(assessment.date)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <ProgressBar
                        value={enrolled ? (row.count / enrolled) * 100 : 0}
                        tone={row.count >= enrolled ? 'brand' : 'gold'}
                        height="h-1.5"
                        className="flex-1"
                      />
                      <span className="text-[10px] font-bold text-navy-500 tabular-nums">
                        {row.count}/{enrolled}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* entry panel */}
        {selected ? (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-bold text-navy-900">{selected.title}</h2>
                    <AssessmentChip assessment={selected} />
                    {selected.published ? (
                      <Badge tone="brand" className="gap-1">
                        <Eye className="h-3 w-3" /> Published
                      </Badge>
                    ) : (
                      <Badge tone="slate" className="gap-1">
                        <EyeOff className="h-3 w-3" /> Draft
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-navy-500">
                    {subject?.name} · {selected.className} · {selected.term} · {formatDate(selected.date)} · max{' '}
                    {selected.maxScore} marks
                    {isPast(selected.date) ? '' : ' · upcoming'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={exportCsv}>
                    Export CSV
                  </Button>
                  <Button
                    variant={selected.published ? 'outline' : 'secondary'}
                    size="sm"
                    icon={selected.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    onClick={() => {
                      updateAssessment(selected.id, { published: !selected.published })
                      success(selected.published ? 'Assessment unpublished.' : 'Assessment published to parents.')
                    }}
                  >
                    {selected.published ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>

              {stats ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: 'Posted', value: `${stats.count}/${students.length}`, icon: CheckCheck },
                    { label: 'Average', value: `${round(stats.average)}`, icon: Percent },
                    { label: 'Highest', value: `${stats.highest}`, icon: Trophy },
                    { label: 'Pending', value: `${stats.pending}`, icon: Users },
                  ].map((tile) => (
                    <div key={tile.label} className="rounded-xl bg-navy-50 px-3 py-2.5">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-navy-500 uppercase">
                        <tile.icon className="h-3 w-3" /> {tile.label}
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-navy-900 tabular-nums">{tile.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 px-4 py-3">
                <h3 className="text-[13px] font-bold text-navy-900">
                  {selected.className} learners ({students.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={() => {
                      const filled: Record<string, RowState> = { ...rows }
                      students.forEach((student) => {
                        if (!filled[student.id]?.score) {
                          const base = Math.max(35, Math.min(97, 55 + Math.floor(Math.random() * 40)))
                          filled[student.id] = {
                            ...filled[student.id],
                            score: String(Math.round((base / 100) * selected.maxScore)),
                            remark: filled[student.id]?.remark ?? '',
                          }
                        }
                      })
                      setRows(filled)
                      setDirty(true)
                      info('Sample marks filled — edit them before saving.')
                    }}
                  >
                    Fill samples
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Save className="h-3.5 w-3.5" />}
                    onClick={save}
                    disabled={!dirty}
                  >
                    Save results
                  </Button>
                </div>
              </div>

              {students.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title={`No learners in ${selected.className}`}
                  message="Add learners to this class under People & Classes, then return to post results."
                />
              ) : (
                <div className="divide-y divide-navy-50">
                  {students.map((student) => {
                    const row = rows[student.id] ?? { score: '', remark: '' }
                    const numeric = row.score.trim() === '' ? null : Number(row.score)
                    const pct = numeric === null || Number.isNaN(numeric) ? null : (numeric / selected.maxScore) * 100
                    const grade = pct === null ? null : gradeFor(numeric ?? 0, selected.maxScore)
                    const existing = resultFor(db, selected.id, student.id)
                    return (
                      <div key={student.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className={cx(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                              grade ? grade.badge : 'bg-navy-100 text-navy-600',
                            )}
                          >
                            {grade ? grade.grade : student.name.slice(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-navy-900">{student.name}</p>
                            <p className="truncate text-[11px] text-navy-500">
                              {student.admissionNo}
                              {existing ? ' · result saved' : ' · not marked'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative w-24">
                            <Input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              max={selected.maxScore}
                              value={row.score}
                              onChange={(e) => setRow(student.id, { score: e.target.value })}
                              placeholder="—"
                              className="py-2 pr-10 text-center font-bold tabular-nums"
                            />
                            <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] font-bold text-navy-400">
                              /{selected.maxScore}
                            </span>
                          </div>
                          <Input
                            value={row.remark}
                            onChange={(e) => setRow(student.id, { remark: e.target.value })}
                            placeholder="Remark (optional)"
                            className="hidden w-56 py-2 lg:block"
                          />
                          <span className="w-14 shrink-0 text-right text-[12px] font-bold text-navy-600 tabular-nums">
                            {pct === null ? '—' : `${Math.round(pct)}%`}
                          </span>
                          {existing ? (
                            <button
                              type="button"
                              onClick={() => {
                                removeResult(selected.id, student.id)
                                setRow(student.id, { score: '', remark: '' })
                                success(`Cleared ${student.name}’s result.`)
                              }}
                              className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                              aria-label={`Clear result for ${student.name}`}
                            >
                              <EyeOff className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy-100 bg-navy-50/60 px-4 py-3">
                <p className="text-[11px] text-navy-500">
                  Scores are validated against the maximum of {selected.maxScore}. Leave a field blank to skip a learner.
                </p>
                <Button variant="success" size="sm" icon={<Save className="h-3.5 w-3.5" />} onClick={save} disabled={!dirty}>
                  Save results
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No assessment selected"
              message="Create an exam or quiz under Academics & Exams, then post the scores here."
            />
          </Card>
        )}
      </div>
    </div>
  )
}
