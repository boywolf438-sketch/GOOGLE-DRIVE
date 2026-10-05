import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Download,
  Filter,
  Info,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
  Ring,
  SectionTitle,
  Segmented,
  Select,
} from '../components/ui'
import { AssessmentChip, ScoreBar, StatTile } from '../components/shared'
import {
  childrenOf,
  classAveragePercent,
  resultRowsForStudent,
  subjectById,
} from '../lib/selectors'
import { accentOf, cx, download, formatDate, round, toCsv } from '../lib/utils'
import { gradeForPercent, GRADE_LEGEND } from '../lib/grades'

export default function ResultsPage() {
  const { user } = useAuth()
  const { db } = useData()
  const { info } = useToast()

  const isParent = user?.role === 'parent'
  const children = useMemo(() => (user && isParent ? childrenOf(db, user.id) : []), [db, user, isParent])
  const allStudents = useMemo(
    () =>
      [...db.students].sort((a, b) => `${a.className}${a.name}`.localeCompare(`${b.className}${b.name}`)),
    [db.students],
  )

  const [childId, setChildId] = useState(children[0]?.id ?? allStudents[0]?.id ?? '')
  const student = db.students.find((s) => s.id === childId) ?? children[0] ?? allStudents[0]
  const [typeFilter, setTypeFilter] = useState<'all' | 'exam' | 'quiz'>('all')
  const [termFilter, setTermFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')

  if (!user) return null

  if (!student) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No learner records available"
          message="Once a learner is registered and linked to your account, their results will appear here."
          action={
            <Link to="/chat">
              <Button>Open chats</Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const allRows = resultRowsForStudent(db, student.id)
  const terms = [...new Set(allRows.map((r) => r.assessment.term))]
  const rows = allRows
    .filter((r) => (typeFilter === 'all' ? true : r.assessment.type === typeFilter))
    .filter((r) => (termFilter === 'all' ? true : r.assessment.term === termFilter))
    .filter((r) => (subjectFilter === 'all' ? true : r.assessment.subjectId === subjectFilter))

  const average = rows.length ? rows.reduce((s, r) => s + r.percent, 0) / rows.length : 0
  const classAverage = classAveragePercent(db, student.className)
  const best = rows.reduce<(typeof rows)[number] | null>((acc, r) => (!acc || r.percent > acc.percent ? r : acc), null)
  const weakest = rows.reduce<(typeof rows)[number] | null>(
    (acc, r) => (!acc || r.percent < acc.percent ? r : acc),
    null,
  )

  const bySubject = new Map<string, { name: string; accent: string; values: number[] }>()
  allRows.forEach((row) => {
    const key = row.subject?.id ?? 'unknown'
    const entry = bySubject.get(key) ?? {
      name: row.subject?.name ?? 'Unknown subject',
      accent: row.subject?.accent ?? 'navy',
      values: [],
    }
    entry.values.push(row.percent)
    bySubject.set(key, entry)
  })
  const subjectSummaries = [...bySubject.entries()]
    .map(([id, entry]) => ({
      id,
      name: entry.name,
      accent: entry.accent,
      average: entry.values.reduce((a, b) => a + b, 0) / entry.values.length,
      count: entry.values.length,
    }))
    .sort((a, b) => b.average - a.average)

  const trendRows = [...allRows].reverse().slice(-10)

  const exportCsv = () => {
    const header = ['Date', 'Term', 'Subject', 'Assessment', 'Type', 'Score', 'Max', 'Percent', 'Grade', 'Remark']
    const body = rows.map((row) => {
      const grade = gradeForPercent(row.percent)
      return [
        formatDate(row.assessment.date),
        row.assessment.term,
        row.subject?.name ?? '',
        row.assessment.title,
        row.assessment.type,
        row.score,
        row.maxScore,
        round(row.percent),
        grade.grade,
        grade.remark,
      ]
    })
    download(`${student.name.replace(/\s+/g, '-')}-results.csv`, toCsv([header, ...body]))
    info('Result sheet downloaded.')
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<ClipboardList className="h-5 w-5" />}
        title={isParent ? 'My children’s results' : 'Student results'}
        subtitle={isParent ? 'Every exam, test and quiz recorded by the teachers.' : 'Inspect any learner’s academic record.'}
        action={
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
            Export
          </Button>
        }
      />

      {/* learner switcher */}
      {isParent ? (
        children.length > 1 ? (
          <Segmented
            options={children.map((child) => ({ value: child.id, label: `${child.name} · ${child.className}` }))}
            value={childId}
            onChange={setChildId}
            className="max-w-2xl"
          />
        ) : null
      ) : (
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-navy-800">Select learner</span>
              <Select value={childId} onChange={(e) => setChildId(e.target.value)}>
                {db.school.classes.map((className) => (
                  <optgroup key={className} label={className}>
                    {allStudents
                      .filter((s) => s.className === className)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.admissionNo}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </Select>
            </label>
            <div className="flex items-center gap-3 rounded-xl bg-navy-50 px-4 py-2.5">
              <Avatar name={student.name} seed={student.id} />
              <div>
                <p className="text-[13px] font-bold text-navy-900">{student.name}</p>
                <p className="text-[11px] text-navy-500">
                  {student.className} · {student.admissionNo}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Average (filtered)"
          value={`${round(average)}%`}
          sub={`${gradeForPercent(average).grade} · ${gradeForPercent(average).remark}`}
          icon={<BarChart3 className="h-5 w-5" />}
          tone="brand"
        />
        <StatTile
          label="Best result"
          value={best ? `${round(best.percent)}%` : '—'}
          sub={best?.subject?.name ?? 'No data yet'}
          icon={<Award className="h-5 w-5" />}
          tone="gold"
        />
        <StatTile
          label="Needs attention"
          value={weakest ? `${round(weakest.percent)}%` : '—'}
          sub={weakest?.subject?.name ?? 'No data yet'}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="violet"
        />
        <StatTile
          label="Records"
          value={rows.length}
          sub={`${allRows.length} total · ${classAverage ? `class avg ${round(classAverage)}%` : 'no class data'}`}
          icon={<Users className="h-5 w-5" />}
          tone="navy"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-navy-500">
                <Filter className="h-3.5 w-3.5" /> Filters
              </span>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="h-9 w-auto py-0 sm:w-36">
                <option value="all">All types</option>
                <option value="exam">Exams</option>
                <option value="quiz">Quizzes</option>
              </Select>
              <Select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="h-9 w-auto py-0 sm:w-40">
                <option value="all">All terms</option>
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </Select>
              <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="h-9 w-auto py-0 sm:w-52">
                <option value="all">All subjects</option>
                {subjectSummaries.map((summary) => (
                  <option key={summary.id} value={summary.id}>
                    {summary.name}
                  </option>
                ))}
              </Select>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-6 w-6" />}
                title="No results for these filters"
                message="Try a different term or assessment type. Results appear as soon as teachers publish them."
              />
            ) : (
              <div className="divide-y divide-navy-50">
                {rows.map((row) => {
                  const grader = db.users.find((u) => u.id === row.assessment.createdBy)
                  return (
                    <div key={row.resultId} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cx('rounded-md px-2 py-0.5 text-[10px] font-bold', accentOf(row.subject?.accent ?? 'navy').chip)}>
                          {row.subject?.code ?? 'SUB'}
                        </span>
                        <span className="text-[13px] font-bold text-navy-900">{row.subject?.name}</span>
                        <AssessmentChip assessment={row.assessment} />
                        <span className="ml-auto flex items-center gap-2">
                          <Badge tone="slate">{gradeForPercent(row.percent).grade}</Badge>
                          <span className="text-sm font-extrabold text-navy-900 tabular-nums">
                            {row.score}
                            <span className="text-[11px] font-semibold text-navy-400">/{row.maxScore}</span>
                          </span>
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-navy-600">{row.assessment.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-navy-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {formatDate(row.assessment.date)}
                        </span>
                        <span>{row.assessment.term}</span>
                        {grader ? <span>Posted by {grader.name}</span> : null}
                        {!row.assessment.published ? <span className="text-gold-700">draft</span> : null}
                      </div>
                      <ScoreBar score={row.score} maxScore={row.maxScore} className="mt-2 max-w-md" />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle
              icon={<TrendingUp className="h-5 w-5" />}
              title="Progress trend"
              subtitle="Percentages across the most recent assessments."
            />
            <div className="px-4 pb-5">
              {trendRows.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-navy-500">No results to chart yet.</p>
              ) : (
                <div className="flex h-40 items-end gap-2 sm:gap-3">
                  {trendRows.map((row) => {
                    const grade = gradeForPercent(row.percent)
                    return (
                      <div key={row.resultId} className="group flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-[10px] font-bold text-navy-600 tabular-nums">{Math.round(row.percent)}%</span>
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-lg transition-all duration-500"
                            style={{ height: `${Math.max(6, row.percent)}%`, backgroundColor: grade.hex }}
                            title={`${row.assessment.title} — ${row.score}/${row.maxScore}`}
                          />
                        </div>
                        <span className="w-full truncate text-center text-[9px] text-navy-400">
                          {row.subject?.code.split('-')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wider text-navy-500 uppercase">Overall</p>
                <p className="truncate text-sm font-bold text-navy-900">{student.name}</p>
                <p className="text-xs text-navy-500">{student.className}</p>
              </div>
              <Ring value={average} size={92} stroke={9} color={gradeForPercent(average).hex} sublabel="Average" />
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-navy-500">Class average</span>
                <span className="font-bold text-navy-800">{round(classAverage)}%</span>
              </div>
              <ProgressBar value={classAverage} tone="navy" height="h-2" />
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-navy-500">This learner</span>
                <span className="font-bold text-brand-700">{round(average)}%</span>
              </div>
              <ProgressBar value={average} tone="brand" height="h-2" />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[13px] font-bold text-navy-900">Subject averages</h3>
            <div className="mt-3 space-y-3">
              {subjectSummaries.length === 0 ? (
                <p className="text-[13px] text-navy-500">No subject data yet.</p>
              ) : (
                subjectSummaries.map((summary) => (
                  <div key={summary.id}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="truncate font-semibold text-navy-700">{summary.name}</span>
                      <span className="font-bold text-navy-800 tabular-nums">{round(summary.average)}%</span>
                    </div>
                    <ProgressBar
                      value={summary.average}
                      tone={summary.average >= 70 ? 'brand' : summary.average >= 50 ? 'gold' : 'rose'}
                      height="h-2"
                    />
                    <p className="mt-0.5 text-[10px] text-navy-400">{summary.count} assessment(s)</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
              <Info className="h-4 w-4 text-navy-400" /> Grading scale
            </h3>
            <div className="mt-3 space-y-2">
              {GRADE_LEGEND.map((entry) => {
                const grade = gradeForPercent(entry.min)
                return (
                  <div key={entry.grade} className="flex items-center gap-3">
                    <span className={cx('flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-extrabold', grade.badge)}>
                      {entry.grade}
                    </span>
                    <span className="w-16 text-[12px] font-semibold text-navy-700">{entry.min}% +</span>
                    <span className="flex-1 truncate text-[11px] text-navy-500">{entry.remark}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
