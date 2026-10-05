/**
 * Integration smoke test — renders the real app inside jsdom and drives the UI
 * the way a user would (sign in, chat, create subjects/exams, post results,
 * manage people, delete with cascade).
 *
 *   npm run smoke
 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
})

const g = globalThis as unknown as Record<string, unknown>
g.window = dom.window
g.document = dom.window.document
// `navigator` is a getter-only global in Node 22 — replace the descriptor.
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true, writable: true })
g.HTMLElement = dom.window.HTMLElement
g.HTMLInputElement = dom.window.HTMLInputElement
g.HTMLTextAreaElement = dom.window.HTMLTextAreaElement
g.Element = dom.window.Element
g.Node = dom.window.Node
g.Event = dom.window.Event
g.MouseEvent = dom.window.MouseEvent
g.KeyboardEvent = dom.window.KeyboardEvent
g.localStorage = dom.window.localStorage
g.sessionStorage = dom.window.sessionStorage
g.getComputedStyle = dom.window.getComputedStyle
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number
g.cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as NodeJS.Timeout)
g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
g.IS_REACT_ACT_ENVIRONMENT = true

const { createRoot } = await import('react-dom/client')
const React = await import('react')
const { act } = React as unknown as { act: (cb: () => void | Promise<void>) => Promise<void> }
const { MemoryRouter } = await import('react-router-dom')
const App = (await import('../src/App')).default

let failures = 0
const log = (...args: unknown[]) => console.log(...args)

/** Capture anything the app logs as an error (React render errors included). */
const consoleErrors: string[] = []
const realConsoleError = console.error.bind(console)
console.error = (...args: unknown[]) => {
  consoleErrors.push(args.map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : String(a))).join(' '))
  realConsoleError(...args)
}

function check(label: string, condition: boolean, extra = '') {
  if (condition) log(`  \x1b[32m✓\x1b[0m ${label}`)
  else {
    failures += 1
    log(`  \x1b[31m✗ ${label}\x1b[0m ${extra}`)
  }
}

const bodyText = () => (dom.window.document.body.textContent ?? '').replace(/\s+/g, ' ')
const db = () => JSON.parse(dom.window.localStorage.getItem('ibnuhajar.db') ?? '{}')

const INTERACTIVE = 'button, a, [role="tab"], [role="button"]'

function findClickable(label: string, exact = false): HTMLElement | null {
  const nodes = [...dom.window.document.querySelectorAll<HTMLElement>(INTERACTIVE)]
  const norm = (value: string) => value.replace(/\s+/g, ' ').trim()
  return (
    nodes.find((node) => (exact ? norm(node.textContent ?? '') === label : norm(node.textContent ?? '').includes(label))) ??
    null
  )
}

async function click(el: HTMLElement | null, label: string) {
  if (!el) throw new Error(`click target not found: ${label}`)
  await act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

async function clickText(label: string, exact = false) {
  await click(findClickable(label, exact), `text:${label}`)
}

/** Clicks the *last* interactive element with this label (e.g. a modal footer button). */
async function clickLast(label: string, exact = true) {
  const norm = (value: string) => value.replace(/\s+/g, ' ').trim()
  const nodes = [...dom.window.document.querySelectorAll<HTMLElement>(INTERACTIVE)].filter((node) =>
    exact ? norm(node.textContent ?? '') === label : norm(node.textContent ?? '').includes(label),
  )
  await click(nodes[nodes.length - 1] ?? null, `last text:${label}`)
}

async function clickSelector(selector: string, label = selector) {
  await click(dom.window.document.querySelector<HTMLElement>(selector), label)
}

async function type(el: HTMLInputElement | HTMLTextAreaElement | null, value: string) {
  if (!el) throw new Error('input target not found')
  const proto = el instanceof dom.window.HTMLTextAreaElement ? dom.window.HTMLTextAreaElement : dom.window.HTMLInputElement
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set
  await act(async () => {
    setter?.call(el, value)
    el.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
async function settle(ms = 40) {
  await act(async () => {
    await sleep(ms)
  })
}

async function main() {
  const container = dom.window.document.getElementById('root')!
  const root = createRoot(container)

  log('\n\x1b[1m1. Authentication screen\x1b[0m')
  await act(async () => {
    root.render(React.createElement(MemoryRouter, { initialEntries: ['/signin'] }, React.createElement(App)))
  })
  await settle(80)
  check('renders the sign-in heading', bodyText().includes('Welcome back'))
  check('shows the three demo accounts', bodyText().includes('Parent · Bilal Omar') && bodyText().includes('Teacher · Ustadha Amina Hassan'))
  check('advertises sign-up route', Boolean(dom.window.document.querySelector('a[href="/signup"]')))

  log('\n\x1b[1m2. Parent sign-in → dashboard\x1b[0m')
  await clickText('Parent · Bilal Omar')
  await settle(90)
  check('parent dashboard greets the user', bodyText().includes('Good ') && bodyText().includes('Bilal Omar'))
  check('overall average tile renders', bodyText().includes('Overall average'))
  check('latest results card renders', bodyText().includes('latest results'))
  check('child switcher for two children', bodyText().includes('Yusuf Bilal · Form 1') && bodyText().includes('Zainab Bilal · Form 2'))
  check('announcements preview renders', bodyText().includes('Mid-term break and closing day'))

  log('\n\x1b[1m3. Switch to the second child\x1b[0m')
  await clickText('Zainab Bilal · Form 2')
  await settle(60)
  check('switching child updates the results', bodyText().includes('Mid-Term Exam — Tajweed'))
  check('performance ring shows the new average', bodyText().includes('Average'))

  log('\n\x1b[1m4. Chat: list → open → send → react\x1b[0m')
  await clickText('Messages')
  await settle(70)
  check('chat list shows the school group', bodyText().includes('School Group'))
  check('chat list shows class groups', bodyText().includes('Form 2 Parents'))
  await clickText('Form 2 Parents')
  await settle(70)
  check('conversation opens with messages', bodyText().includes('Tajweed clinic') || bodyText().includes('extra lessons'))
  check('pinned banner shows', bodyText().includes('Pinned message'))
  check('seeded reactions render', bodyText().includes('🤲') || bodyText().includes('👍'))

  await type(dom.window.document.querySelector<HTMLTextAreaElement>('textarea'), 'Assalamu alaikum, this is a smoke-test message.')
  await clickSelector('button[aria-label="Send message"]', 'send button')
  await settle(70)
  check('sent message appears in the thread', bodyText().includes('this is a smoke-test message'))
  check('message persisted to localStorage', JSON.stringify(db().messages ?? []).includes('this is a smoke-test message'))

  const myMessage = [...dom.window.document.querySelectorAll<HTMLElement>('div')].find((d) =>
    (d.textContent ?? '').includes('this is a smoke-test message'),
  )
  await act(async () => {
    myMessage?.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }))
  })
  const reactButton = dom.window.document.querySelector<HTMLElement>('button[aria-label="Add reaction"]')
  check('reaction picker button exists', Boolean(reactButton))

  log('\n\x1b[1m4b. Edit and delete a message\x1b[0m')
  const actionButtons = [...dom.window.document.querySelectorAll<HTMLElement>('button[aria-label="Message actions"]')]
  await click(actionButtons[actionButtons.length - 1] ?? null, 'message actions')
  await settle(40)
  await clickText('Edit', true)
  await settle(40)
  await type(dom.window.document.querySelector<HTMLTextAreaElement>('textarea'), 'Assalamu alaikum, this is an edited smoke-test message.')
  await clickSelector('button[aria-label="Save message"]', 'save message')
  await settle(70)
  check('edited message text updated', bodyText().includes('an edited smoke-test message'))
  const editedEntry = (db().messages ?? []).find((m: { text: string }) => m.text.includes('edited smoke-test message'))
  check('edit recorded with editedAt timestamp', Boolean(editedEntry?.editedAt))

  const actionButtons2 = [...dom.window.document.querySelectorAll<HTMLElement>('button[aria-label="Message actions"]')]
  await click(actionButtons2[actionButtons2.length - 1] ?? null, 'message actions again')
  await settle(40)
  await clickText('Delete', true)
  await settle(40)
  check('delete confirmation shown', bodyText().includes('Delete this message?'))
  await clickText('Delete message')
  await settle(70)
  check('message marked deleted', bodyText().includes('This message was deleted'))
  check(
    'delete persisted',
    (db().messages ?? []).some((m: { deleted?: boolean }) => m.deleted === true),
  )

  log('\n\x1b[1m5. Chat search\x1b[0m')
  await clickSelector('button[aria-label="Search messages"]', 'message search')
  await settle(40)
  const searchBox = [...dom.window.document.querySelectorAll<HTMLInputElement>('input')].find((i) => i.placeholder.includes('Search in this conversation'))
  await type(searchBox ?? null, 'quiz')
  await settle(60)
  check('message search filters the thread', bodyText().includes('matching message'))

  log('\n\x1b[1m6. Parent results page\x1b[0m')
  await clickText('Results')
  await settle(80)
  check('results page renders', bodyText().includes('My children’s results'))
  check('subject averages panel', bodyText().includes('Subject averages'))
  check('grading scale legend', bodyText().includes('Grading scale'))
  check('progress chart', bodyText().includes('Progress trend'))

  log('\n\x1b[1m7. Sign out → teacher account\x1b[0m')
  await clickText('Sign out')
  await settle(70)
  check('back at the sign-in screen', bodyText().includes('Welcome back'))
  await clickText('Teacher · Ustadha Amina Hassan')
  await settle(90)
  check('teacher dashboard renders', bodyText().includes('My subjects'))
  check('teacher sees marking queue', bodyText().includes('Results to complete'))
  check('quick actions available', bodyText().includes('Create exam or quiz'))

  log('\n\x1b[1m7b. Teacher pins a message in chat\x1b[0m')
  await clickText('Messages')
  await settle(70)
  await clickText('Form 2 Parents')
  await settle(70)
  const pinActions = [...dom.window.document.querySelectorAll<HTMLElement>('button[aria-label="Message actions"]')]
  await click(pinActions[pinActions.length - 1] ?? null, 'message actions')
  await settle(40)
  await clickText('Pin message')
  await settle(70)
  check('message pinned via moderation menu', (db().messages ?? []).some((m: { pinned?: boolean }) => m.pinned === true))

  log('\n\x1b[1m8. Academics: create → edit subject\x1b[0m')
  await clickText('Academics & Exams')
  await settle(70)
  check('academics page renders', bodyText().includes('Academics & Exam Management'))
  check('seed subjects listed', bodyText().includes('Qur’an Recitation'))

  await clickText('New subject')
  await settle(50)
  await type(dom.window.document.querySelector<HTMLInputElement>('input[placeholder="e.g. Tajweed"]'), 'Smoke Test Subject')
  await type(dom.window.document.querySelector<HTMLInputElement>('input[placeholder="TAJ-201"]'), 'SMK-999')
  await clickText('Create subject')
  await settle(70)
  check('new subject appears in the grid', bodyText().includes('Smoke Test Subject'))
  check('subject stored in db', (db().subjects ?? []).some((s: { name: string }) => s.name === 'Smoke Test Subject'))

  await clickSelector('button[aria-label="Edit Smoke Test Subject"]', 'edit subject')
  await settle(50)
  const editInput = dom.window.document.querySelector<HTMLInputElement>('input[value="Smoke Test Subject"]')
  await type(editInput, 'Smoke Test Subject Edited')
  await clickText('Save changes')
  await settle(70)
  check('edit persists', (db().subjects ?? []).some((s: { name: string }) => s.name === 'Smoke Test Subject Edited'))

  log('\n\x1b[1m9. Create an exam, then post results\x1b[0m')
  await clickText('Exams & Quizzes')
  await settle(70)
  check('assessments tab renders', bodyText().includes('All types'))
  await clickText('New exam / quiz')
  await settle(50)
  await type(dom.window.document.querySelector<HTMLInputElement>('input[placeholder="e.g. End-Term Exam — Tajweed"]'), 'Smoke Test Exam')
  await clickText('Create assessment')
  await settle(70)
  check('assessment created', (db().assessments ?? []).some((a: { title: string }) => a.title === 'Smoke Test Exam'))

  await clickText('Assessments', true)
  await settle(90)
  check('results entry page renders', bodyText().includes('Post exam & quiz results'))
  await clickText('Fill samples')
  await settle(50)
  const beforeSave = (db().results ?? []).length
  await clickText('Save results')
  await settle(80)
  check('results were saved', (db().results ?? []).length > beforeSave)
  check('score inputs render per learner', dom.window.document.querySelectorAll('input[type="number"]').length > 0)

  log('\n\x1b[1m10. Teacher announcement CRUD\x1b[0m')
  await clickText('Announcements', true)
  await settle(70)
  await clickText('New announcement')
  await settle(50)
  await type(dom.window.document.querySelector<HTMLInputElement>('input[placeholder="e.g. End-term examination timetable"]'), 'Smoke test notice')
  await type(dom.window.document.querySelector<HTMLTextAreaElement>('textarea'), 'Created by the automated smoke test run.')
  await clickText('Post announcement')
  await settle(70)
  check('announcement posted', bodyText().includes('Smoke test notice'))
  const posted = (db().announcements ?? []).find((a: { title: string }) => a.title === 'Smoke test notice')
  check('announcement stored with author + audience', Boolean(posted) && posted.authorId === 'u_amina')

  log('\n\x1b[1m11. Admin account: dashboard + people management\x1b[0m')
  await clickText('Sign out')
  await settle(70)
  await clickText('Admin · Ustadh Ibrahim Yusuf')
  await settle(110)
  check('admin dashboard renders', bodyText().includes('Class performance'))
  check('admin stats render', bodyText().includes('Learners') && bodyText().includes('Results posted'))
  check('nav exposes people & academics', Boolean(findClickable('People & Classes')) && Boolean(findClickable('Academics & Exams')))

  await clickText('People & Classes')
  await settle(80)
  check('people page renders', bodyText().includes('People & Classes'))
  check('learners listed', bodyText().includes('Zainab Bilal'))
  await clickText('Add learner')
  await settle(50)
  await type(dom.window.document.querySelector<HTMLInputElement>('input[placeholder="e.g. Zainab Bilal"]'), 'Smoke Test Learner')
  await clickLast('Add learner')
  await settle(80)
  check('learner added', (db().students ?? []).some((s: { name: string }) => s.name === 'Smoke Test Learner'))

  await clickText('Staff & Parents')
  await settle(70)
  check('staff list renders', bodyText().includes('Ustadha Fatima Ali'))
  check('unlinked parents panel', bodyText().includes('Unlinked parent accounts') || bodyText().includes('Every parent account is linked'))

  log('\n\x1b[1m12. Admin settings + delete cascade\x1b[0m')
  await clickText('Settings', true)
  await settle(70)
  check('settings page renders', bodyText().includes('School settings'))
  check('admin code field present', bodyText().includes('Admin access code'))
  check('data tools present', bodyText().includes('Export data (JSON)'))

  await clickText('Academics & Exams')
  await settle(80)
  await clickSelector('button[aria-label="Delete Smoke Test Subject Edited"]', 'delete subject')
  await settle(50)
  check('delete confirmation prompt appears', bodyText().includes('Delete subject?'))
  await clickText('Delete', true)
  await settle(80)
  check('subject removed from db', !(db().subjects ?? []).some((s: { name: string }) => s.name === 'Smoke Test Subject Edited'))
  check(
    'related assessment cascade-deleted',
    !(db().assessments ?? []).some((a: { title: string }) => a.title === 'Smoke Test Exam'),
  )

  log('\n\x1b[1m13. Role guard\x1b[0m')
  await clickText('Sign out')
  await settle(70)
  await clickText('Parent · Bilal Omar')
  await settle(90)
  check('parent has no people nav', !findClickable('People & Classes'))
  check('parent has no academics nav', !findClickable('Academics & Exams'))

  log('\n\x1b[1m14. Sign-up: parent account without a linked learner\x1b[0m')
  await clickText('Sign out')
  await settle(70)
  await clickText('Create an account')
  await settle(70)
  check('sign-up screen renders', bodyText().includes('Create your account'))
  check('role cards shown', bodyText().includes('Track your child’s exams'))

  const signupInputs = () => dom.window.document.querySelectorAll<HTMLInputElement>('input')
  await type(signupInputs()[0], 'Smoke Test Parent')
  await type(signupInputs()[1], 'smoke.parent@ibnuhajar.ac.ke')
  const pwFields = [...signupInputs()].filter((i) => i.type === 'password')
  await type(pwFields[pwFields.length - 2] ?? null, 'secret123')
  await type(pwFields[pwFields.length - 1] ?? null, 'secret123')
  await clickText('Create account')
  await settle(90)
  check('new parent account signed in', bodyText().includes('Smoke Test Parent'))
  check('unlinked parent sees guidance empty state', bodyText().includes('not yet linked to a learner'))
  check('signed-in user persisted in session', dom.window.localStorage.getItem('ibnuhajar.session') !== null)

  log('\n\x1b[1m15. Sign-up validation: admin access code\x1b[0m')
  await clickText('Sign out')
  await settle(70)
  await clickText('Create an account')
  await settle(70)
  await clickText('Admin')
  await settle(40)
  check('admin code field revealed', bodyText().includes('Admin access code'))
  const adminInputs = () => dom.window.document.querySelectorAll<HTMLInputElement>('input')
  await type(adminInputs()[0], 'Smoke Test Admin')
  await type(adminInputs()[1], 'smoke.admin@ibnuhajar.ac.ke')
  await type(dom.window.document.querySelector<HTMLInputElement>('input[placeholder="IBNUHAJAR-ADMIN"]'), 'WRONG-CODE')
  const adminPw = [...adminInputs()].filter((i) => i.type === 'password')
  await type(adminPw[adminPw.length - 2] ?? null, 'secret123')
  await type(adminPw[adminPw.length - 1] ?? null, 'secret123')
  await clickText('Create account')
  await settle(80)
  check('wrong admin code rejected', bodyText().includes('Invalid admin access code'))

  await type(dom.window.document.querySelector<HTMLInputElement>('input[placeholder="IBNUHAJAR-ADMIN"]'), 'IBNUHAJAR-ADMIN')
  await clickText('Create account')
  await settle(90)
  check('admin account created with correct code', bodyText().includes('Class performance'))
  check('admin account stored as admin role', (db().users ?? []).some((u: { email: string; role: string }) => u.email === 'smoke.admin@ibnuhajar.ac.ke' && u.role === 'admin'))

  log('\n\x1b[1m16. Duplicate email rejected\x1b[0m')
  await clickText('Sign out')
  await settle(70)
  await clickText('Create an account')
  await settle(70)
  const dupInputs = () => dom.window.document.querySelectorAll<HTMLInputElement>('input')
  await type(dupInputs()[0], 'Duplicate Person')
  await type(dupInputs()[1], 'smoke.admin@ibnuhajar.ac.ke')
  const dupPw = [...dupInputs()].filter((i) => i.type === 'password')
  await type(dupPw[dupPw.length - 2] ?? null, 'secret123')
  await type(dupPw[dupPw.length - 1] ?? null, 'secret123')
  await clickText('Create account')
  await settle(80)
  check('duplicate email blocked', bodyText().includes('already exists'))

  await act(async () => {
    root.unmount()
  })
  await settle(20)

  const realErrors = consoleErrors.filter(
    (message) => !/not wrapped in act|Future Flag Warning|Warning: An update to/.test(message),
  )
  if (realErrors.length) log('\n\x1b[33mconsole.error output:\x1b[0m\n - ' + realErrors.slice(0, 5).join('\n - '))
  check('no unexpected console errors', realErrors.length === 0)

  log(`\n${failures === 0 ? '\x1b[32m✅ ALL CHECKS PASSED\x1b[0m' : `\x1b[31m❌ ${failures} CHECK(S) FAILED\x1b[0m`}\n`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('\n💥 smoke test crashed:', error)
  process.exit(1)
})
