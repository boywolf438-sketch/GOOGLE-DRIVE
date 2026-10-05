import type {
  Announcement,
  Assessment,
  Conversation,
  DB,
  Message,
  Result,
  SchoolInfo,
  Student,
  Subject,
  User,
} from '../types'

export const DB_VERSION = 3

/* --------------------------------------------------------------- time helpers */

const NOW = Date.now()
const min = 60 * 1000
const hour = 60 * min
const day = 24 * hour

const minutesAgo = (n: number) => new Date(NOW - n * min).toISOString()
const hoursAgo = (n: number) => new Date(NOW - n * hour).toISOString()
const daysAgo = (n: number, hourOfDay = 9, minute = 0) => {
  const d = new Date(NOW - n * day)
  d.setHours(hourOfDay, minute, 0, 0)
  return d.toISOString()
}
const daysAhead = (n: number, hourOfDay = 8) => {
  const d = new Date(NOW + n * day)
  d.setHours(hourOfDay, 0, 0, 0)
  return d.toISOString()
}

export const CLASSES = ['Form 1', 'Form 2', 'Form 3']

const school: SchoolInfo = {
  name: 'Madrasat IbnuHajar',
  motto: 'Knowledge · Character · Service',
  term: `Term ${((new Date(NOW).getMonth() + 1) % 12) < 4 ? 1 : (new Date(NOW).getMonth() + 1) < 8 ? 2 : 3} ${new Date(NOW).getFullYear()}`,
  classes: CLASSES,
  adminCode: 'IBNUHAJAR-ADMIN',
}

/* ---------------------------------------------------------------------- users */

const users: User[] = [
  {
    id: 'u_admin',
    name: 'Ustadh Ibrahim Yusuf',
    email: 'admin@ibnuhajar.ac.ke',
    password: 'admin123',
    role: 'admin',
    title: 'Principal / System Admin',
    phone: '+254 700 100 100',
    bio: 'Oversees academics, staff accounts and school-wide communication.',
    active: true,
    createdAt: daysAgo(400, 8),
  },
  {
    id: 'u_amina',
    name: 'Ustadha Amina Hassan',
    email: 'teacher@ibnuhajar.ac.ke',
    password: 'teacher123',
    role: 'teacher',
    title: 'Qur’an & Islamic Studies',
    phone: '+254 700 200 201',
    bio: 'Teaches Qur’an recitation, Tajweed and Islamic Studies. Class teacher — Form 2.',
    active: true,
    createdAt: daysAgo(320, 8),
  },
  {
    id: 'u_ahmed',
    name: 'Ustadh Ahmed Noor',
    email: 'ahmed@ibnuhajar.ac.ke',
    password: 'teacher123',
    role: 'teacher',
    title: 'Arabic & Fiqh',
    phone: '+254 700 200 202',
    bio: 'Teaches Arabic language, Fiqh and Hadith. Dean of students.',
    active: true,
    createdAt: daysAgo(300, 8),
  },
  {
    id: 'u_fatima',
    name: 'Ustadha Fatima Ali',
    email: 'fatima@ibnuhajar.ac.ke',
    password: 'teacher123',
    role: 'teacher',
    title: 'English, Maths & Science',
    phone: '+254 700 200 203',
    bio: 'Teaches English, Mathematics and Integrated Science. Exams coordinator.',
    active: true,
    createdAt: daysAgo(280, 8),
  },
  {
    id: 'u_bilal',
    name: 'Bilal Omar',
    email: 'parent@ibnuhajar.ac.ke',
    password: 'parent123',
    role: 'parent',
    title: 'Parent — Zainab & Yusuf',
    phone: '+254 711 300 301',
    active: true,
    createdAt: daysAgo(240, 8),
  },
  {
    id: 'u_maryam',
    name: 'Maryam Said',
    email: 'maryam@ibnuhajar.ac.ke',
    password: 'parent123',
    role: 'parent',
    title: 'Parent — Hamza & Abdulrahman',
    phone: '+254 711 300 302',
    active: true,
    createdAt: daysAgo(210, 8),
  },
  {
    id: 'u_abdullahi',
    name: 'Abdullahi Farah',
    email: 'abdullahi@ibnuhajar.ac.ke',
    password: 'parent123',
    role: 'parent',
    title: 'Parent — Sumayya & Amina',
    phone: '+254 711 300 303',
    active: true,
    createdAt: daysAgo(190, 8),
  },
  {
    id: 'u_halima_p',
    name: 'Halima Osman',
    email: 'halima@ibnuhajar.ac.ke',
    password: 'parent123',
    role: 'parent',
    title: 'Parent — Halima',
    phone: '+254 711 300 304',
    active: true,
    createdAt: daysAgo(120, 8),
  },
  {
    id: 'u_said',
    name: 'Said Omar',
    email: 'said@ibnuhajar.ac.ke',
    password: 'parent123',
    role: 'parent',
    title: 'Parent — Fatuma',
    phone: '+254 711 300 305',
    active: true,
    createdAt: daysAgo(90, 8),
  },
]

/* ------------------------------------------------------------------- students */

const students: Student[] = [
  {
    id: 's_yusuf',
    name: 'Yusuf Bilal',
    admissionNo: 'IBH/2026/014',
    className: 'Form 1',
    parentIds: ['u_bilal'],
    guardianPhone: '+254 711 300 301',
    createdAt: daysAgo(200, 8),
  },
  {
    id: 's_amina_f',
    name: 'Amina Farah',
    admissionNo: 'IBH/2026/020',
    className: 'Form 1',
    parentIds: ['u_abdullahi'],
    guardianPhone: '+254 711 300 303',
    createdAt: daysAgo(200, 8),
  },
  {
    id: 's_ibrahim_n',
    name: 'Ibrahim Noor',
    admissionNo: 'IBH/2026/031',
    className: 'Form 1',
    parentIds: [],
    createdAt: daysAgo(200, 8),
  },
  {
    id: 's_khadija',
    name: 'Khadija Ali',
    admissionNo: 'IBH/2026/044',
    className: 'Form 1',
    parentIds: [],
    createdAt: daysAgo(200, 8),
  },
  {
    id: 's_zainab',
    name: 'Zainab Bilal',
    admissionNo: 'IBH/2025/102',
    className: 'Form 2',
    parentIds: ['u_bilal'],
    guardianPhone: '+254 711 300 301',
    createdAt: daysAgo(360, 8),
  },
  {
    id: 's_hamza',
    name: 'Hamza Said',
    admissionNo: 'IBH/2025/118',
    className: 'Form 2',
    parentIds: ['u_maryam'],
    guardianPhone: '+254 711 300 302',
    createdAt: daysAgo(360, 8),
  },
  {
    id: 's_fatuma',
    name: 'Fatuma Said',
    admissionNo: 'IBH/2025/124',
    className: 'Form 2',
    parentIds: ['u_said'],
    guardianPhone: '+254 711 300 305',
    createdAt: daysAgo(360, 8),
  },
  {
    id: 's_suleiman',
    name: 'Suleiman Ahmed',
    admissionNo: 'IBH/2025/131',
    className: 'Form 2',
    parentIds: [],
    createdAt: daysAgo(360, 8),
  },
  {
    id: 's_sumayya',
    name: 'Sumayya Farah',
    admissionNo: 'IBH/2024/201',
    className: 'Form 3',
    parentIds: ['u_abdullahi'],
    guardianPhone: '+254 711 300 303',
    createdAt: daysAgo(520, 8),
  },
  {
    id: 's_abdulrahman',
    name: 'Abdulrahman Said',
    admissionNo: 'IBH/2024/214',
    className: 'Form 3',
    parentIds: ['u_maryam'],
    guardianPhone: '+254 711 300 302',
    createdAt: daysAgo(520, 8),
  },
  {
    id: 's_halima',
    name: 'Halima Yusuf',
    admissionNo: 'IBH/2024/229',
    className: 'Form 3',
    parentIds: ['u_halima_p'],
    guardianPhone: '+254 711 300 304',
    createdAt: daysAgo(520, 8),
  },
  {
    id: 's_maryam_a',
    name: 'Maryam Ahmed',
    admissionNo: 'IBH/2024/240',
    className: 'Form 3',
    parentIds: [],
    createdAt: daysAgo(520, 8),
  },
]

const classStudents = (className: string) =>
  students.filter((s) => s.className === className).map((s) => s.id)

/* ------------------------------------------------------------------- subjects */

const subjects: Subject[] = [
  {
    id: 'sub_quran',
    name: 'Qur’an Recitation',
    code: 'QUR-101',
    className: 'Form 1',
    teacherId: 'u_amina',
    description: 'Memorisation (Hifdh) and fluent recitation with correct Makharij.',
    accent: 'emerald',
    createdAt: daysAgo(150, 10),
  },
  {
    id: 'sub_tajweed',
    name: 'Tajweed',
    code: 'TAJ-201',
    className: 'Form 2',
    teacherId: 'u_amina',
    description: 'Rules of Noon Sakinah, Meem Sakinah, Madd and Qalqalah.',
    accent: 'cyan',
    createdAt: daysAgo(150, 10),
  },
  {
    id: 'sub_islamic',
    name: 'Islamic Studies',
    code: 'ISL-301',
    className: 'Form 3',
    teacherId: 'u_amina',
    description: 'Aqeedah, Seerah and Islamic history.',
    accent: 'navy',
    createdAt: daysAgo(145, 10),
  },
  {
    id: 'sub_hadith',
    name: 'Hadith',
    code: 'HAD-301',
    className: 'Form 3',
    teacherId: 'u_ahmed',
    description: 'Selected Ahadith with meaning, narrator and application.',
    accent: 'gold',
    createdAt: daysAgo(145, 10),
  },
  {
    id: 'sub_fiqh',
    name: 'Fiqh',
    code: 'FQH-201',
    className: 'Form 2',
    teacherId: 'u_ahmed',
    description: 'Ibadah: Taharah, Salah, Zakah and daily rulings.',
    accent: 'violet',
    createdAt: daysAgo(140, 10),
  },
  {
    id: 'sub_arabic',
    name: 'Arabic Language',
    code: 'ARA-101',
    className: 'Form 1',
    teacherId: 'u_ahmed',
    description: 'Grammar (Nahw), vocabulary, reading and dictation.',
    accent: 'rose',
    createdAt: daysAgo(140, 10),
  },
  {
    id: 'sub_english',
    name: 'English',
    code: 'ENG-101',
    className: 'Form 1',
    teacherId: 'u_fatima',
    description: 'Comprehension, grammar, composition and functional writing.',
    accent: 'navy',
    createdAt: daysAgo(138, 10),
  },
  {
    id: 'sub_maths',
    name: 'Mathematics',
    code: 'MAT-201',
    className: 'Form 2',
    teacherId: 'u_fatima',
    description: 'Algebra, geometry, statistics and mental maths.',
    accent: 'emerald',
    createdAt: daysAgo(138, 10),
  },
  {
    id: 'sub_science',
    name: 'Integrated Science',
    code: 'SCI-301',
    className: 'Form 3',
    teacherId: 'u_fatima',
    description: 'Biology, chemistry and physics fundamentals with practicals.',
    accent: 'cyan',
    createdAt: daysAgo(136, 10),
  },
]

/* ---------------------------------------------------------------- assessments */

interface SeedAssessment extends Assessment {
  seedScores?: number[]
}

const assessments: SeedAssessment[] = [
  {
    id: 'as_quran_mid',
    title: 'Mid-Term Exam — Qur’an Recitation',
    type: 'exam',
    subjectId: 'sub_quran',
    className: 'Form 1',
    term: school.term,
    date: daysAgo(12, 9),
    maxScore: 100,
    published: true,
    createdBy: 'u_amina',
    createdAt: daysAgo(30, 9),
    seedScores: [78, 92, 71, 64],
  },
  {
    id: 'as_quran_quiz1',
    title: 'Surah Al-Mulk Memorisation Quiz',
    type: 'quiz',
    subjectId: 'sub_quran',
    className: 'Form 1',
    term: school.term,
    date: daysAgo(21, 9),
    maxScore: 20,
    published: true,
    createdBy: 'u_amina',
    createdAt: daysAgo(28, 9),
    seedScores: [16, 19, 14, 13],
  },
  {
    id: 'as_quran_test',
    title: 'Tajweed Practical Test',
    type: 'test',
    subjectId: 'sub_quran',
    className: 'Form 1',
    term: school.term,
    date: daysAhead(4, 10),
    maxScore: 50,
    published: false,
    createdBy: 'u_amina',
    createdAt: daysAgo(3, 9),
  },
  {
    id: 'as_tajweed_mid',
    title: 'Mid-Term Exam — Tajweed',
    type: 'exam',
    subjectId: 'sub_tajweed',
    className: 'Form 2',
    term: school.term,
    date: daysAgo(10, 11),
    maxScore: 100,
    published: true,
    createdBy: 'u_amina',
    createdAt: daysAgo(26, 9),
    seedScores: [88, 74, 81, 59],
  },
  {
    id: 'as_tajweed_quiz',
    title: 'Noon & Meem Sakinah Quiz',
    type: 'quiz',
    subjectId: 'sub_tajweed',
    className: 'Form 2',
    term: school.term,
    date: daysAgo(18, 11),
    maxScore: 25,
    published: true,
    createdBy: 'u_amina',
    createdAt: daysAgo(24, 9),
    seedScores: [23, 18, 21, 15],
  },
  {
    id: 'as_islamic_mid',
    title: 'Mid-Term Exam — Islamic Studies',
    type: 'exam',
    subjectId: 'sub_islamic',
    className: 'Form 3',
    term: school.term,
    date: daysAgo(9, 8),
    maxScore: 100,
    published: true,
    createdBy: 'u_amina',
    createdAt: daysAgo(25, 9),
    seedScores: [91, 77, 84, 68],
  },
  {
    id: 'as_hadith_mid',
    title: 'Ardha Term Exam — Hadith',
    type: 'exam',
    subjectId: 'sub_hadith',
    className: 'Form 3',
    term: school.term,
    date: daysAgo(8, 9),
    maxScore: 100,
    published: true,
    createdBy: 'u_ahmed',
    createdAt: daysAgo(25, 9),
    seedScores: [86, 72, 79, 63],
  },
  {
    id: 'as_hadith_quiz',
    title: 'Hadith Memorisation Quiz (10 Ahadith)',
    type: 'quiz',
    subjectId: 'sub_hadith',
    className: 'Form 3',
    term: school.term,
    date: daysAgo(15, 9),
    maxScore: 30,
    published: true,
    createdBy: 'u_ahmed',
    createdAt: daysAgo(22, 9),
    seedScores: [27, 22, 25, 19],
  },
  {
    id: 'as_fiqh_mid',
    title: 'Mid-Term Exam — Fiqh',
    type: 'exam',
    subjectId: 'sub_fiqh',
    className: 'Form 2',
    term: school.term,
    date: daysAgo(11, 14),
    maxScore: 100,
    published: true,
    createdBy: 'u_ahmed',
    createdAt: daysAgo(26, 9),
    seedScores: [82, 69, 76, 55],
  },
  {
    id: 'as_arabic_mid',
    title: 'Mid-Term Exam — Arabic Language',
    type: 'exam',
    subjectId: 'sub_arabic',
    className: 'Form 1',
    term: school.term,
    date: daysAgo(13, 12),
    maxScore: 100,
    published: true,
    createdBy: 'u_ahmed',
    createdAt: daysAgo(27, 9),
    seedScores: [74, 88, 65, 70],
  },
  {
    id: 'as_english_mid',
    title: 'Mid-Term Exam — English',
    type: 'exam',
    subjectId: 'sub_english',
    className: 'Form 1',
    term: school.term,
    date: daysAgo(7, 9),
    maxScore: 100,
    published: true,
    createdBy: 'u_fatima',
    createdAt: daysAgo(24, 9),
    seedScores: [69, 83, 76, 58],
  },
  {
    id: 'as_maths_mid',
    title: 'Mid-Term Exam — Mathematics',
    type: 'exam',
    subjectId: 'sub_maths',
    className: 'Form 2',
    term: school.term,
    date: daysAgo(6, 9),
    maxScore: 100,
    published: true,
    createdBy: 'u_fatima',
    createdAt: daysAgo(24, 9),
    seedScores: [79, 62, 71, 47],
  },
  {
    id: 'as_maths_quiz',
    title: 'Algebra Quiz (Quadratic Equations)',
    type: 'quiz',
    subjectId: 'sub_maths',
    className: 'Form 2',
    term: school.term,
    date: daysAgo(19, 9),
    maxScore: 20,
    published: true,
    createdBy: 'u_fatima',
    createdAt: daysAgo(23, 9),
    seedScores: [17, 12, 15, 9],
  },
  {
    id: 'as_science_mid',
    title: 'Mid-Term Exam — Integrated Science',
    type: 'exam',
    subjectId: 'sub_science',
    className: 'Form 3',
    term: school.term,
    date: daysAgo(2, 9),
    maxScore: 100,
    published: false,
    createdBy: 'u_fatima',
    createdAt: daysAgo(20, 9),
  },
  {
    id: 'as_science_prac',
    title: 'Chemistry Practical Test',
    type: 'test',
    subjectId: 'sub_science',
    className: 'Form 3',
    term: school.term,
    date: daysAgo(16, 9),
    maxScore: 40,
    published: true,
    createdBy: 'u_fatima',
    createdAt: daysAgo(22, 9),
    seedScores: [34, 29, 31, 24],
  },
]

const results: Result[] = []
for (const assessment of assessments) {
  if (!assessment.seedScores || !assessment.published) continue
  const ids = classStudents(assessment.className)
  assessment.seedScores.forEach((score, index) => {
    const studentId = ids[index]
    if (!studentId) return
    results.push({
      id: `res_${assessment.id}_${studentId}`,
      assessmentId: assessment.id,
      studentId,
      score,
      postedAt: assessment.date,
      postedBy: assessment.createdBy,
    })
  })
}

const cleanAssessments: Assessment[] = assessments.map(({ seedScores: _seedScores, ...rest }) => rest)

/* -------------------------------------------------------------- conversations */

const parentsOfClass = (className: string) => {
  const ids = new Set<string>()
  students
    .filter((s) => s.className === className)
    .forEach((s) => s.parentIds.forEach((p) => ids.add(p)))
  return [...ids]
}

const allUserIds = users.map((u) => u.id)
const teacherIds = ['u_amina', 'u_ahmed', 'u_fatima']

const conversations: Conversation[] = [
  {
    id: 'c_school',
    name: 'School Group',
    type: 'school',
    memberIds: allUserIds,
    description: 'Whole-school channel for parents, teachers and administration.',
    createdAt: daysAgo(200, 8),
  },
  {
    id: 'c_form3',
    name: 'Form 3 Parents',
    type: 'class',
    className: 'Form 3',
    memberIds: ['u_admin', ...teacherIds, ...parentsOfClass('Form 3')],
    description: 'Form 3 class channel — exams, revision and class updates.',
    createdAt: daysAgo(180, 8),
  },
  {
    id: 'c_form2',
    name: 'Form 2 Parents',
    type: 'class',
    className: 'Form 2',
    memberIds: ['u_admin', ...teacherIds, ...parentsOfClass('Form 2')],
    description: 'Form 2 class channel — homework, quizzes and class logistics.',
    createdAt: daysAgo(180, 8),
  },
  {
    id: 'c_form1',
    name: 'Form 1 Parents',
    type: 'class',
    className: 'Form 1',
    memberIds: ['u_admin', ...teacherIds, ...parentsOfClass('Form 1')],
    description: 'Form 1 class channel — orientation, uniform and exam notices.',
    createdAt: daysAgo(180, 8),
  },
  {
    id: 'c_dm_amina',
    name: 'Ustadha Amina Hassan',
    type: 'direct',
    memberIds: ['u_amina', 'u_bilal'],
    description: 'Direct message',
    createdAt: daysAgo(40, 8),
  },
  {
    id: 'c_dm_admin',
    name: 'Admin Office',
    type: 'direct',
    memberIds: ['u_admin', 'u_maryam'],
    description: 'Direct message',
    createdAt: daysAgo(35, 8),
  },
]

interface SeedMessage extends Omit<Message, 'createdAt'> {
  at: string
}

const rawMessages: SeedMessage[] = [
  {
    id: 'm1',
    conversationId: 'c_school',
    senderId: 'u_admin',
    text: 'Assalamu alaikum warahmatullahi wabarakatuh, dear parents and staff. Welcome to the Madrasat IbnuHajar communication channel. All official notices will be posted here.',
    at: daysAgo(6, 7, 45),
    pinned: true,
    reactions: { '🤲': ['u_bilal', 'u_maryam', 'u_fatima', 'u_abdullahi'] },
  },
  {
    id: 'm2',
    conversationId: 'c_school',
    senderId: 'u_admin',
    text: 'Mid-term exam results for Forms 1–3 have been uploaded. Please check the Results tab with your child and acknowledge below.',
    at: daysAgo(5, 16, 12),
    reactions: { '👍': ['u_maryam', 'u_said', 'u_halima_p'] },
  },
  {
    id: 'm3',
    conversationId: 'c_school',
    senderId: 'u_fatima',
    text: 'Mathematics revision for Form 2 will run every Tuesday and Thursday, 4:00–5:00 pm. Attendance is highly encouraged before the end-term exams.',
    at: daysAgo(5, 18, 30),
  },
  {
    id: 'm4',
    conversationId: 'c_school',
    senderId: 'u_bilal',
    text: 'Jazakallahu khairan Ustadha. Should parents bring the revision booklet or will it be provided at school?',
    at: daysAgo(5, 19, 2),
    reactions: { '❓': ['u_said'] },
  },
  {
    id: 'm5',
    conversationId: 'c_school',
    senderId: 'u_fatima',
    text: 'It will be provided at school, inshaallah. Parents only need to ensure the learners arrive on time.',
    at: daysAgo(5, 19, 15),
    replyToId: 'm4',
  },
  {
    id: 'm6',
    conversationId: 'c_school',
    senderId: 'u_admin',
    text: 'Parents meeting this Saturday at 9:00 am in the main hall. Agenda: end-term exams, Madrasa fees and the Hifdh competition.',
    at: daysAgo(3, 8, 5),
    attachment: { name: 'Parents-Meeting-Agenda.pdf', kind: 'pdf' },
    reactions: { '✅': ['u_bilal', 'u_maryam', 'u_abdullahi', 'u_said', 'u_halima_p'] },
  },
  {
    id: 'm7',
    conversationId: 'c_school',
    senderId: 'u_halima_p',
    text: 'Is there a chance to have the meeting recorded for parents who are travelling?',
    at: daysAgo(3, 10, 40),
  },
  {
    id: 'm8',
    conversationId: 'c_school',
    senderId: 'u_admin',
    text: 'Yes, a summary of the minutes will be posted here right after the meeting inshaallah.',
    at: daysAgo(3, 11, 2),
    replyToId: 'm7',
  },
  {
    id: 'm9',
    conversationId: 'c_school',
    senderId: 'u_ahmed',
    text: 'Ashara Mubaraka to all families. Arabic dictation practice for Form 1 continues daily after Zuhr.',
    at: hoursAgo(26),
    reactions: { '❤️': ['u_maryam', 'u_bilal'] },
  },
  {
    id: 'm10',
    conversationId: 'c_school',
    senderId: 'u_maryam',
    text: 'Jazakumullahu khairan. Hamza has been practising at home every evening.',
    at: hoursAgo(25),
  },
  {
    id: 'm11',
    conversationId: 'c_school',
    senderId: 'u_admin',
    text: 'Reminder: school closes for the mid-term break on Friday at 12:30 pm. Buses will leave at 1:00 pm sharp.',
    at: hoursAgo(5),
    reactions: { '👍': ['u_bilal', 'u_said'] },
  },
  {
    id: 'm12',
    conversationId: 'c_school',
    senderId: 'u_fatima',
    text: 'Science practical reports for Form 3 should be submitted by Wednesday. Kindly remind the learners to carry their lab coats.',
    at: minutesAgo(95),
  },
  {
    id: 'm13',
    conversationId: 'c_school',
    senderId: 'u_bilal',
    text: 'Noted, Ustadha. Yusuf will bring his lab coat tomorrow.',
    at: minutesAgo(72),
  },

  {
    id: 'm20',
    conversationId: 'c_form2',
    senderId: 'u_amina',
    text: 'Form 2 parents, tajweed assessments for this term are complete. Kindly review the scores on your dashboard and let us discuss any support needed.',
    at: daysAgo(4, 15, 20),
    pinned: true,
  },
  {
    id: 'm21',
    conversationId: 'c_form2',
    senderId: 'u_maryam',
    text: 'Assalamu alaikum. Hamza struggled with the Noon Sakinah quiz. Can we arrange extra lessons?',
    at: daysAgo(4, 17, 5),
  },
  {
    id: 'm22',
    conversationId: 'c_form2',
    senderId: 'u_amina',
    text: 'Wa alaikum assalam. Yes, I hold a Tajweed clinic on Wednesdays after Asr. Hamza is welcome to join.',
    at: daysAgo(4, 17, 30),
    replyToId: 'm21',
    reactions: { '🤲': ['u_maryam', 'u_said'] },
  },
  {
    id: 'm23',
    conversationId: 'c_form2',
    senderId: 'u_fatima',
    text: 'Reminder for Form 2: Mathematics quiz on quadratic equations has been marked and posted. Average class score was 65%.',
    at: daysAgo(2, 12, 10),
  },
  {
    id: 'm24',
    conversationId: 'c_form2',
    senderId: 'u_said',
    text: 'Fatuma will attend the Wednesday clinic as well, inshaallah.',
    at: hoursAgo(30),
  },
  {
    id: 'm25',
    conversationId: 'c_form2',
    senderId: 'u_bilal',
    text: 'Jazakumullahu khairan for the continued support.',
    at: hoursAgo(3),
  },

  {
    id: 'm30',
    conversationId: 'c_form3',
    senderId: 'u_fatima',
    text: 'Form 3 candidates: the Integrated Science mid-term paper is being marked. Results will be published by Thursday.',
    at: daysAgo(3, 13, 45),
    pinned: true,
  },
  {
    id: 'm31',
    conversationId: 'c_form3',
    senderId: 'u_abdullahi',
    text: 'Thank you. Will the practical scores be included in the final report?',
    at: daysAgo(2, 9, 15),
  },
  {
    id: 'm32',
    conversationId: 'c_form3',
    senderId: 'u_fatima',
    text: 'Yes, the practical contributes 40 marks to the overall science grade.',
    at: daysAgo(2, 10, 0),
    replyToId: 'm31',
    reactions: { '👍': ['u_abdullahi', 'u_halima_p'] },
  },
  {
    id: 'm33',
    conversationId: 'c_form3',
    senderId: 'u_ahmed',
    text: 'Hadith memorisation clinic continues on Sundays 8:00 am. All candidates should attend.',
    at: minutesAgo(320),
  },

  {
    id: 'm40',
    conversationId: 'c_form1',
    senderId: 'u_ahmed',
    text: 'Form 1 parents, Arabic dictation books have been issued. Please sign the cover page.',
    at: daysAgo(2, 14, 25),
  },
  {
    id: 'm41',
    conversationId: 'c_form1',
    senderId: 'u_bilal',
    text: 'Signed and returned today, Ustadh. Barakallahu feek.',
    at: hoursAgo(8),
  },

  {
    id: 'm50',
    conversationId: 'c_dm_amina',
    senderId: 'u_amina',
    text: 'Assalamu alaikum Br. Bilal. Zainab has improved remarkably in Tajweed this term — masha’Allah. Her recitation fluency is now among the best in Form 2.',
    at: hoursAgo(20),
  },
  {
    id: 'm51',
    conversationId: 'c_dm_amina',
    senderId: 'u_bilal',
    text: 'Alhamdulillah, that is wonderful to hear. Jazakillahu khairan for your effort with her.',
    at: hoursAgo(19),
  },
  {
    id: 'm52',
    conversationId: 'c_dm_amina',
    senderId: 'u_amina',
    text: 'Please encourage her to keep revising Surah Yaseen during the break. I will share the Ramadan Hifdh plan soon.',
    at: minutesAgo(48),
    reactions: { '🤲': ['u_bilal'] },
  },

  {
    id: 'm60',
    conversationId: 'c_dm_admin',
    senderId: 'u_maryam',
    text: 'Assalamu alaikum. Requesting a fee statement for the current term please.',
    at: daysAgo(1, 11, 20),
  },
  {
    id: 'm61',
    conversationId: 'c_dm_admin',
    senderId: 'u_admin',
    text: 'Wa alaikum assalam. I have attached the statement below. Kindly confirm the balance reflects your last payment.',
    at: daysAgo(1, 12, 0),
    replyToId: 'm60',
    attachment: { name: 'Fee-Statement-Term.pdf', kind: 'pdf' },
  },
  {
    id: 'm62',
    conversationId: 'c_dm_admin',
    senderId: 'u_maryam',
    text: 'Well received, the balance matches. Jazakallahu khairan.',
    at: daysAgo(1, 12, 40),
    reactions: { '👍': ['u_admin'] },
  },
]

const messages: Message[] = rawMessages.map(({ at, ...rest }) => ({ ...rest, createdAt: at }))

const reads: DB['reads'] = {
  c_school: {
    u_bilal: hoursAgo(2),
    u_maryam: hoursAgo(4),
    u_admin: minutesAgo(30),
  },
  c_form2: {
    u_bilal: hoursAgo(20),
    u_maryam: hoursAgo(6),
  },
  c_form3: {
    u_abdullahi: hoursAgo(10),
  },
  c_form1: {
    u_bilal: hoursAgo(9),
  },
  c_dm_amina: {
    u_bilal: hoursAgo(19),
  },
  c_dm_admin: {
    u_maryam: daysAgo(1, 12, 45),
  },
}

/* -------------------------------------------------------------- announcements */

const announcements: Announcement[] = [
  {
    id: 'an1',
    title: 'Mid-term break and closing day',
    body: 'The madrasa closes for the mid-term break on Friday at 12:30 pm. School buses depart at 1:00 pm. Learning resumes on Monday of the following week at 7:20 am.',
    audience: 'all',
    authorId: 'u_admin',
    priority: 'high',
    pinned: true,
    createdAt: daysAgo(2, 8, 15),
  },
  {
    id: 'an2',
    title: 'Parents meeting — Saturday 9:00 am',
    body: 'All parents are invited to the general meeting in the main hall. Agenda: end-term examinations, fees structure and the annual Hifdh competition.',
    audience: 'all',
    authorId: 'u_admin',
    priority: 'normal',
    pinned: true,
    createdAt: daysAgo(3, 7, 50),
  },
  {
    id: 'an3',
    title: 'Integrated Science mid-term paper',
    body: 'The Form 3 Integrated Science mid-term paper has been marked. Results will be posted on the parent dashboard by Thursday. Practical scores count for 40 marks.',
    audience: 'Form 3',
    authorId: 'u_fatima',
    priority: 'normal',
    pinned: false,
    createdAt: daysAgo(1, 16, 5),
  },
  {
    id: 'an4',
    title: 'Tajweed clinic — Wednesdays after Asr',
    body: 'An extra Tajweed clinic for Form 2 learners struggling with Noon and Meem Sakinah rules begins this Wednesday after Asr in classroom 4.',
    audience: 'Form 2',
    authorId: 'u_amina',
    priority: 'normal',
    pinned: false,
    createdAt: daysAgo(4, 17, 40),
  },
  {
    id: 'an5',
    title: 'Arabic dictation practice daily',
    body: 'Form 1 learners will have daily dictation practice after Zuhr. Parents are asked to sign the dictation book each week.',
    audience: 'Form 1',
    authorId: 'u_ahmed',
    priority: 'normal',
    pinned: false,
    createdAt: daysAgo(2, 14, 20),
  },
  {
    id: 'an6',
    title: 'Annual Hifdh competition registration',
    body: 'Registration for the annual Qur’an memorisation competition is now open. Interested learners should see Ustadha Amina before the end of the term.',
    audience: 'all',
    authorId: 'u_amina',
    priority: 'high',
    pinned: false,
    createdAt: daysAgo(6, 9, 5),
  },
]

export function createSeed(): DB {
  return JSON.parse(
    JSON.stringify({
      version: DB_VERSION,
      school,
      users,
      students,
      subjects,
      assessments: cleanAssessments,
      results,
      conversations,
      messages,
      announcements,
      reads,
    }),
  ) as DB
}
