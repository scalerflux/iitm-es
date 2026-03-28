import { JAN_2026_FOUNDATION_TERM_2 } from './configs/jan2026FoundationTerm2'
import JUL_2026_SAMPLE_PACK from './configs/jul2026SamplePack.json'

const DEFAULT_TERM_PACK = JAN_2026_FOUNDATION_TERM_2
const BUILTIN_TERM_PACKS = [
  DEFAULT_TERM_PACK,
  {
    ...JUL_2026_SAMPLE_PACK,
    id: 'may-2026-term-pack',
    label: 'May 2026 · T2 2026',
    term: {
      level: 'T2 2026',
      term: 'May 2026',
      startDate: '2026-06-12',
      totalWeeks: 12,
    },
    calendarEvents: [
      { id: 't2-start', label: 'Term start', date: '2026-06-12', kind: 'release' },
      { id: 't2-quiz1', label: 'Quiz 1', date: '2026-07-19', kind: 'exam' },
      { id: 't2-pq1-day1', label: 'Programming Quiz 1 Day 1', date: '2026-08-02', kind: 'deadline' },
      { id: 't2-quiz2', label: 'Quiz 2', date: '2026-08-16', kind: 'exam' },
      { id: 't2-pq2-day1', label: 'Programming Quiz 2 Day 1', date: '2026-08-30', kind: 'deadline' },
      { id: 't2-pq2-day2', label: 'Programming Quiz 2 Day 2', date: '2026-09-06', kind: 'deadline' },
      { id: 't2-endterm', label: 'End Term', date: '2026-09-13', kind: 'exam' },
    ],
  },
  {
    ...JUL_2026_SAMPLE_PACK,
    id: 'sep-2026-term-pack',
    label: 'Sep 2026 · T3 2026',
    term: {
      level: 'T3 2026',
      term: 'Sep 2026',
      startDate: '2026-10-02',
      totalWeeks: 12,
    },
    calendarEvents: [
      { id: 't3-start', label: 'Term start', date: '2026-10-02', kind: 'release' },
      { id: 't3-quiz1', label: 'Quiz 1', date: '2026-11-15', kind: 'exam' },
      { id: 't3-pq1-day1', label: 'Programming Quiz 1 Day 1', date: '2026-11-22', kind: 'deadline' },
      { id: 't3-quiz2', label: 'Quiz 2', date: '2026-12-05', kind: 'exam' },
      { id: 't3-pq2-day1', label: 'Programming Quiz 2 Day 1', date: '2026-12-20', kind: 'deadline' },
      { id: 't3-pq2-day2', label: 'Programming Quiz 2 Day 2', date: '2027-01-03', kind: 'deadline' },
      { id: 't3-endterm', label: 'End Term', date: '2027-01-10', kind: 'exam' },
    ],
  },
]

export const TERM_PACKS = [...BUILTIN_TERM_PACKS]

let activeTermPack = DEFAULT_TERM_PACK

function getCurrentWeek(startDate, totalWeeks) {
  const start = new Date(`${startDate}T00:00:00`)
  const now = new Date()
  const diffMs = now - start
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(diffWeeks, totalWeeks))
}

export function getTermPackById(termPackId) {
  return TERM_PACKS.find((termPack) => termPack.id === termPackId) ?? null
}

export function getTermPacks() {
  return [...TERM_PACKS]
}

export function registerTermPack(termPack) {
  if (!termPack?.id || getTermPackById(termPack.id)) {
    return getTermPackById(termPack.id) ?? null
  }

  TERM_PACKS.push(termPack)
  return termPack
}

export function registerTermPacks(termPacks = []) {
  return termPacks.map((termPack) => registerTermPack(termPack)).filter(Boolean)
}

export function setActiveTermPackById(termPackId) {
  activeTermPack = getTermPackById(termPackId) ?? DEFAULT_TERM_PACK
  return activeTermPack
}

export function getActiveTermPack() {
  return activeTermPack
}

export function getCourseLibrary() {
  return activeTermPack.courses
}

export function getDeadlineWindowDays() {
  return activeTermPack.deadlineWindowDays
}

export const ACTIVE_TERM_PACK = {
  get id() {
    return activeTermPack.id
  },
  get label() {
    return activeTermPack.label
  },
}

export const TERM = {
  get week() {
    return getCurrentWeek(activeTermPack.term.startDate, activeTermPack.term.totalWeeks)
  },
  get level() {
    return activeTermPack.term.level
  },
  get term() {
    return activeTermPack.term.term
  },
  get startDate() {
    return activeTermPack.term.startDate
  },
  get totalWeeks() {
    return activeTermPack.term.totalWeeks
  },
}

export const PAGE_LINKS = [
  { path: '/', label: 'Dashboard' },
  { path: '/weekly', label: 'Weekly View' },
  { path: '/grades', label: 'Grades' },
  { path: '/courses', label: 'Course Setup' },
  { path: '/analytics', label: 'Analytics' },
]
