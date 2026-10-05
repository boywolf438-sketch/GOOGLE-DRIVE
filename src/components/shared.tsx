import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AlertCircle, EyeOff, Megaphone, Pin, TrendingDown, TrendingUp } from 'lucide-react'
import type { Announcement, Assessment, Subject, User } from '../types'
import { Avatar, Badge, Card, ProgressBar } from './ui'
import { assessmentTypeClass, assessmentTypeLabel, accentOf, cx, formatDate, relativeTime, roleChipClass, roleLabel } from '../lib/utils'
import { gradeForPercent } from '../lib/grades'

export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = 'navy',
  to,
}: {
  label: string
  value: ReactNode
  sub?: string
  icon?: ReactNode
  tone?: 'navy' | 'brand' | 'gold' | 'violet'
  to?: string
}) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700',
    brand: 'bg-brand-50 text-brand-700',
    gold: 'bg-gold-100 text-gold-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  const body = (
    <Card className="h-full p-4 transition hover:border-navy-200 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-navy-500 uppercase">{label}</p>
          <p className="mt-1.5 text-2xl leading-none font-extrabold text-navy-900">{value}</p>
          {sub ? <p className="mt-1.5 text-xs text-navy-500">{sub}</p> : null}
        </div>
        {icon ? <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>{icon}</span> : null}
      </div>
    </Card>
  )
  return to ? (
    <Link to={to} className="block focus-visible:rounded-2xl">
      {body}
    </Link>
  ) : (
    body
  )
}

export function AssessmentChip({ assessment }: { assessment: Assessment }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
        assessmentTypeClass(assessment.type),
      )}
    >
      {assessmentTypeLabel(assessment.type)}
      {assessment.published ? null : <EyeOff className="h-3 w-3" />}
    </span>
  )
}

export function ScoreBar({
  score,
  maxScore,
  className,
}: {
  score: number
  maxScore: number
  className?: string
}) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
  const grade = gradeForPercent(pct)
  const tone = pct >= 70 ? 'brand' : pct >= 50 ? 'gold' : 'rose'
  return (
    <div className={cx('flex items-center gap-3', className)}>
      <ProgressBar value={pct} tone={tone} className="flex-1" />
      <span className={cx('w-12 shrink-0 text-right text-sm font-extrabold tabular-nums', grade.text)}>
        {Math.round(pct)}%
      </span>
    </div>
  )
}

export function ResultRow({
  subjectName,
  assessment,
  score,
  maxScore,
  accent,
  footer,
}: {
  subjectName: string
  assessment: Assessment
  score: number
  maxScore: number
  accent: string
  footer?: ReactNode
}) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
  const grade = gradeForPercent(pct)
  const tone = accentOf(accent)
  return (
    <div className="flex items-start gap-3 border-b border-navy-50 px-4 py-3.5 last:border-b-0">
      <span className={cx('mt-1 h-10 w-1.5 shrink-0 rounded-full', tone.bar)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-bold text-navy-900">{subjectName}</span>
          <AssessmentChip assessment={assessment} />
        </div>
        <p className="mt-0.5 truncate text-[13px] text-navy-600">{assessment.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-navy-400">
          <span>{formatDate(assessment.date)}</span>
          <span>{assessment.term}</span>
          {footer}
        </div>
        <ScoreBar score={score} maxScore={maxScore} className="mt-2" />
      </div>
      <div className="shrink-0 text-right">
        <span className={cx('inline-flex rounded-lg px-2.5 py-1 text-sm font-extrabold', grade.badge)}>{grade.grade}</span>
        <p className="mt-1 text-[11px] font-bold text-navy-600 tabular-nums">
          {score}/{maxScore}
        </p>
      </div>
    </div>
  )
}

export function SubjectCard({
  subject,
  teacherName,
  actions,
  stats,
}: {
  subject: Subject
  teacherName?: string
  actions?: ReactNode
  stats?: ReactNode
}) {
  const tone = accentOf(subject.accent)
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className={cx('h-1.5 w-full', tone.bar)} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-navy-900">{subject.name}</h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-500">
              <span className={cx('rounded-md px-1.5 py-0.5 font-bold', tone.chip)}>{subject.code}</span>
              <span>{subject.className}</span>
            </p>
          </div>
          {actions}
        </div>
        {subject.description ? (
          <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-navy-600">{subject.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-navy-500">
          {teacherName ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2 py-1">
              <Avatar name={teacherName} size="xs" seed={teacherName} />
              {teacherName.replace(/^Ustadh(a)?\s+/, '')}
            </span>
          ) : null}
          {stats}
        </div>
      </div>
    </Card>
  )
}

export function AnnouncementCard({
  announcement,
  author,
  actions,
  compact = false,
}: {
  announcement: Announcement
  author?: User
  actions?: ReactNode
  compact?: boolean
}) {
  return (
    <Card className={cx('overflow-hidden', announcement.pinned && 'ring-1 ring-brand-200')}>
      {announcement.priority === 'high' ? <div className="h-1 w-full bg-rose-500" /> : null}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span
            className={cx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              announcement.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-navy-50 text-navy-600',
            )}
          >
            <Megaphone className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] leading-snug font-bold text-navy-900">{announcement.title}</h3>
              {announcement.pinned ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 uppercase">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              ) : null}
              {announcement.priority === 'high' ? (
                <Badge tone="rose" className="gap-1">
                  <AlertCircle className="h-3 w-3" /> Urgent
                </Badge>
              ) : null}
            </div>
            <p className={cx('mt-1.5 text-[13px] leading-relaxed text-navy-700', !compact && 'whitespace-pre-line')}>
              {announcement.body}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-navy-500">
              {author ? (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={author.name} size="xs" seed={author.id} soft />
                  <span className="font-semibold text-navy-700">{author.name}</span>
                  <span className={cx('rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase', roleChipClass(author.role))}>
                    {roleLabel(author.role)}
                  </span>
                </span>
              ) : null}
              <span>{relativeTime(announcement.createdAt)}</span>
              <span className="rounded-full bg-navy-50 px-2 py-0.5 font-semibold text-navy-600">
                {announcement.audience === 'all' ? 'Whole school' : announcement.audience}
              </span>
              {announcement.updatedAt ? <span className="italic">edited</span> : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
        </div>
      </div>
    </Card>
  )
}

export function TrendPill({ value, label }: { value: number; label?: string }) {
  const up = value >= 0
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold',
        up ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-600',
      )}
    >
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {up ? '+' : ''}
      {value.toFixed(1)}%{label ? ` ${label}` : ''}
    </span>
  )
}
