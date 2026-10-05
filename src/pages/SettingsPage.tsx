import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Database,
  Download,
  KeyRound,
  Plus,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  Upload,
  UserCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  SectionTitle,
  Select,
  Textarea,
} from '../components/ui'
import { GRADE_LEGEND } from '../lib/grades'
import { getAutoReply, setAutoReply, subscribeAutoReply } from '../lib/prefs'
import { cx, download, formatDate, roleChipClass, roleLabel, round, termOptions } from '../lib/utils'
import { classAveragePercent, studentsInClass } from '../lib/selectors'

function AutoReplyToggle() {
  const [enabled, setEnabled] = useState(() => getAutoReply())
  useEffect(() => subscribeAutoReply(setEnabled), [])
  return (
    <label className="flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50/60 p-3.5">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => setAutoReply(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-brand-600"
      />
      <span>
        <span className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
          <Sparkles className="h-4 w-4 text-navy-500" /> Demo auto-replies in chat
        </span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-navy-500">
          When you send a message, another member of the conversation replies automatically after a short delay so the
          chat feels alive. Turn this off for silent testing.
        </span>
      </span>
    </label>
  )
}

export default function SettingsPage() {
  const { user, updateProfile, changePassword, signOut } = useAuth()
  const {
    db,
    updateSchool,
    resetDemoData,
    exportJson,
    importJson,
    createStudent,
  } = useData()
  const { success, error: errorToast, info } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    title: user?.title ?? '',
  })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [school, setSchool] = useState({
    name: db.school.name,
    motto: db.school.motto,
    term: db.school.term,
    adminCode: db.school.adminCode,
  })
  const [newClass, setNewClass] = useState('')
  const [newClassName, setNewClassName] = useState('')
  const [newClassParent, setNewClassParent] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClass, setConfirmClass] = useState<string | null>(null)

  if (!user) return null
  const isAdmin = user.role === 'admin'

  const saveProfile = () => {
    const result = updateProfile({
      name: profile.name.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim() || undefined,
      title: profile.title.trim() || undefined,
    })
    if (!result.ok) {
      errorToast(result.error ?? 'Unable to save your profile.')
      return
    }
    success('Profile updated.')
  }

  const savePassword = () => {
    if (passwords.next !== passwords.confirm) {
      errorToast('New passwords do not match.')
      return
    }
    const result = changePassword(passwords.current, passwords.next)
    if (!result.ok) {
      errorToast(result.error ?? 'Unable to change password.')
      return
    }
    setPasswords({ current: '', next: '', confirm: '' })
    success('Password changed.')
  }

  const saveSchool = () => {
    if (school.name.trim().length < 3) {
      errorToast('School name is too short.')
      return
    }
    updateSchool({
      name: school.name.trim(),
      motto: school.motto.trim(),
      term: school.term,
      adminCode: school.adminCode.trim() || 'IBNUHAJAR-ADMIN',
    })
    success('School settings saved.')
  }

  const addClass = () => {
    const name = newClass.trim()
    if (name.length < 2) {
      errorToast('Enter a class name, e.g. Form 4.')
      return
    }
    if (db.school.classes.includes(name)) {
      errorToast('That class already exists.')
      return
    }
    updateSchool({ classes: [...db.school.classes, name] })
    setNewClass('')
    success(`${name} added.`)
  }

  const addLearnerToClass = () => {
    if (!newClassName.trim()) {
      errorToast('Enter the learner’s name.')
      return
    }
    createStudent({
      name: newClassName.trim(),
      admissionNo: `IBH/${new Date().getFullYear()}/${String(db.students.length + 1).padStart(3, '0')}`,
      className: db.school.classes[0] ?? 'Form 1',
      parentIds: newClassParent ? [newClassParent] : [],
    })
    setNewClassName('')
    setNewClassParent('')
    success('Learner added.')
  }

  const handleExport = () => {
    download(`ibnuhajar-backup-${new Date().toISOString().slice(0, 10)}.json`, exportJson(), 'application/json')
    info('Backup downloaded.')
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = importJson(String(reader.result ?? ''))
      if (!result.ok) {
        errorToast(result.error ?? 'Import failed.')
        return
      }
      success('Data imported successfully.')
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<SettingsIcon className="h-5 w-5" />}
        title="Settings"
        subtitle="Your profile, school preferences and demo data tools."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* profile */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={user.name} size="lg" seed={user.id} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-navy-900">{user.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', roleChipClass(user.role))}>
                  {roleLabel(user.role)}
                </span>
                <span className="text-[11px] text-navy-500">Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Full name">
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Title / department" hint="Shown next to your name in conversations.">
              <Input value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} />
            </Field>
            <Button variant="success" icon={<Save className="h-4 w-4" />} onClick={saveProfile}>
              Save profile
            </Button>
          </div>
        </Card>

        {/* password + prefs */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-[14px] font-bold text-navy-900">
              <KeyRound className="h-4 w-4 text-navy-500" /> Change password
            </h3>
            <div className="mt-4 space-y-4">
              <Field label="Current password">
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="••••••••"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password">
                  <Input
                    type="password"
                    value={passwords.next}
                    onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                    placeholder="At least 6 characters"
                  />
                </Field>
                <Field label="Confirm new password">
                  <Input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </Field>
              </div>
              <Button
                variant="primary"
                icon={<KeyRound className="h-4 w-4" />}
                onClick={savePassword}
                disabled={!passwords.current || !passwords.next}
              >
                Update password
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-[14px] font-bold text-navy-900">
              <UserCircle className="h-4 w-4 text-navy-500" /> Preferences
            </h3>
            <div className="mt-4 space-y-3">
              <AutoReplyToggle />
              <p className="text-[11px] text-navy-500">
                Signed in on this device only. Your session is stored in this browser and is cleared when you sign out.
              </p>
              <Button variant="outline" onClick={() => signOut()}>
                Sign out of this device
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* grading scale */}
      <Card className="p-5">
        <h3 className="text-[14px] font-bold text-navy-900">Grading scale</h3>
        <p className="mt-1 text-[12px] text-navy-500">
          Percentages are calculated from each assessment’s maximum score. Grades and remarks appear on every result row.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {GRADE_LEGEND.map((entry) => (
            <div key={entry.grade} className="rounded-xl border border-navy-100 p-3">
              <p className="text-lg font-extrabold text-navy-900">{entry.grade}</p>
              <p className="text-[11px] font-bold text-navy-600">{entry.min}% and above</p>
              <p className="mt-1 text-[11px] text-navy-500">{entry.remark}</p>
            </div>
          ))}
        </div>
      </Card>

      {isAdmin ? (
        <Card className="p-5">
          <SectionTitle icon={<Building2 className="h-5 w-5" />} title="School settings" subtitle="Visible to every user in the app header and reports." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School name">
              <Input value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
            </Field>
            <Field label="Motto">
              <Input value={school.motto} onChange={(e) => setSchool({ ...school, motto: e.target.value })} />
            </Field>
            <Field label="Current term">
              <Select value={school.term} onChange={(e) => setSchool({ ...school, term: e.target.value })}>
                {[db.school.term, ...termOptions().filter((t) => t !== db.school.term)].map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Admin access code" hint="Required when someone signs up as an admin.">
              <Input value={school.adminCode} onChange={(e) => setSchool({ ...school, adminCode: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4">
            <Button variant="success" icon={<Save className="h-4 w-4" />} onClick={saveSchool}>
              Save school settings
            </Button>
          </div>

          <div className="mt-6 border-t border-navy-100 pt-5">
            <h4 className="text-[13px] font-bold text-navy-900">Classes</h4>
            <p className="mt-0.5 text-[12px] text-navy-500">
              Classes group learners, subjects and class chat channels together.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {db.school.classes.map((className) => {
                const count = studentsInClass(db, className).length
                const average = classAveragePercent(db, className)
                return (
                  <span
                    key={className}
                    className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-navy-700"
                  >
                    {className}
                    <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-[10px] font-bold text-navy-700">
                      {count}
                    </span>
                    {average ? (
                      <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                        {round(average)}%
                      </span>
                    ) : null}
                    {db.school.classes.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClass(className)}
                        className="rounded-full p-0.5 text-rose-500 transition hover:bg-rose-50"
                        aria-label={`Remove ${className}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    ) : null}
                  </span>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Field label="Add a class" className="w-44">
                <Input value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="e.g. Form 4" />
              </Field>
              <Button variant="outline" icon={<Plus className="h-4 w-4" />} onClick={addClass}>
                Add class
              </Button>
            </div>
          </div>

          <div className="mt-6 border-t border-navy-100 pt-5">
            <h4 className="text-[13px] font-bold text-navy-900">Quick learner enrolment</h4>
            <p className="mt-0.5 text-[12px] text-navy-500">
              Add a learner and optionally link a parent account so they immediately see results.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Learner name">
                <Input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g. Maryam Ahmed" />
              </Field>
              <Field label="Link a parent (optional)">
                <Select value={newClassParent} onChange={(e) => setNewClassParent(e.target.value)}>
                  <option value="">No parent yet</option>
                  {db.users
                    .filter((u) => u.role === 'parent')
                    .map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>
            <p className="mt-1.5 text-[11px] text-navy-400">
              New learners are added to {db.school.classes[0]} — change the class under People & Classes.
            </p>
            <div className="mt-3">
              <Button variant="success" icon={<Plus className="h-4 w-4" />} onClick={addLearnerToClass}>
                Add learner
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* data tools */}
      <Card className="p-5">
        <SectionTitle
          icon={<Database className="h-5 w-5" />}
          title="Demo data"
          subtitle="Everything is stored in this browser. Export a backup or restore the original demo content."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
            Export data (JSON)
          </Button>
          <Button variant="outline" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
            Import data
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
          <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmReset(true)}>
            Reset demo data
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Accounts', value: db.users.length },
            { label: 'Learners', value: db.students.length },
            { label: 'Subjects', value: db.subjects.length },
            { label: 'Messages', value: db.messages.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-navy-50 px-3 py-2.5">
              <p className="text-[10px] font-bold tracking-wide text-navy-500 uppercase">{stat.label}</p>
              <p className="mt-0.5 text-lg font-extrabold text-navy-900 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-bold text-navy-900">About MADRASAT IBNUHAJAR</h3>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-navy-600">
              A school communication and exam-records platform for madrasas: Telegram-style group chat for teachers and
              parents, subject and assessment management, result posting with automatic grading, and targeted
              announcements. Roles — Admin, Teacher and Parent — each get a tailored experience, and every screen is
              built mobile-first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="navy">React + TypeScript</Badge>
            <Badge tone="brand">Tailwind CSS</Badge>
            <Badge tone="gold">Demo data included</Badge>
          </div>
        </div>
        <Textarea
          readOnly
          rows={2}
          className="mt-4 bg-navy-50 text-[12px]"
          value={`Demo admin code: ${db.school.adminCode} · Term: ${db.school.term} · Version ${db.version}`}
        />
      </Card>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all demo data?"
        message="Every change you made — new subjects, results, messages and accounts — will be replaced with the original demo content."
        confirmLabel="Reset everything"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData()
          setConfirmReset(false)
          success('Demo data restored.')
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmClass)}
        title="Remove class?"
        message={`${confirmClass} will be removed from class lists and channels. Learners and subjects keep their existing class label until you edit them.`}
        confirmLabel="Remove class"
        onCancel={() => setConfirmClass(null)}
        onConfirm={() => {
          if (confirmClass) {
            updateSchool({ classes: db.school.classes.filter((c) => c !== confirmClass) })
            success(`${confirmClass} removed.`)
          }
          setConfirmClass(null)
        }}
      />
    </div>
  )
}
