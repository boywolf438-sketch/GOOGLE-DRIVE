export interface GradeInfo {
  grade: string
  remark: string
  /** tailwind classes for a filled badge */
  badge: string
  /** tailwind classes for a soft chip */
  soft: string
  /** tailwind text colour for numbers */
  text: string
  /** hex used in charts / svg */
  hex: string
}

const SCALE: Array<GradeInfo & { min: number }> = [
  {
    grade: 'A',
    min: 80,
    remark: 'Excellent',
    badge: 'bg-brand-600 text-white',
    soft: 'bg-brand-50 text-brand-800 ring-1 ring-brand-200',
    text: 'text-brand-700',
    hex: '#059669',
  },
  {
    grade: 'B',
    min: 70,
    remark: 'Very good',
    badge: 'bg-brand-500 text-white',
    soft: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    text: 'text-brand-700',
    hex: '#10b981',
  },
  {
    grade: 'C',
    min: 60,
    remark: 'Good',
    badge: 'bg-navy-600 text-white',
    soft: 'bg-navy-100 text-navy-800 ring-1 ring-navy-200',
    text: 'text-navy-700',
    hex: '#1d5aa1',
  },
  {
    grade: 'D',
    min: 50,
    remark: 'Fair — keep pushing',
    badge: 'bg-gold-500 text-white',
    soft: 'bg-gold-100 text-gold-700 ring-1 ring-gold-400/60',
    text: 'text-gold-700',
    hex: '#c99a3f',
  },
  {
    grade: 'E',
    min: 40,
    remark: 'Needs improvement',
    badge: 'bg-orange-500 text-white',
    soft: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    text: 'text-orange-600',
    hex: '#f97316',
  },
  {
    grade: 'F',
    min: 0,
    remark: 'Below expectation',
    badge: 'bg-rose-600 text-white',
    soft: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    text: 'text-rose-600',
    hex: '#e11d48',
  },
]

export function percentage(score: number, maxScore: number): number {
  if (!maxScore || maxScore <= 0) return 0
  return Math.max(0, Math.min(100, (score / maxScore) * 100))
}

export function gradeForPercent(pct: number): GradeInfo {
  const found = SCALE.find((entry) => pct >= entry.min)
  return found ?? SCALE[SCALE.length - 1]
}

export function gradeFor(score: number, maxScore: number): GradeInfo {
  return gradeForPercent(percentage(score, maxScore))
}

export function remarkFor(score: number, maxScore: number): string {
  return gradeFor(score, maxScore).remark
}

export function scoreTone(pct: number): string {
  return gradeForPercent(pct).text
}

export const GRADE_LEGEND = SCALE.map(({ grade, min, remark }) => ({ grade, min, remark }))
