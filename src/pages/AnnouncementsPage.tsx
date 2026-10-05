import { useMemo, useState } from 'react'
import { AlertCircle, Megaphone, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import type { Announcement } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import {
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
import { AnnouncementCard } from '../components/shared'
import { announcementsFor } from '../lib/selectors'

interface Draft {
  id?: string
  title: string
  body: string
  audience: string
  priority: 'normal' | 'high'
  pinned: boolean
}

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const { db, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useData()
  const { success, error: errorToast } = useToast()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirm, setConfirm] = useState<Announcement | null>(null)
  const [search, setSearch] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all')

  const canPost = user?.role === 'admin' || user?.role === 'teacher'
  const canManage = (announcement: Announcement) => user?.role === 'admin' || announcement.authorId === user?.id

  const visible = useMemo(() => (user ? announcementsFor(db, user) : []), [db, user])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return visible
      .filter((a) => (audienceFilter === 'all' ? true : a.audience === audienceFilter))
      .filter((a) => (q ? a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q) : true))
  }, [visible, search, audienceFilter])

  if (!user) return null

  const openNew = () =>
    setDraft({
      title: '',
      body: '',
      audience: user.role === 'parent' ? 'all' : user.role === 'teacher' ? db.school.classes[0] ?? 'all' : 'all',
      priority: 'normal',
      pinned: false,
    })

  const openEdit = (announcement: Announcement) =>
    setDraft({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
      priority: announcement.priority,
      pinned: announcement.pinned,
    })

  const save = () => {
    if (!draft) return
    const title = draft.title.trim()
    const body = draft.body.trim()
    if (title.length < 4) {
      errorToast('Please write a title (at least 4 characters).')
      return
    }
    if (body.length < 10) {
      errorToast('Please write the announcement details.')
      return
    }
    if (draft.id) {
      updateAnnouncement(draft.id, {
        title,
        body,
        audience: draft.audience,
        priority: draft.priority,
        pinned: draft.pinned,
      })
      success('Announcement updated.')
    } else {
      createAnnouncement({
        title,
        body,
        audience: draft.audience,
        priority: draft.priority,
        pinned: draft.pinned,
        authorId: user.id,
      })
      success('Announcement posted.')
    }
    setDraft(null)
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<Megaphone className="h-5 w-5" />}
        title="Announcements"
        subtitle={
          canPost
            ? 'Post updates for the whole school or a specific class.'
            : 'Recent updates from the madrasa administration and your child’s teachers.'
        }
        action={
          canPost ? (
            <Button icon={<Plus className="h-4 w-4" />} variant="success" onClick={openNew}>
              New announcement
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          className="sm:max-w-xl"
          value={audienceFilter}
          onChange={setAudienceFilter}
          options={[
            { value: 'all', label: 'Whole school' },
            ...db.school.classes.map((className) => ({ value: className, label: className })),
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Search announcements…" className="sm:max-w-xs" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title="No announcements here yet"
            message={canPost ? 'Post the first update for parents and staff.' : 'Check back soon — new notices will appear here.'}
            action={
              canPost ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>
                  Post announcement
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              author={db.users.find((u) => u.id === announcement.authorId)}
              actions={
                canManage(announcement) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        updateAnnouncement(announcement.id, { pinned: !announcement.pinned })
                        success(announcement.pinned ? 'Unpinned.' : 'Pinned to the top.')
                      }}
                      className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100 hover:text-navy-900"
                      aria-label={announcement.pinned ? 'Unpin announcement' : 'Pin announcement'}
                    >
                      {announcement.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(announcement)}
                      className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100 hover:text-navy-900"
                      aria-label="Edit announcement"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm(announcement)}
                      className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                      aria-label="Delete announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit announcement' : 'New announcement'}
        description="Parents see announcements for their class and for the whole school."
        footer={
          <>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={save}>
              {draft?.id ? 'Save changes' : 'Post announcement'}
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <Field label="Title" required>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. End-term examination timetable"
              />
            </Field>
            <Field label="Details" required>
              <Textarea
                rows={5}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Write the full announcement here…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Audience" required hint="Whole school reaches every parent and teacher.">
                <Select value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })}>
                  <option value="all">Whole school</option>
                  {db.school.classes.map((className) => (
                    <option key={className} value={className}>
                      {className} only
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: e.target.value as 'normal' | 'high' })}
                >
                  <option value="normal">Normal</option>
                  <option value="high">Urgent</option>
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50/60 p-3.5">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="flex items-center gap-2 text-[13px] font-semibold text-navy-800">
                <Pin className="h-4 w-4 text-navy-500" /> Pin to the top of the feed
              </span>
            </label>
            {draft.priority === 'high' ? (
              <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Urgent announcements are highlighted with a red banner on parent dashboards. Reserve this for
                time-sensitive notices.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete announcement?"
        message={`“${confirm?.title}” will be removed from every dashboard immediately.`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) deleteAnnouncement(confirm.id)
          setConfirm(null)
          success('Announcement deleted.')
        }}
      />
    </div>
  )
}
