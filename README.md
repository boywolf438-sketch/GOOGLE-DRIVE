# MADRASAT IBNUHAJAR

A mobile-first school platform where **teachers, parents and administrators** chat, track exams & quizzes, post results and broadcast announcements — with a clean, modern interface inspired by Telegram.

Built with **React 18 + TypeScript + Vite + Tailwind CSS v4**. All data lives in the browser (`localStorage`) and ships pre-loaded with realistic madrasa demo data, so every create / read / update / delete flow works out of the box.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173  (binds 0.0.0.0 for proxied previews)
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `0.0.0.0:5173` |
| `npm run build` | Type-check (`tsc -b`) + production build into `dist/` |
| `npm run preview` | Serve the production build on `0.0.0.0:4173` |
| `npm run typecheck` | Types only |
| `npm run smoke` | **Integration test** — renders the real app in jsdom and drives it end-to-end (76 assertions) |

---

## Demo accounts

Every account is one tap away on the sign-in screen (the buttons sign you in instantly).

| Role | Email | Password | Highlights |
| --- | --- | --- | --- |
| **Admin** | `admin@ibnuhajar.ac.ke` | `admin123` | School-wide stats, people & classes, announcements |
| **Teacher** | `teacher@ibnuhajar.ac.ke` | `teacher123` | Subjects, exams/quizzes, results entry, chats |
| **Parent** | `parent@ibnuhajar.ac.ke` | `parent123` | Two children (Form 1 + Form 2), results, chats |

Extra seeded logins: `ahmed@…`, `fatima@…` (teachers), `maryam@…`, `abdullahi@…`, `said@…`, `halima@…` (parents) — all with password `teacher123` / `parent123`.

New sign-ups work too: pick **Parent**, **Teacher** or **Admin** on the sign-up screen. Admin sign-up requires the access code `IBNUHAJAR-ADMIN` (editable in Settings).

---

## Features

### 1. Authentication & user management

- Sign up, sign in, sign out with validation (duplicate email, password rules, admin access code).
- Session persisted per device; deactivated/deleted accounts are signed out automatically.
- Profile editing and password change from Settings.
- Admins can create, edit, deactivate and delete accounts and assign roles.

### 2. Telegram-style group chat

- Three channel types: **whole school**, **class groups** (`Form 1/2/3`) and **direct messages**.
- Message bubbles with sender name, **role chip** (Admin / Teacher / Parent), avatars, timestamps and day separators.
- Reply-to quotes (tap to jump), 👍 reactions, emoji picker, pinned messages, inline edit for your own messages, delete with confirmation, mock document attachments.
- Per-conversation search, unread badges, "is typing…" indicator and scroll-to-latest button.
- Teachers/admins moderate (pin & delete any message). Demo auto-replies make a conversation feel alive — toggle in **Settings**.
- Two-pane layout on desktop, full-screen list ⇄ thread navigation on mobile.

### 3. Academic & exam management

**Teachers / admins**

- Subjects: create, edit, delete (cascades to that subject's assessments & results). Assign class, code, teacher, accent colour and description.
- Exams & quizzes: create any **exam / quiz / test / assignment** with date, term, max score, draft/publish state.
- Results: pick an assessment, enter each learner's score (validated against max marks), live percentage + grade per row, optional remark, sample fill for quick demos, clear a single result, export the class sheet as **CSV**.
- Publish/unpublish to control what parents see.

**Parents**

- Dashboard with their children's latest results (child switcher for multiple learners), overall average, comparison with the class average, best subject and exam/quiz counts.
- Results screen with filters (type, term, subject), per-subject averages, progress chart and the grading scale.
- Announcements section with school-wide and class-specific updates.

**Admins additionally**

- School-wide KPIs, per-class performance bars, recently posted results, staff & parent overview.
- People & Classes: learners CRUD, parent linking, class management, account administration.
- School settings: name, motto, term, admin code, classes.

### 4. Announcements

- Post to **whole school** or a specific class, mark as **urgent** (red banner) and **pin** to the top.
- Authors (and admins) can edit, pin/unpin and delete; everyone else gets a clean read-only feed.

---

## Design

- **Palette:** deep academic blue (`navy`), emerald green (`brand`) and white, with muted gold for honours and rose for urgent notices.
- **Typography:** Inter, tight tracking, clear hierarchy.
- **Responsive:** sidebar + two-pane layouts on desktop; bottom tab bar, drawer navigation and full-screen threads on mobile. Safe-area insets respected.
- **Accessibility:** semantic landmarks, labelled icon buttons, keyboard support (Enter to send, Shift+Enter for newline, Esc to close dialogs), visible focus rings.
- **Feedback:** toast notifications, inline validation, confirmation dialogs for destructive actions, empty states everywhere.

---

## Project structure

```
src/
├─ components/        # Layout (sidebar/topbar/bottom-nav), ui kit, toasts, error boundary
├─ context/           # AuthContext (session, sign up/in/out), DataContext (all CRUD + persistence)
├─ lib/
│  ├─ db.ts           # localStorage load/save/reset
│  ├─ seed.ts         # demo school, users, learners, subjects, assessments, results, chats, notices
│  ├─ selectors.ts    # derived queries (results, averages, unread counts, visibility rules)
│  ├─ grades.ts       # grading scale (A–F), remarks, colours
│  ├─ prefs.ts        # user preferences (demo auto-reply)
│  └─ utils.ts        # dates, ids, CSV export, avatar tones, formatting
├─ pages/             # AuthPages, Dashboard, ChatPage, AcademicsPage, ResultsEntryPage,
│                     # ResultsPage, AnnouncementsPage, PeoplePage, SettingsPage
├─ types.ts           # shared domain types
└─ App.tsx            # routes + role guards
scripts/smoke.tsx     # end-to-end jsdom integration test (npm run smoke)
```

Data model: `School → Users, Students, Subjects → Assessments → Results`, plus `Conversations → Messages`, `Announcements` and per-user chat read markers.

---

## Testing

`npm run smoke` boots the real component tree in jsdom and walks through the product: sign-in for all three roles, parent dashboard child switching, chat open/send/edit/delete/pin/search, results entry and persistence, announcement creation, admin people management, delete-cascade behaviour, role guards, sign-up validation (wrong admin code, duplicate email) and finally asserts **zero console errors**.

Because everything is stored in `localStorage`, you can wipe back to the original demo content any time with **Settings → Reset demo data** (also in the sidebar), or export/import a JSON backup.
