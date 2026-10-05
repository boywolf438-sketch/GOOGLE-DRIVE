import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  GraduationCap,
  Link2,
  Link2Off,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import type { Role, Student, User } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import {
  Avatar,
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
} from '../components/ui'
import { childrenOf, studentAveragePercent } from '../lib/selectors'
import { cx, formatDate, roleChipClass, roleLabel, round } from '../lib/utils'

interface StudentDraft {
  id?: string
  name: string
  admissionNo: string
  className: string
  guardianPhone: string
  parentIds: string[]
}

interface UserDraft {
  id?: string
  name: string
  email: string
  role: Role
  title: string
  phone: string
  password: string
  active: boolean
}

export default function PeoplePage() {
  const { user } = useAuth()
  const {
    db,
    createStudent,
    updateStudent,
    deleteStudent,
    toggleParentLink,
    createUser,
    updateUser,
    deleteUser,
  } = useData()
  const { success, error: errorToast } = useToast()

  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState<'learners' | 'staff'>('learners')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [studentDraft, setStudentDraft] = useState<StudentDraft | null>(null)
  const [userDraft, setUserDraft] = useState<UserDraft | null>(null)
  const [linkTarget, setLinkTarget] = useState<Student | null>(null)
  const [confirmStudent, setConfirmStudent] = useState<Student | null>(null)
  const [confirmUser, setConfirmUser] = useState<User | null>(null)

  const parents = db.users.filter((u) => u.role === 'parent')
  const staff = db.users.filter((u) => u.role !== 'parent')

  const learners = useMemo(() => {
    const q = search.trim().toLowerCase()
    return db.students
      .filter((s) => (classFilter === 'all' ? true : s.className === classFilter))
      .filter((s) =>
        q ? s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => `${a.className}${a.name}`.localeCompare(`${b.className}${b.name}`))
  }, [db.students, classFilter, search])

  const peopleList = useMemo(() => {
    const q = search.trim().toLowerCase()
    const source = isAdmin ? db.users : parents
    return source
      .filter((person) => (q ? person.name.toLowerCase().includes(q) || person.email.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [db.users, parents, search, isAdmin])

  if (!user) return null

  const openNewStudent = () =>
    setStudentDraft({
      name: '',
      admissionNo: `IBH/${new Date().getFullYear()}/${String(db.students.length + 1).padStart(3, '0')}`,
      className: db.school.classes[0] ?? 'Form 1',
      guardianPhone: '',
      parentIds: [],
    })

  const openEditStudent = (student: Student) =>
    setStudentDraft({
      id: student.id,
      name: student.name,
      admissionNo: student.admissionNo,
      className: student.className,
      guardianPhone: student.guardianPhone ?? '',
      parentIds: student.parentIds,
    })

  const saveStudent = () => {
    if (!studentDraft) return
    const name = studentDraft.name.trim()
    if (name.length < 3) {
      errorToast('Enter the learner’s full name.')
      return
    }
    if (!studentDraft.admissionNo.trim()) {
      errorToast('Enter an admission number.')
      return
    }
    if (studentDraft.id) {
      updateStudent(studentDraft.id, {
        name,
        admissionNo: studentDraft.admissionNo.trim(),
        className: studentDraft.className,
        guardianPhone: studentDraft.guardianPhone.trim() || undefined,
        parentIds: studentDraft.parentIds,
      })
      success('Learner record updated.')
    } else {
      createStudent({
        name,
        admissionNo: studentDraft.admissionNo.trim(),
        className: studentDraft.className,
        guardianPhone: studentDraft.guardianPhone.trim() || undefined,
        parentIds: studentDraft.parentIds,
      })
      success('Learner added.')
    }
    setStudentDraft(null)
  }

  const openNewUser = () =>
    setUserDraft({
      name: '',
      email: '',
      role: 'teacher',
      title: '',
      phone: '',
      password: 'changeme123',
      active: true,
    })

  const openEditUser = (person: User) =>
    setUserDraft({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      title: person.title ?? '',
      phone: person.phone ?? '',
      password: person.password,
      active: person.active,
    })

  const saveUser = () => {
    if (!userDraft) return
    const name = userDraft.name.trim()
    const email = userDraft.email.trim().toLowerCase()
    if (name.length < 3) {
      errorToast('Enter the person’s full name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorToast('Enter a valid email address.')
      return
    }
    if (db.users.some((u) => u.id !== userDraft.id && u.email.toLowerCase() === email)) {
      errorToast('Another account already uses that email.')
      return
    }
    if (userDraft.password.length < 6) {
      errorToast('Passwords must be at least 6 characters.')
      return
    }
    if (userDraft.id) {
      updateUser(userDraft.id, {
        name,
        email,
        role: userDraft.role,
        title: userDraft.title.trim() || roleLabel(userDraft.role),
        phone: userDraft.phone.trim() || undefined,
        password: userDraft.password,
        active: userDraft.active,
      })
      success('Account updated.')
    } else {
      createUser({
        name,
        email,
        role: userDraft.role,
        title: userDraft.title.trim() || roleLabel(userDraft.role),
        phone: userDraft.phone.trim() || undefined,
        password: userDraft.password,
        active: userDraft.active,
      })
      success(`${roleLabel(userDraft.role)} account created.`)
    }
    setUserDraft(null)
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<Users className="h-5 w-5" />}
        title={isAdmin ? 'People & Classes' : 'Learners & Parents'}
        subtitle={
          isAdmin
            ? 'Manage learner records, staff accounts and parent links.'
            : 'View the learners you teach and the contact details of their parents.'
        }
        action={
          isAdmin ? (
            tab === 'learners' ? (
              <Button icon={<Plus className="h-4 w-4" />} variant="success" onClick={openNewStudent}>
                Add learner
              </Button>
            ) : (
              <Button icon={<UserPlus className="h-4 w-4" />} variant="success" onClick={openNewUser}>
                Add account
              </Button>
            )
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          className="sm:max-w-md"
          value={tab}
          onChange={(value) => {
            setTab(value)
            setSearch('')
          }}
          options={[
            { value: 'learners', label: 'Learners', count: db.students.length, icon: <GraduationCap className="h-4 w-4" /> },
            {
              value: 'staff',
              label: isAdmin ? 'Staff & Parents' : 'Parents',
              count: isAdmin ? db.users.length : parents.length,
              icon: <ShieldCheck className="h-4 w-4" />,
            },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={tab === 'learners' ? 'Search learners…' : 'Search people…'}
            className="sm:w-64"
          />
          {tab === 'learners' ? (
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-10 w-auto py-0">
              <option value="all">All classes</option>
              {db.school.classes.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </div>

      {tab === 'learners' ? (
        learners.length === 0 ? (
          <Card>
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No learners found"
              message="Add learners to a class so teachers can post results and parents can track progress."
              action={isAdmin ? <Button icon={<Plus className="h-4 w-4" />} onClick={openNewStudent}>Add learner</Button> : undefined}
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {learners.map((student) => {
              const linkedParents = student.parentIds
                .map((id) => db.users.find((u) => u.id === id))
                .filter((p): p is User => Boolean(p))
              const average = studentAveragePercent(db, student.id)
              return (
                <Card key={student.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={student.name} size="lg" seed={student.id} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[14px] font-bold text-navy-900">{student.name}</h3>
                      <p className="truncate text-[11px] text-navy-500">{student.admissionNo}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone="navy">{student.className}</Badge>
                        <Badge tone={average >= 70 ? 'brand' : average >= 50 ? 'gold' : 'rose'}>
                          {average ? `${round(average)}% avg` : 'No results'}
                        </Badge>
                      </div>
                    </div>
                    {isAdmin ? (
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => openEditStudent(student)}
                          className="rounded-lg p-1.5 text-navy-500 transition hover:bg-navy-100 hover:text-navy-900"
                          aria-label={`Edit ${student.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmStudent(student)}
                          className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50"
                          aria-label={`Delete ${student.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-navy-50 pt-3">
                    <p className="text-[10px] font-bold tracking-wider text-navy-400 uppercase">Parents / guardians</p>
                    {linkedParents.length === 0 ? (
                      <p className="text-[12px] text-navy-500">No parent linked yet.</p>
                    ) : (
                      linkedParents.map((parent) => (
                        <div key={parent.id} className="flex items-center gap-2">
                          <Avatar name={parent.name} size="xs" seed={parent.id} soft />
                          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-navy-700">
                            {parent.name}
                          </span>
                          {parent.phone ? (
                            <a
                              href={`tel:${parent.phone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
                            >
                              <Phone className="h-3 w-3" /> Call
                            </a>
                          ) : null}
                        </div>
                      ))
                    )}
                    {student.guardianPhone ? (
                      <p className="text-[11px] text-navy-500">Guardian line: {student.guardianPhone}</p>
                    ) : null}
                    {isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        block
                        className="mt-2"
                        icon={linkedParents.length ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                        onClick={() => setLinkTarget(student)}
                      >
                        {linkedParents.length ? 'Manage parent links' : 'Link a parent'}
                      </Button>
                    ) : null}
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {peopleList.length === 0 ? (
            <Card>
              <EmptyState icon={<Users className="h-6 w-6" />} title="No accounts found" message="Try another search term." />
            </Card>
          ) : (
            peopleList.map((person) => {
              const linkedChildren = childrenOf(db, person.id)
              return (
                <Card key={person.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <Avatar name={person.name} size="lg" seed={person.id} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[14px] font-bold text-navy-900">{person.name}</h3>
                        <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', roleChipClass(person.role))}>
                          {roleLabel(person.role)}
                        </span>
                        {person.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 uppercase">
                            <BadgeCheck className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 uppercase">Deactivated</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-navy-600">{person.title ?? roleLabel(person.role)}</p>
                      <p className="text-[11px] text-navy-500">
                        {person.email}
                        {person.phone ? ` · ${person.phone}` : ''}
                      </p>
                      <p className="mt-1 text-[10px] text-navy-400">
                        Joined {formatDate(person.createdAt)}
                        {person.role === 'parent'
                          ? linkedChildren.length
                            ? ` · linked to ${linkedChildren.map((c) => c.name).join(', ')}`
                            : ' · not linked to a learner yet'
                          : ''}
                      </p>
                    </div>
                    {isAdmin ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateUser(person.id, { active: !person.active })
                            success(person.active ? 'Account deactivated.' : 'Account reactivated.')
                          }}
                        >
                          {person.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => openEditUser(person)}
                          className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100 hover:text-navy-900"
                          aria-label={`Edit ${person.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {person.id !== user.id ? (
                          <button
                            type="button"
                            onClick={() => setConfirmUser(person)}
                            className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                            aria-label={`Delete ${person.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </Card>
              )
            })
          )}

          {isAdmin ? (
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-navy-900">Unlinked parent accounts</p>
                  <p className="text-[12px] text-navy-500">
                    {parents.filter((p) => childrenOf(db, p.id).length === 0).length
                      ? 'Link these parents to a learner so their dashboards show results.'
                      : 'Every parent account is linked to a learner.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parents
                    .filter((p) => childrenOf(db, p.id).length === 0)
                    .map((parent) => (
                      <span key={parent.id} className="rounded-full bg-gold-100 px-3 py-1 text-[11px] font-bold text-gold-700">
                        {parent.name}
                      </span>
                    ))}
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      {!isAdmin && tab === 'staff' ? (
        <Card className="p-4">
          <p className="text-[12px] text-navy-500">
            Only administrators can create accounts or change roles.{' '}
            <Link to="/chat" className="font-bold text-navy-800 underline decoration-brand-400 decoration-2 underline-offset-2">
              Message the admin office
            </Link>{' '}
            for changes.
          </p>
        </Card>
      ) : null}

      {/* ------------------------------------------------------ learner modal */}
      <Modal
        open={Boolean(studentDraft)}
        onClose={() => setStudentDraft(null)}
        title={studentDraft?.id ? 'Edit learner' : 'Add learner'}
        footer={
          <>
            <Button variant="outline" onClick={() => setStudentDraft(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={saveStudent}>
              {studentDraft?.id ? 'Save changes' : 'Add learner'}
            </Button>
          </>
        }
      >
        {studentDraft ? (
          <div className="space-y-4">
            <Field label="Full name" required>
              <Input
                value={studentDraft.name}
                onChange={(e) => setStudentDraft({ ...studentDraft, name: e.target.value })}
                placeholder="e.g. Zainab Bilal"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Admission number" required>
                <Input
                  value={studentDraft.admissionNo}
                  onChange={(e) => setStudentDraft({ ...studentDraft, admissionNo: e.target.value })}
                />
              </Field>
              <Field label="Class" required>
                <Select
                  value={studentDraft.className}
                  onChange={(e) => setStudentDraft({ ...studentDraft, className: e.target.value })}
                >
                  {db.school.classes.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Guardian phone" hint="Used for quick calls from the parent list.">
              <Input
                value={studentDraft.guardianPhone}
                onChange={(e) => setStudentDraft({ ...studentDraft, guardianPhone: e.target.value })}
                placeholder="+254 7xx xxx xxx"
              />
            </Field>
            <Field label="Linked parents" hint="Tap to link or unlink a parent account.">
              <div className="flex flex-wrap gap-2">
                {parents.map((parent) => {
                  const linked = studentDraft.parentIds.includes(parent.id)
                  return (
                    <button
                      key={parent.id}
                      type="button"
                      onClick={() =>
                        setStudentDraft({
                          ...studentDraft,
                          parentIds: linked
                            ? studentDraft.parentIds.filter((id) => id !== parent.id)
                            : [...studentDraft.parentIds, parent.id],
                        })
                      }
                      className={cx(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
                        linked
                          ? 'border-brand-400 bg-brand-50 text-brand-800'
                          : 'border-navy-200 bg-white text-navy-600 hover:bg-navy-50',
                      )}
                    >
                      <Avatar name={parent.name} size="xs" seed={parent.id} soft />
                      {parent.name}
                    </button>
                  )
                })}
                {parents.length === 0 ? <p className="text-[12px] text-navy-500">No parent accounts exist yet.</p> : null}
              </div>
            </Field>
          </div>
        ) : null}
      </Modal>

      {/* --------------------------------------------------------- user modal */}
      <Modal
        open={Boolean(userDraft)}
        onClose={() => setUserDraft(null)}
        title={userDraft?.id ? 'Edit account' : 'Add account'}
        description="Accounts can be teachers, parents or administrators."
        footer={
          <>
            <Button variant="outline" onClick={() => setUserDraft(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={saveUser}>
              {userDraft?.id ? 'Save changes' : 'Create account'}
            </Button>
          </>
        }
      >
        {userDraft ? (
          <div className="space-y-4">
            <Field label="Full name" required>
              <Input
                value={userDraft.name}
                onChange={(e) => setUserDraft({ ...userDraft, name: e.target.value })}
                placeholder="e.g. Ustadh Ahmed Noor"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required>
                <Input
                  type="email"
                  value={userDraft.email}
                  onChange={(e) => setUserDraft({ ...userDraft, email: e.target.value })}
                />
              </Field>
              <Field label="Role" required>
                <Select
                  value={userDraft.role}
                  onChange={(e) => setUserDraft({ ...userDraft, role: e.target.value as Role })}
                >
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title / department">
                <Input
                  value={userDraft.title}
                  onChange={(e) => setUserDraft({ ...userDraft, title: e.target.value })}
                  placeholder="e.g. Arabic & Fiqh"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={userDraft.phone}
                  onChange={(e) => setUserDraft({ ...userDraft, phone: e.target.value })}
                  placeholder="+254 7xx xxx xxx"
                />
              </Field>
            </div>
            <Field label="Password" required hint="Share this with the account owner; they can change it later.">
              <Input
                value={userDraft.password}
                onChange={(e) => setUserDraft({ ...userDraft, password: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50/60 p-3.5">
              <input
                type="checkbox"
                checked={userDraft.active}
                onChange={(e) => setUserDraft({ ...userDraft, active: e.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-[13px] font-semibold text-navy-800">Account active (can sign in)</span>
            </label>
          </div>
        ) : null}
      </Modal>

      {/* ------------------------------------------------------------ linking */}
      <Modal
        open={Boolean(linkTarget)}
        onClose={() => setLinkTarget(null)}
        title={`Parent links — ${linkTarget?.name ?? ''}`}
        description="Linked parents see this learner’s results on their dashboard."
        footer={
          <Button variant="primary" onClick={() => setLinkTarget(null)}>
            Done
          </Button>
        }
      >
        <div className="space-y-2">
          {parents.map((parent) => {
            const current = db.students.find((s) => s.id === linkTarget?.id)
            const linked = current?.parentIds.includes(parent.id) ?? false
            return (
              <button
                key={parent.id}
                type="button"
                onClick={() => {
                  if (!linkTarget) return
                  toggleParentLink(linkTarget.id, parent.id)
                  success(linked ? `${parent.name} unlinked.` : `${parent.name} linked.`)
                }}
                className={cx(
                  'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                  linked ? 'border-brand-400 bg-brand-50' : 'border-navy-100 bg-white hover:bg-navy-50',
                )}
              >
                <Avatar name={parent.name} seed={parent.id} soft />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-navy-900">{parent.name}</span>
                  <span className="block truncate text-[11px] text-navy-500">
                    {childrenOf(db, parent.id).length
                      ? `Currently linked to ${childrenOf(db, parent.id).map((c) => c.name).join(', ')}`
                      : 'No learners linked yet'}
                  </span>
                </span>
                {linked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-bold text-white uppercase">
                    <Link2 className="h-3 w-3" /> Linked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2.5 py-1 text-[10px] font-bold text-navy-600 uppercase">
                    <Link2Off className="h-3 w-3" /> Not linked
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmStudent)}
        title="Remove learner?"
        message={`${confirmStudent?.name} and all recorded results will be permanently removed.`}
        confirmLabel="Remove learner"
        onCancel={() => setConfirmStudent(null)}
        onConfirm={() => {
          if (confirmStudent) deleteStudent(confirmStudent.id)
          setConfirmStudent(null)
          success('Learner removed.')
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmUser)}
        title="Delete account?"
        message={`${confirmUser?.name} will lose access immediately and be unlinked from learners and chats.`}
        confirmLabel="Delete account"
        onCancel={() => setConfirmUser(null)}
        onConfirm={() => {
          if (confirmUser) deleteUser(confirmUser.id)
          setConfirmUser(null)
          success('Account deleted.')
        }}
      />
    </div>
  )
}
