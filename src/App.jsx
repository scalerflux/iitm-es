import { useEffect, useRef, useState } from 'react'
import './App.css'
import {
  ACTIVE_TERM_PACK,
  PAGE_LINKS,
  TERM,
  getTermPacks,
  getActiveTermPack,
  getCourseLibrary,
  getTermPackById,
  registerTermPack,
  registerTermPacks,
  setActiveTermPackById,
} from './data'
import {
  calculateCourse,
  getDashboardSummary,
  formatDate,
  getAnalyticsSeries,
  getCourseChecklist,
  getPastDeadlines,
  getCourseProgress,
  getOverallWeekProgress,
  getStoragePayload,
  getTodayLabel,
  getUpcomingDeadlines,
  getWeeklySessions,

  getWeekCompletion,
} from './utils'

const STORAGE_KEY = 'study-pulse-v1'

function getCourseIds(courses) {
  return courses.map((course) => course.id)
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeSelectedCourseIds(selectedCourseIds, courses) {
  const validCourseIds = new Set(getCourseIds(courses))
  const selected = Array.isArray(selectedCourseIds)
    ? selectedCourseIds.filter((courseId) => validCourseIds.has(courseId))
    : []

  return selected.length ? selected : getCourseIds(courses)
}

function normalizeStringList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : []
}

function normalizeSessionMap(value) {
  if (!isPlainObject(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([day, sessions]) => [day, normalizeStringList(sessions)])
      .filter(([, sessions]) => sessions.length),
  )
}

function normalizeMilestoneList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isPlainObject).map((milestone) => ({
    ...milestone,
    id: String(milestone.id ?? '').trim(),
    label: String(milestone.label ?? '').trim(),
    date: String(milestone.date ?? '').trim(),
    kind: String(milestone.kind ?? 'milestone').trim(),
  }))
}

function normalizeScoreFields(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isPlainObject).map((field) => {
    if (field.type === 'select') {
      return {
        key: String(field.key ?? '').trim(),
        label: String(field.label ?? '').trim(),
        type: 'select',
        options: Array.isArray(field.options)
          ? field.options.filter(isPlainObject).map((option) => ({
              value: String(option.value ?? ''),
              label: String(option.label ?? '').trim(),
            }))
          : [],
      }
    }

    return {
      key: String(field.key ?? '').trim(),
      label: String(field.label ?? '').trim(),
      min: Number.isFinite(Number(field.min)) ? Number(field.min) : 0,
      max: Number.isFinite(Number(field.max)) ? Number(field.max) : 100,
      step: Number.isFinite(Number(field.step)) ? Number(field.step) : 1,
    }
  })
}

function normalizeImportedCourse(course) {
  if (!isPlainObject(course)) {
    throw new Error('Each course must be a JSON object.')
  }

  const id = String(course.id ?? '').trim()
  const code = String(course.code ?? '').trim()
  const shortName = String(course.shortName ?? '').trim()
  const name = String(course.name ?? '').trim()
  const scoreFields = normalizeScoreFields(course.scoreFields)

  if (!id) {
    throw new Error('Each course needs an `id`.')
  }

  if (!name) {
    throw new Error(`Course ${id} needs a name.`)
  }

  if (!shortName) {
    throw new Error(`Course ${id} needs a short name.`)
  }

  if (!scoreFields.length) {
    throw new Error(`Course ${id} needs at least one score field.`)
  }

  const grading = isPlainObject(course.grading) ? course.grading : null
  if (!grading || typeof grading.calculator !== 'string' || !grading.calculator.trim()) {
    throw new Error(`Course ${id} needs a grading.calculator value.`)
  }

  return {
    ...course,
    id,
    code,
    shortName,
    name,
    accent: typeof course.accent === 'string' && course.accent.trim() ? course.accent : '#6be3ff',
    type: typeof course.type === 'string' && course.type.trim() ? course.type : 'theory',
    weeklyItems: normalizeStringList(course.weeklyItems),
    weeklyPlan: Array.isArray(course.weeklyPlan) ? course.weeklyPlan : [],
    customTrackers: normalizeStringList(course.customTrackers),
    sessions: normalizeSessionMap(course.sessions),
    milestones: normalizeMilestoneList(course.milestones),
    scoreFields,
    scenarioFields: normalizeStringList(course.scenarioFields),
    grading,
  }
}

function normalizeImportedTermPack(rawPack) {
  if (!isPlainObject(rawPack)) {
    throw new Error('The JSON file must contain a term pack object.')
  }

  const id = String(rawPack.id ?? '').trim()
  const label = String(rawPack.label ?? '').trim()
  const term = isPlainObject(rawPack.term) ? rawPack.term : null
  const totalWeeks = Number(term?.totalWeeks)

  if (!id) {
    throw new Error('The pack needs an `id`.')
  }

  if (!label) {
    throw new Error(`Pack ${id} needs a label.`)
  }

  if (!term || typeof term.level !== 'string' || typeof term.term !== 'string' || typeof term.startDate !== 'string') {
    throw new Error(`Pack ${id} needs term.level, term.term, and term.startDate.`)
  }

  if (!Number.isFinite(totalWeeks) || totalWeeks <= 0) {
    throw new Error(`Pack ${id} needs a positive term.totalWeeks value.`)
  }

  const courses = Array.isArray(rawPack.courses) ? rawPack.courses.map(normalizeImportedCourse) : []
  if (!courses.length) {
    throw new Error(`Pack ${id} needs at least one course.`)
  }

  return {
    ...rawPack,
    id,
    label,
    term: {
      level: term.level.trim(),
      term: term.term.trim(),
      startDate: term.startDate.trim(),
      totalWeeks,
    },
    deadlineWindowDays: Number.isFinite(Number(rawPack.deadlineWindowDays)) ? Number(rawPack.deadlineWindowDays) : 7,
    calendarEvents: Array.isArray(rawPack.calendarEvents) ? rawPack.calendarEvents.filter(isPlainObject) : [],
    courses,
    isImported: true,
  }
}

function loadImportedTermPacks(rawPacks) {
  if (!Array.isArray(rawPacks)) {
    return []
  }

  return rawPacks.flatMap((rawPack) => {
    try {
      return [normalizeImportedTermPack(rawPack)]
    } catch {
      return []
    }
  })
}

function normalizeImportedTermPackList(rawValue) {
  const rawPacks = Array.isArray(rawValue) ? rawValue : [rawValue]
  const importedPacks = rawPacks.map(normalizeImportedTermPack)
  if (!importedPacks.length) {
    throw new Error('The uploaded file did not contain any term packs.')
  }

  const ids = new Set()

  importedPacks.forEach((termPack) => {
    if (ids.has(termPack.id)) {
      throw new Error(`Duplicate pack id detected in the uploaded file: ${termPack.id}.`)
    }

    ids.add(termPack.id)
  })

  return importedPacks
}

function mergeMilestones(baseMilestones, savedMilestones = []) {
  const savedById = new Map(savedMilestones.map((milestone) => [milestone.id, milestone]))

  const merged = baseMilestones.map((milestone) => {
    const saved = savedById.get(milestone.id)
    return saved ? { ...milestone, ...saved } : milestone
  })

  savedMilestones.forEach((milestone) => {
    if (!merged.some((item) => item.id === milestone.id)) {
      merged.push(milestone)
    }
  })

  return merged
}

function hydrateCourses(savedCourses = [], baseCourses = getCourseLibrary()) {
  const savedById = new Map(savedCourses.map((course) => [course.id, course]))

  return baseCourses.map((baseCourse) => {
    const savedCourse = savedById.get(baseCourse.id)
    if (!savedCourse) {
      return baseCourse
    }

    return {
      ...baseCourse,
      ...savedCourse,
      weeklyItems: baseCourse.weeklyItems,
      weeklyPlan: baseCourse.weeklyPlan ?? [],
      grading: baseCourse.grading,
      scoreFields: baseCourse.scoreFields,
      scenarioFields: baseCourse.scenarioFields,
      sessions: savedCourse.sessions ?? baseCourse.sessions,
      milestones: mergeMilestones(baseCourse.milestones, savedCourse.milestones),
    }
  })
}

function formatWeekRangeLabel(weeks) {
  if (!weeks.length) {
    return ''
  }

  if (weeks.length === 1) {
    return `W${weeks[0]}`
  }

  const isSequential = weeks.every((week, index) => index === 0 || week === weeks[index - 1] + 1)
  if (isSequential) {
    return `W${weeks[0]}-${weeks[weeks.length - 1]}`
  }

  return weeks.map((week) => `W${week}`).join(', ')
}

function formatWeeklyFlow(course) {
  const base = course.weeklyItems.length ? `Base: ${course.weeklyItems.join(', ')}` : 'Base: none'
  const dynamic = (course.weeklyPlan ?? []).length
    ? `Dynamic: ${(course.weeklyPlan ?? [])
        .map((entry) => `${entry.item} (${formatWeekRangeLabel(entry.weeks)})`)
        .join(', ')}`
    : 'Dynamic: none'

  return `${base}\n${dynamic}`
}

function loadState() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  let parsed = null

  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
  }

  const importedTermPacks = loadImportedTermPacks(parsed?.customTermPacks)
  registerTermPacks(importedTermPacks)

  const storedPackId = parsed?.setupState?.selectedTermPackId ?? parsed?.configId ?? getTermPacks()[0]?.id
  const activePack = setActiveTermPackById(storedPackId)
  const baseCourses = getCourseLibrary()
  const defaultCourseIds = getCourseIds(baseCourses)

  const fallback = {
    configId: activePack.id,
    setupState: {
      isComplete: false,
      selectedTermPackId: activePack.id,
      selectedCourseIds: defaultCourseIds,
    },
    courses: hydrateCourses([], baseCourses),
    weeklyState: {},
    gradesState: {},
    scenarioState: {},
    deadlineState: {},
    sessionWatchState: {},
    selectedWeek: TERM.week,
    customTermPacks: importedTermPacks,
    availableTermPacks: getTermPacks(),
  }

  if (!parsed) {
    return fallback
  }

  const sameConfig = (parsed.setupState?.selectedTermPackId ?? parsed.configId) === activePack.id
  const savedCourses = sameConfig && Array.isArray(parsed.courses) && parsed.courses.length ? parsed.courses : []

  return {
    configId: activePack.id,
    setupState: {
      isComplete: sameConfig ? Boolean(parsed.setupState?.isComplete) : false,
      selectedTermPackId: activePack.id,
      selectedCourseIds: sameConfig
        ? sanitizeSelectedCourseIds(parsed.setupState?.selectedCourseIds, baseCourses)
        : defaultCourseIds,
    },
    courses: hydrateCourses(savedCourses, baseCourses),
    weeklyState: sameConfig ? parsed.weeklyState ?? {} : {},
    gradesState: sameConfig ? parsed.gradesState ?? {} : {},
    scenarioState: sameConfig ? parsed.scenarioState ?? {} : {},
    deadlineState: sameConfig ? parsed.deadlineState ?? {} : {},
    sessionWatchState: sameConfig ? parsed.sessionWatchState ?? {} : {},
    selectedWeek: TERM.week,
    customTermPacks: importedTermPacks,
    availableTermPacks: getTermPacks(),
  }
}

function toggleCourseSelection(selectedCourseIds, courseId) {
  if (selectedCourseIds.includes(courseId)) {
    return selectedCourseIds.filter((id) => id !== courseId)
  }

  return [...selectedCourseIds, courseId]
}

function getRoute() {
  const rawHash = window.location.hash.replace(/^#/, '')
  return rawHash || '/'
}

function setRoute(path) {
  window.location.hash = path
}

function ProgressRing({ value, color }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference

  return (
    <svg className="progress-ring" viewBox="0 0 84 84" aria-hidden="true">
      <circle className="progress-ring__track" cx="42" cy="42" r={radius} />
      <circle
        className="progress-ring__value"
        cx="42"
        cy="42"
        r={radius}
        style={{
          stroke: color,
          strokeDasharray: circumference,
          strokeDashoffset: offset,
        }}
      />
      <text x="42" y="47" textAnchor="middle">
        {value}%
      </text>
    </svg>
  )
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-badge--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
}

function EligibilityPill({ eligible, pending }) {
  const state = pending ? 'pending' : eligible ? 'good' : 'bad'
  const label = pending ? 'Needs data' : eligible ? 'Eligible' : 'At risk'
  return <span className={`eligibility-pill eligibility-pill--${state}`}>{label}</span>
}

function MilestoneChip({ kind }) {
  if (kind === 'release') {
    return <span className="milestone-chip milestone-chip--release">Opens</span>
  }

  if (kind === 'deadline') {
    return <span className="milestone-chip milestone-chip--deadline">Due</span>
  }

  if (kind === 'exam') {
    return <span className="milestone-chip milestone-chip--exam">Exam</span>
  }

  return null
}

function TimelinePhases({ phases }) {
  return (
    <div className="timeline-phases">
      {phases.map((phase) => (
        <span key={`${phase.kind}-${phase.date}-${phase.label}`} className={`timeline-phase timeline-phase--${phase.kind}`}>
          {phase.label} {formatDate(phase.date)}
        </span>
      ))}
    </div>
  )
}

function getFieldLabel(course, key) {
  return course.scoreFields.find((field) => field.key === key)?.label ?? key.toUpperCase()
}

function SessionTrackerItem({ session, watched, onToggle }) {
  const [isExiting, setIsExiting] = useState(false)

  function handleChange() {
    if (!watched) {
      setIsExiting(true)
      window.setTimeout(() => {
        onToggle(session.id)
        setIsExiting(false)
      }, 260)
      return
    }

    onToggle(session.id)
  }

  return (
    <label className={isExiting ? 'session-item session-item--exit' : 'session-item'}>
      <input
        checked={watched}
        className="session-checkbox"
        onChange={handleChange}
        type="checkbox"
      />
      <div className="session-item__body">
        <div className="session-item__meta">
          <span style={{ color: session.accent }}>{session.course}</span>
          <small>
            {session.day}
            {session.isToday ? ' · Today' : session.isPast ? ' · Recording likely up' : ''}
          </small>
        </div>
        <strong>{session.session}</strong>
      </div>
    </label>
  )
}

function PastDeadlineItem({ item, completed, onToggle }) {
  const [isExiting, setIsExiting] = useState(false)

  function handleChange() {
    if (!completed) {
      setIsExiting(true)
      window.setTimeout(() => {
        onToggle(item.stateKey ?? item.id)
        setIsExiting(false)
      }, 260)
      return
    }

    onToggle(item.stateKey ?? item.id)
  }

  return (
    <label className={isExiting ? 'deadline-item deadline-item--exit' : 'deadline-item'}>
      <input
        checked={completed}
        className="deadline-checkbox"
        onChange={handleChange}
        type="checkbox"
      />
      <div className="deadline-item__body">
        <div className="deadline-item__courses">
          {item.courses.map((c) => (
            <span key={c.name} className="deadline-item__course" style={{ color: c.accent }}>
              {c.name}
            </span>
          ))}
        </div>
        <div>
          <div className="deadline-item__header">
            <strong>{item.label}</strong>
            <MilestoneChip kind={item.kind} />
          </div>
          <TimelinePhases phases={item.phases ?? [{ kind: item.kind, label: 'Date', date: item.date }]} />
        </div>
      </div>
      <span>{item.daysAgo}d ago</span>
    </label>
  )
}

function UpcomingDeadlineItem({ item, onComplete }) {
  const [isCompleting, setIsCompleting] = useState(false)

  function handleComplete() {
    setIsCompleting(true)
    window.setTimeout(() => {
      onComplete(item.stateKey ?? item.id)
      setIsCompleting(false)
    }, 420)
  }

  return (
    <article
      className={[
        'deadline-item',
        item.daysAway <= 2 ? 'deadline-item--urgent' : '',
        isCompleting ? 'deadline-item--done deadline-item--celebrate' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="deadline-item__courses">
        {item.courses.map((c) => (
          <span key={c.name} className="deadline-item__course" style={{ color: c.accent }}>
            {c.name}
          </span>
        ))}
      </div>
      <div className="deadline-item__body">
        <div>
          <div className="deadline-item__header">
            <strong>{item.label}</strong>
            <MilestoneChip kind={item.kind} />
          </div>
          <TimelinePhases phases={item.phases ?? [{ kind: item.kind, label: 'Date', date: item.date }]} />
        </div>
        <div className="deadline-item__footer">
          <span>{item.daysAway === 0 ? 'Today' : `${item.daysAway}d left`}</span>
          <button className="deadline-action" onClick={handleComplete} type="button">
            Done
          </button>
        </div>
      </div>
    </article>
  )
}

function ArchivedUpcomingDeadlineItem({ item, onUndo }) {
  return (
    <article className="deadline-item deadline-item--done">
      <div className="deadline-item__courses">
        {item.courses.map((c) => (
          <span key={c.name} className="deadline-item__course" style={{ color: c.accent }}>
            {c.name}
          </span>
        ))}
      </div>
      <div className="deadline-item__body">
        <div>
          <div className="deadline-item__header">
            <strong>{item.label}</strong>
            <MilestoneChip kind={item.kind} />
          </div>
          <TimelinePhases phases={item.phases ?? [{ kind: item.kind, label: 'Date', date: item.date }]} />
        </div>
        <div className="deadline-item__footer">
          <span>{item.archiveLabel}</span>
          <button
            className="deadline-action deadline-action--undo"
            onClick={() => onUndo(item.stateKey ?? item.id)}
            type="button"
          >
            Undo
          </button>
        </div>
      </div>
    </article>
  )
}

const PROGRAM_LEVELS = [
  {
    id: 'foundation',
    label: 'Foundation',
    icon: '🧱',
    tag: '43 credits · 9 Theory + 5 Labs',
    description: 'Core courses that prepare you for advanced levels. Includes English, Math, Circuits, C Programming, Digital Systems, and labs.',
  },
  {
    id: 'diploma',
    label: 'Diploma',
    icon: '📐',
    tag: '43 credits · 8 Theory + 3 Labs + 2 Projects',
    description: 'Signals & Systems, Python, Analog & Digital electronics, Sensors, DSP, and project courses.',
  },
  {
    id: 'degree',
    label: 'BS Degree',
    icon: '🎓',
    tag: '56 credits · 12 Courses + 1 Lab',
    description: 'Control Engineering, EMF, Product Design, Embedded Linux, FPGAs, plus department and open electives.',
  },
]

function SetupWizardPage({
  courses,
  termPacks,
  selectedTermPackId,
  selectedCourseIds,
  selectedWeek,
  onSelectTermPack,
  onSelectCourse,
  onSelectWeek,
  onImportTermPack,
  importStatus,
  importError,
  onSubmit,
}) {
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [isLaunching, setIsLaunching] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState('foundation')
  const selectedCount = selectedCourseIds.length
  const selectedPack = getTermPackById(selectedTermPackId) ?? termPacks[0]
  const totalSteps = 5

  // Derive available levels from current term pack courses
  const availableLevels = [...new Set(courses.map((c) => c.level || 'foundation'))]
  const filteredCourses = courses.filter((c) => (c.level || 'foundation') === selectedLevel)

  function goNext() {
    if (step < totalSteps - 1) {
      setDirection('forward')
      setStep((s) => s + 1)
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection('back')
      setStep((s) => s - 1)
    }
  }

  function handleLaunch() {
    if (!selectedCount) return
    setIsLaunching(true)
    setTimeout(() => onSubmit(), 2200)
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onImportTermPack(file)
  }

  const stepLabels = ['Welcome', 'Term Pack', 'Level', 'Courses', 'Launch']

  if (isLaunching) {
    return (
      <div className="setup-launch-overlay">
        <div className="setup-launch-content">
          <div className="setup-launch-ring" />
          <h2>Preparing your dashboard</h2>
          <p>{selectedCount} course{selectedCount === 1 ? '' : 's'} · Week {selectedWeek} · {selectedPack?.label}</p>
          <div className="setup-launch-bar">
            <span className="setup-launch-bar__fill" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="setup-shell">
      {/* Step indicator */}
      <div className="wizard-steps">
        {stepLabels.map((label, index) => (
          <button
            key={label}
            className={
              'wizard-step' +
              (index === step ? ' wizard-step--active' : '') +
              (index < step ? ' wizard-step--done' : '')
            }
            onClick={() => {
              setDirection(index > step ? 'forward' : 'back')
              setStep(index)
            }}
            type="button"
          >
            <span className="wizard-step__dot">{index < step ? '✓' : index + 1}</span>
            <span className="wizard-step__label">{label}</span>
          </button>
        ))}
        <div className="wizard-steps__track">
          <span style={{ width: `${(step / (totalSteps - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Step content with slide animation */}
      <div className="wizard-viewport">
        <div
          className={`wizard-slide wizard-slide--${direction}`}
          key={step}
        >
          {step === 0 && (
            <section className="wizard-panel wizard-panel--welcome">
              <div className="welcome-glow" />
              <p className="section-kicker">StudyPulse</p>
              <h2>Welcome to your IITM BS Progress Tracker</h2>
              <p className="muted-copy">
                Set up your dashboard — pick your term, choose your level, select courses, and set your week focus.
                Everything updates in real time.
              </p>
              <div className="setup-pack-card">
                <span>Active term pack</span>
                <strong>{selectedPack?.label ?? 'Unknown pack'}</strong>
                <small>{TERM.level} · {TERM.term}</small>
              </div>
              <button className="wizard-cta" onClick={goNext} type="button">
                Get started
                <span className="wizard-cta__arrow">→</span>
              </button>
            </section>
          )}

          {step === 1 && (
            <section className="wizard-panel">
              <p className="section-kicker">Step 1 of 4</p>
              <h2>Choose your term pack</h2>
              <p className="muted-copy">
                Select the term you&apos;re enrolled in. You can also import a custom pack JSON.
              </p>

              <div className="setup-import-panel">
                <input
                  ref={fileInputRef}
                  accept="application/json,.json"
                  aria-hidden="true"
                  className="setup-import-panel__input"
                  onChange={handleFileChange}
                  tabIndex={-1}
                  type="file"
                />
                <button
                  className="ghost-toggle ghost-toggle--compact"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Import pack JSON
                </button>
                <div className="setup-import-panel__status">
                  <span>{importStatus || 'Upload a local JSON pack to add another term.'}</span>
                  {importError ? <strong>{importError}</strong> : null}
                </div>
              </div>

              <div className="setup-pack-grid">
                {termPacks.map((termPack) => (
                  <button
                    key={termPack.id}
                    className={termPack.id === selectedTermPackId ? 'setup-pack-option setup-pack-option--active' : 'setup-pack-option'}
                    onClick={() => onSelectTermPack(termPack.id)}
                    type="button"
                  >
                    <strong>{termPack.label}</strong>
                    <span>{termPack.courses.length} courses</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="wizard-panel">
              <p className="section-kicker">Step 2 of 4</p>
              <h2>Select your level</h2>
              <p className="muted-copy">
                Pick the program level you&apos;re currently enrolled in. This filters which courses are shown next.
              </p>

              <div className="level-selector-grid">
                {PROGRAM_LEVELS.map((level, i) => {
                  const isAvailable = availableLevels.includes(level.id)
                  const isActive = selectedLevel === level.id
                  const courseCount = courses.filter((c) => (c.level || 'foundation') === level.id).length
                  return (
                    <button
                      key={level.id}
                      className={
                        'level-card' +
                        (isActive ? ' level-card--active' : '') +
                        (!isAvailable ? ' level-card--disabled' : '')
                      }
                      disabled={!isAvailable}
                      onClick={() => setSelectedLevel(level.id)}
                      style={{ '--i': i }}
                      type="button"
                    >
                      <span className="level-card__icon">{level.icon}</span>
                      <div className="level-card__body">
                        <strong>{level.label}</strong>
                        <small className="level-card__tag">{level.tag}</small>
                        <p>{level.description}</p>
                      </div>
                      {isAvailable && <span className="level-card__count">{courseCount} course{courseCount === 1 ? '' : 's'}</span>}
                      {!isAvailable && <span className="level-card__count level-card__count--na">Not in this pack</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="wizard-panel">
              <div className="wizard-panel__header">
                <div>
                  <p className="section-kicker">Step 3 of 4</p>
                  <h2>Select your courses</h2>
                  <p className="muted-copy">
                    Showing {PROGRAM_LEVELS.find((l) => l.id === selectedLevel)?.label ?? selectedLevel} courses.
                    Toggle the ones you&apos;re taking. You can change this later from Course Setup.
                  </p>
                </div>
                <span className="today-chip">{selectedCount} selected</span>
              </div>

              <div className="setup-course-grid">
                {filteredCourses.map((course, index) => {
                  const isSelected = selectedCourseIds.includes(course.id)
                  return (
                    <label
                      key={course.id}
                      className={isSelected ? 'setup-course-toggle setup-course-toggle--active' : 'setup-course-toggle'}
                      style={{ '--i': index }}
                    >
                      <input
                        checked={isSelected}
                        onChange={() => onSelectCourse(course.id)}
                        type="checkbox"
                      />
                      <div>
                        <strong style={{ color: course.accent }}>{course.shortName}</strong>
                        <p>{course.name}</p>
                      </div>
                    </label>
                  )
                })}
                {filteredCourses.length === 0 && (
                  <p className="muted-copy" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0' }}>
                    No courses found for this level in the selected term pack.
                  </p>
                )}
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="wizard-panel">
              <p className="section-kicker">Step 4 of 4</p>
              <h2>Choose your starting week</h2>
              <p className="muted-copy">
                This sets which week the execution board opens on. The current term week is auto-highlighted.
              </p>

              <div className="week-selector">
                {Array.from({ length: TERM.totalWeeks }, (_, index) => index + 1).map((week) => (
                  <button
                    key={week}
                    className={week === selectedWeek ? 'week-chip week-chip--active' : 'week-chip'}
                    onClick={() => onSelectWeek(week)}
                    type="button"
                  >
                    W{week}
                  </button>
                ))}
              </div>

              <div className="setup-summary">
                <div className="summary-block">
                  <span>Ready state</span>
                  <ul className="summary-list">
                    <li>{selectedCount} course{selectedCount === 1 ? '' : 's'} will be shown across the app.</li>
                    <li>Level: {PROGRAM_LEVELS.find((l) => l.id === selectedLevel)?.label ?? selectedLevel}</li>
                    <li>The weekly board will open with Week {selectedWeek} selected.</li>
                    <li>You can rerun setup later from Course Setup.</li>
                  </ul>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="wizard-nav">
        <button
          className="ghost-toggle"
          disabled={step === 0}
          onClick={goBack}
          type="button"
        >
          ← Back
        </button>

        <div className="wizard-nav__dots">
          {stepLabels.map((_, index) => (
            <span
              key={index}
              className={'wizard-dot' + (index === step ? ' wizard-dot--active' : index < step ? ' wizard-dot--done' : '')}
            />
          ))}
        </div>

        {step < totalSteps - 1 ? (
          <button
            className="deadline-action"
            onClick={goNext}
            type="button"
          >
            Continue →
          </button>
        ) : (
          <button
            className="deadline-action"
            disabled={!selectedCount}
            onClick={handleLaunch}
            type="button"
          >
            🚀 Launch dashboard
          </button>
        )}
      </div>
    </div>
  )
}

function Sidebar({ route, activeCourseCount }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <p className="brand-block__eyebrow">StudyPulse</p>
        <h1>IITM BS Progress Tracker</h1>
        <p>{TERM.level} · Week {TERM.week} of {TERM.totalWeeks} · {TERM.term}</p>
        <p className="sidebar__empty">{activeCourseCount} active course{activeCourseCount === 1 ? '' : 's'}</p>
      </div>

      <nav className="sidebar__nav" aria-label="Sections">
        {PAGE_LINKS.map((link) => (
          <button
            key={link.path}
            className={route === link.path ? 'nav-link nav-link--active' : 'nav-link'}
            onClick={() => setRoute(link.path)}
            type="button"
          >
            {link.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

function DashboardPage({
  courses,
  calendarEvents,
  weeklyState,
  gradesState,
  deadlineState,
  onToggleDeadline,
  sessionWatchState,
  onToggleSessionWatch,
}) {
  const [showArchivedDeadlines, setShowArchivedDeadlines] = useState(false)
  const [showWatchedSessions, setShowWatchedSessions] = useState(false)
  const termPercent = Math.round((TERM.week / TERM.totalWeeks) * 100)
  const allUpcoming = getUpcomingDeadlines(courses, calendarEvents)
  const completedUpcoming = allUpcoming
    .filter((item) => deadlineState[item.stateKey ?? item.id])
    .map((item) => ({
      ...item,
      archiveLabel: item.daysAway === 0 ? 'Done today' : item.daysAway > 0 ? `Done ${item.daysAway}d early` : 'Done',
      isArchivedCompletion: true,
      daysAgo: 0,
    }))
  const upcoming = allUpcoming.filter((item) => !deadlineState[item.stateKey ?? item.id])
  const allPastDeadlines = getPastDeadlines(courses, calendarEvents)
  const archivedDeadlines = [...completedUpcoming, ...allPastDeadlines]
    .sort((a, b) => b.date.localeCompare(a.date))
  const allSessions = getWeeklySessions(courses, TERM.week)
  const watchedSessionsCount = allSessions.filter((session) => sessionWatchState[session.id]).length
  const sessions = showWatchedSessions
    ? allSessions
    : allSessions.filter((session) => !sessionWatchState[session.id])
  const summary = getDashboardSummary(courses, weeklyState, gradesState, deadlineState, calendarEvents)
  const atRiskCourses = courses.filter((course) => {
    const result = calculateCourse(course, gradesState[course.id] ?? {})
    return result.score !== null && !result.eligibility.eligible && !result.eligibility.pending
  })

  return (
    <div className="content-grid">
      <section className="hero-card hero-card--wide">
        <div>
          <p className="section-kicker">Dashboard</p>
          <h2>Am I on track or falling behind?</h2>
          <p className="muted-copy">
            Term progress is fixed at Week {TERM.week} of {TERM.totalWeeks}. Status badges compare your completed checklist work
            against the ideal pace for this point in the term.
          </p>
        </div>

        <div className="term-progress">
          <div className="term-progress__label">
            <span>Term progress</span>
            <strong>{termPercent}%</strong>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${termPercent}%` }} />
          </div>
        </div>
      </section>

      <section className="card summary-card">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Summary</p>
            <h3>{summary.headline}</h3>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-block">
            <span>Working</span>
            <ul className="summary-list">
              {summary.stableAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="summary-block">
            <span>Improve next</span>
            <ul className="summary-list">
              {summary.improvementAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="course-grid">
        {courses.map((course, index) => {
          const progress = getCourseProgress(course, weeklyState)
          const grade = calculateCourse(course, gradesState[course.id] ?? {})
          const pending = grade.score === null || grade.eligibility.pending

          return (
            <article key={course.id} className="card course-card" style={{ '--i': index }}>
              <div className="course-card__top">
                <div>
                  <p className="course-card__code" style={{ color: course.accent }}>
                    {course.shortName} · {course.code}
                  </p>
                  <h3>{course.name}</h3>
                </div>
                <StatusBadge status={progress.status} />
              </div>

              <div className="course-card__metrics">
                <ProgressRing value={progress.percent} color={course.accent} />
                <div className="course-card__details">
                  <p>
                    Completed <strong>{progress.completed}</strong> of <strong>{progress.total}</strong> checklist items
                  </p>
                  <p>
                    Ideal by now: <strong>{progress.ideal}%</strong>
                  </p>
                  <div className="course-card__footer">
                    <EligibilityPill eligible={grade.eligibility.eligible} pending={pending} />
                    <span className="grade-chip">Band {grade.band}</span>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="card dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Upcoming timeline</p>
            <h3>Releases, due dates, and exams for the next 7 days</h3>
          </div>
          <div className="panel-header__actions">
            {archivedDeadlines.length ? (
              <button
                className="ghost-toggle ghost-toggle--compact"
                onClick={() => setShowArchivedDeadlines((current) => !current)}
                type="button"
              >
                {showArchivedDeadlines ? 'Hide archive' : `Past & done (${archivedDeadlines.length})`}
              </button>
            ) : null}
            <span className="today-chip">{getTodayLabel()}</span>
          </div>
        </div>

        <div className="encouragement-banner">
          <strong>Keep going.</strong>
          <p>
            {completedUpcoming.length
              ? `You have already banked ${completedUpcoming.length} win${completedUpcoming.length > 1 ? 's' : ''}. Each tick clears space in your head.`
              : 'Every deadline you clear now buys your future self more breathing room.'}
          </p>
        </div>

        {upcoming.length ? (
          <div className="deadline-list">
            {upcoming.map((item) => (
              <UpcomingDeadlineItem key={item.id} item={item} onComplete={onToggleDeadline} />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            {completedUpcoming.length
              ? 'Nothing left in the next 7 days. Nice work, you cleared the board.'
              : 'No releases, due dates, or exams inside the next 7 days.'}
          </p>
        )}

        {showArchivedDeadlines ? (
          archivedDeadlines.length ? (
            <div className="deadline-archive">
              {archivedDeadlines.map((item) => (
                item.isArchivedCompletion ? (
                  <ArchivedUpcomingDeadlineItem key={item.id} item={item} onUndo={onToggleDeadline} />
                ) : (
                  <PastDeadlineItem
                    key={item.id}
                    completed={Boolean(deadlineState[item.stateKey ?? item.id])}
                    item={item}
                    onToggle={onToggleDeadline}
                  />
                )
              ))}
            </div>
          ) : (
            <p className="empty-state">No archived or past deadlines yet.</p>
          )
        ) : null}
      </section>

      <section className="card dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Sessions & recordings</p>
            <h3>Tick off the sessions you watched live or as recordings</h3>
          </div>
          {watchedSessionsCount ? (
            <button
              className="ghost-toggle"
              onClick={() => setShowWatchedSessions((current) => !current)}
              type="button"
            >
              {showWatchedSessions ? 'Hide watched' : `Show watched (${watchedSessionsCount})`}
            </button>
          ) : null}
        </div>

        {sessions.length ? (
          <div className="session-list">
            {sessions.map((session) => (
              <SessionTrackerItem
                key={session.id}
                onToggle={onToggleSessionWatch}
                session={session}
                watched={Boolean(sessionWatchState[session.id])}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            {allSessions.length
              ? 'All sessions for this week are marked watched.'
              : 'No live or TA sessions mapped for this week.'}
          </p>
        )}
      </section>

      <section className="card dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Eligibility alert</p>
            <h3>Green when thresholds are met, red when they are not</h3>
          </div>
        </div>

        {atRiskCourses.length ? (
          <div className="risk-list">
            {atRiskCourses.map((course) => {
              const result = calculateCourse(course, gradesState[course.id] ?? {})
              return (
                <div key={course.id} className="risk-item">
                  <strong>{course.shortName}</strong>
                  <p>{result.eligibility.note}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="empty-state">No active eligibility warnings from the scores entered so far.</p>
        )}
      </section>
    </div>
  )
}

function WeeklyPage({
  courses,
  selectedWeek,
  weeklyState,
  onSelectWeek,
  onToggleItem,
}) {
  const weekProgress = getOverallWeekProgress(courses, selectedWeek, weeklyState)
  const activeCourses = courses.filter((course) => getCourseChecklist(course, selectedWeek).length > 0)

  return (
    <div className="content-grid">
      <section className="hero-card">
        <div>
          <p className="section-kicker">Weekly view</p>
          <h2>Week {selectedWeek} execution board</h2>
          <p className="muted-copy">Toggle each item as you complete it. The week percentage updates immediately.</p>
        </div>

        <div className="week-summary">
          <strong>{weekProgress.percent}%</strong>
          <span>{weekProgress.completed} / {weekProgress.total} items done this week</span>
        </div>
      </section>

      <section className="week-selector">
        {Array.from({ length: TERM.totalWeeks }, (_, index) => index + 1).map((week) => (
          <button
            key={week}
            className={week === selectedWeek ? 'week-chip week-chip--active' : 'week-chip'}
            onClick={() => onSelectWeek(week)}
            type="button"
          >
            W{week}
          </button>
        ))}
      </section>

      <section className="checklist-grid">
        {activeCourses.map((course) => {
          const courseWeek = weeklyState[course.id]?.[selectedWeek] ?? {}
          const completion = getWeekCompletion(course, selectedWeek, weeklyState)


          return (
            <article key={course.id} className="card checklist-card">
              <div className="checklist-card__header">
                <div>
                  <p style={{ color: course.accent }}>{course.shortName}</p>
                  <h3>{course.name}</h3>
                </div>
                <strong>{completion.percent}%</strong>
              </div>


              <div className="checklist-items">
                {getCourseChecklist(course, selectedWeek).map((item) => (
                  <label key={item} className={courseWeek[item] ? 'check-item check-item--done' : 'check-item'}>
                    <input
                      checked={Boolean(courseWeek[item])}
                      onChange={() => onToggleItem(course.id, selectedWeek, item)}
                      type="checkbox"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

function ScoreInputGrid({ course, values, onChange }) {
  return (
    <div className="score-grid">
      {course.scoreFields.map((field) => (
        <label key={field.key} className="field">
          <span>{field.label}</span>
          {field.type === 'select' ? (
            <select
              onChange={(event) => onChange(course.id, field.key, event.target.value)}
              value={values[field.key] ?? ''}
            >
              {field.options.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              max={field.max}
              min={field.min}
              onChange={(event) => onChange(course.id, field.key, event.target.value)}
              step={field.step}
              type="number"
              value={values[field.key] ?? ''}
            />
          )}
        </label>
      ))}
    </div>
  )
}

function ScenarioGrid({ course, values, onChange }) {
  return (
    <div className="scenario-grid">
      {course.scenarioFields.map((key) => (
        <label key={key} className="field">
          <span>Scenario {getFieldLabel(course, key)}</span>
          <input
            max="100"
            min="0"
            onChange={(event) => onChange(course.id, key, event.target.value)}
            step="1"
            type="number"
            value={values[key] ?? ''}
          />
        </label>
      ))}
    </div>
  )
}

function GradesPage({ courses, gradesState, scenarioState, onScoreChange, onScenarioChange }) {
  return (
    <div className="content-grid">
      <section className="hero-card">
        <div>
          <p className="section-kicker">Grades</p>
          <h2>What are my grades looking like?</h2>
          <p className="muted-copy">
            Every card uses the plan&apos;s course formula directly. Scenario inputs override selected fields so you can run quick
            projections.
          </p>
        </div>
      </section>

      <section className="grades-grid">
        {courses.map((course, index) => {
          const actual = calculateCourse(course, gradesState[course.id] ?? {})
          const projected = calculateCourse(course, gradesState[course.id] ?? {}, scenarioState[course.id] ?? {})
          const hasScenario = Object.values(scenarioState[course.id] ?? {}).some((value) => value !== '')

          return (
            <article key={course.id} className="card grade-card" style={{ '--i': index }}>
              <div className="grade-card__header">
                <div>
                  <p style={{ color: course.accent }}>{course.shortName}</p>
                  <h3>{course.name}</h3>
                </div>
                <EligibilityPill
                  eligible={actual.eligibility.eligible}
                  pending={actual.score === null || actual.eligibility.pending}
                />
              </div>

              <div className="score-summary">
                <div>
                  <span>Current score</span>
                  <strong>{actual.score ?? '--'}</strong>
                  <small>Band {actual.band}</small>
                </div>
                <div>
                  <span>What-if score</span>
                  <strong>{hasScenario ? projected.score ?? '--' : '--'}</strong>
                  <small>{hasScenario ? `Band ${projected.band}` : 'Enter scenario values'}</small>
                </div>
              </div>

              <p className="formula-note">{actual.eligibility.note}</p>

              <ScoreInputGrid course={course} onChange={onScoreChange} values={gradesState[course.id] ?? {}} />

              <div className="scenario-block">
                <p className="section-kicker">What if</p>
                <ScenarioGrid course={course} onChange={onScenarioChange} values={scenarioState[course.id] ?? {}} />
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

function CourseSetupPage({ courses, onCourseFieldChange, onMilestoneChange, onReopenSetup }) {
  return (
    <div className="content-grid">
      <section className="hero-card">
        <div>
          <p className="section-kicker">Course setup</p>
          <h2>Pre-loaded courses, dates, and trackers</h2>
          <p className="muted-copy">
            Edit labels, accent colors, milestone dates, and custom trackers. Weekly checklists now follow the course schedule
            automatically.
          </p>
          <p className="muted-copy">Active pack: {ACTIVE_TERM_PACK.label}</p>
        </div>
        <button className="ghost-toggle" onClick={onReopenSetup} type="button">
          Run setup again
        </button>
      </section>

      <section className="setup-grid">
        {courses.map((course) => (
          <article key={course.id} className="card setup-card">
            <div className="setup-card__head">
              <div>
                <p style={{ color: course.accent }}>{course.shortName}</p>
                <h3>{course.name}</h3>
              </div>
              <input
                aria-label={`${course.name} accent color`}
                className="color-input"
                onChange={(event) => onCourseFieldChange(course.id, 'accent', event.target.value)}
                type="color"
                value={course.accent}
              />
            </div>

            <div className="form-row">
              <label className="field">
                <span>Course name</span>
                <input onChange={(event) => onCourseFieldChange(course.id, 'name', event.target.value)} type="text" value={course.name} />
              </label>

              <label className="field">
                <span>Short name</span>
                <input
                  onChange={(event) => onCourseFieldChange(course.id, 'shortName', event.target.value)}
                  type="text"
                  value={course.shortName}
                />
              </label>
            </div>

            <label className="field">
              <span>Weekly flow (auto-managed)</span>
              <textarea
                readOnly
                rows="3"
                value={formatWeeklyFlow(course)}
              />
            </label>

            <label className="field">
              <span>Custom trackers (comma separated)</span>
              <textarea
                onChange={(event) => onCourseFieldChange(course.id, 'customTrackers', splitList(event.target.value))}
                rows="2"
                value={course.customTrackers.join(', ')}
              />
            </label>

            <div className="milestone-editor">
              {course.milestones.map((milestone) => (
                <div key={milestone.id} className="milestone-row">
                  <input
                    onChange={(event) => onMilestoneChange(course.id, milestone.id, 'label', event.target.value)}
                    type="text"
                    value={milestone.label}
                  />
                  <input
                    onChange={(event) => onMilestoneChange(course.id, milestone.id, 'date', event.target.value)}
                    type="date"
                    value={milestone.date}
                  />
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function AnalyticsPage({ courses, weeklyState }) {
  const series = getAnalyticsSeries(courses, weeklyState)

  return (
    <div className="content-grid">
      <section className="hero-card">
        <div>
          <p className="section-kicker">Analytics</p>
          <h2>Ideal vs actual completion</h2>
          <p className="muted-copy">
            The chart compares each week&apos;s checklist completion against the ideal linear pace. Course bars show cumulative
            completion across the full term.
          </p>
        </div>
      </section>

      <section className="card analytics-card">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Week-by-week</p>
            <h3>Completion chart</h3>
          </div>
        </div>

        <div className="chart-list">
          {series.map((entry) => (
            <div key={entry.week} className="chart-row">
              <span>W{entry.week}</span>
              <div className="chart-bars">
                <div className="chart-bar chart-bar--ideal" style={{ width: `${entry.ideal}%` }} />
                <div className="chart-bar chart-bar--actual" style={{ width: `${entry.actual}%` }} />
              </div>
              <strong>{entry.actual}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card analytics-card">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Per course</p>
            <h3>Comparison</h3>
          </div>
        </div>

        <div className="comparison-list">
          {courses.map((course) => {
            const progress = getCourseProgress(course, weeklyState)

            return (
              <div key={course.id} className="comparison-row">
                <div>
                  <strong>{course.shortName}</strong>
                  <p>{progress.status}</p>
                </div>
                <div className="comparison-bar">
                  <span style={{ width: `${progress.percent}%`, background: course.accent }} />
                </div>
                <strong>{progress.percent}%</strong>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function splitList(value) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function App() {
  const [bootState] = useState(() => loadState())
  const [route, setCurrentRoute] = useState(getRoute())
  const [setupState, setSetupState] = useState(bootState.setupState)
  const [courses, setCourses] = useState(bootState.courses)
  const [weeklyState, setWeeklyState] = useState(bootState.weeklyState)
  const [gradesState, setGradesState] = useState(bootState.gradesState)
  const [scenarioState, setScenarioState] = useState(bootState.scenarioState)
  const [deadlineState, setDeadlineState] = useState(bootState.deadlineState)

  const [sessionWatchState, setSessionWatchState] = useState(bootState.sessionWatchState)
  const [selectedWeek, setSelectedWeek] = useState(bootState.selectedWeek)
  const [availableTermPacks, setAvailableTermPacks] = useState(bootState.availableTermPacks)
  const [customTermPacks, setCustomTermPacks] = useState(bootState.customTermPacks)
  const [importStatus, setImportStatus] = useState('')
  const [importError, setImportError] = useState('')
  const calendarEvents = getActiveTermPack().calendarEvents ?? []

  useEffect(() => {
    const onHashChange = () => setCurrentRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      setRoute('/')
    }
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
        getStoragePayload(
          courses,
          weeklyState,
          gradesState,
          scenarioState,
          selectedWeek,
          deadlineState,
          sessionWatchState,
          setupState,
          setupState.selectedTermPackId,
          customTermPacks,
        ),
      )
  }, [courses, weeklyState, gradesState, scenarioState, selectedWeek, deadlineState, sessionWatchState, setupState, customTermPacks])

  function handleToggleItem(courseId, week, item) {
    setWeeklyState((current) => ({
      ...current,
      [courseId]: {
        ...(current[courseId] ?? {}),
        [week]: {
          ...(current[courseId]?.[week] ?? {}),
          [item]: !(current[courseId]?.[week]?.[item] ?? false),
        },
      },
    }))
  }

  function handleScoreChange(courseId, key, value) {
    setGradesState((current) => ({
      ...current,
      [courseId]: {
        ...(current[courseId] ?? {}),
        [key]: value,
      },
    }))
  }

  function handleScenarioChange(courseId, key, value) {
    setScenarioState((current) => ({
      ...current,
      [courseId]: {
        ...(current[courseId] ?? {}),
        [key]: value,
      },
    }))
  }

  function handleToggleDeadline(deadlineId) {
    setDeadlineState((current) => ({
      ...current,
      [deadlineId]: !current[deadlineId],
    }))
  }

  function handleToggleSessionWatch(sessionId) {
    setSessionWatchState((current) => ({
      ...current,
      [sessionId]: !current[sessionId],
    }))
  }

  function handleCourseFieldChange(courseId, key, value) {
    setCourses((current) =>
      current.map((course) => (course.id === courseId ? { ...course, [key]: value } : course)),
    )
  }

  function handleMilestoneChange(courseId, milestoneId, key, value) {
    setCourses((current) =>
      current.map((course) =>
        course.id === courseId
          ? {
              ...course,
              milestones: course.milestones.map((milestone) =>
                milestone.id === milestoneId ? { ...milestone, [key]: value } : milestone,
              ),
            }
          : course,
      ),
    )
  }

  function resetToPack(termPackId) {
    const activePack = setActiveTermPackById(termPackId)
    const baseCourses = getCourseLibrary()

    setCourses(hydrateCourses([], baseCourses))
    setWeeklyState({})
    setGradesState({})
    setScenarioState({})
    setDeadlineState({})
    setSessionWatchState({})
    setSelectedWeek(TERM.week)
    setSetupState({
      isComplete: false,
      selectedTermPackId: activePack.id,
      selectedCourseIds: getCourseIds(baseCourses),
    })
  }

  function handleSelectTermPack(termPackId) {
    setImportError('')
    setImportStatus('')
    resetToPack(termPackId)
  }

  async function handleImportTermPack(file) {
    setImportError('')
    setImportStatus(`Reading ${file.name}...`)

    try {
      const rawText = await file.text()
      const parsed = JSON.parse(rawText)
      const importedPacks = normalizeImportedTermPackList(parsed)
      const existingIds = new Set(getTermPacks().map((termPack) => termPack.id))

      importedPacks.forEach((termPack) => {
        if (existingIds.has(termPack.id)) {
          throw new Error(`A pack with id "${termPack.id}" already exists.`)
        }
      })

      importedPacks.forEach((termPack) => registerTermPack(termPack))

      setCustomTermPacks((current) => {
        const nextCustomTermPacks = [...current]
        importedPacks.forEach((termPack) => {
          if (!nextCustomTermPacks.some((existing) => existing.id === termPack.id)) {
            nextCustomTermPacks.push(termPack)
          }
        })
        return nextCustomTermPacks
      })
      setAvailableTermPacks(getTermPacks())
      resetToPack(importedPacks[0].id)
      setImportStatus(`Imported ${importedPacks.length} pack${importedPacks.length > 1 ? 's' : ''}.`)
    } catch (error) {
      setImportStatus('')
      setImportError(error instanceof Error ? error.message : 'Failed to import the pack JSON.')
    }
  }

  function handleToggleTrackedCourse(courseId) {
    setSetupState((current) => ({
      ...current,
      selectedCourseIds: toggleCourseSelection(current.selectedCourseIds, courseId),
    }))
  }

  function handleCompleteSetup() {
    if (!setupState.selectedCourseIds.length) {
      return
    }

    setSetupState((current) => ({ ...current, isComplete: true }))
    setRoute('/')
  }

  function handleReopenSetup() {
    setSetupState((current) => ({ ...current, isComplete: false }))
  }

  const activeCourses = courses.filter((course) => setupState.selectedCourseIds.includes(course.id))

  if (!setupState.isComplete) {
    return (
      <main className="main-panel main-panel--setup">
        <SetupWizardPage
          courses={courses}
          importError={importError}
          importStatus={importStatus}
          onImportTermPack={handleImportTermPack}
          termPacks={availableTermPacks}
          selectedTermPackId={setupState.selectedTermPackId}
          onSelectCourse={handleToggleTrackedCourse}
          onSelectTermPack={handleSelectTermPack}
          onSelectWeek={setSelectedWeek}
          onSubmit={handleCompleteSetup}
          selectedCourseIds={setupState.selectedCourseIds}
          selectedWeek={selectedWeek}
        />
      </main>
    )
  }

  let page = (
    <DashboardPage
      calendarEvents={calendarEvents}
      courses={activeCourses}
      deadlineState={deadlineState}
      gradesState={gradesState}
      onToggleDeadline={handleToggleDeadline}
      onToggleSessionWatch={handleToggleSessionWatch}
      sessionWatchState={sessionWatchState}
      weeklyState={weeklyState}
    />
  )

  if (route === '/weekly') {
    page = (
      <WeeklyPage
        courses={activeCourses}
        onSelectWeek={setSelectedWeek}
        onToggleItem={handleToggleItem}
        selectedWeek={selectedWeek}
        weeklyState={weeklyState}
      />
    )
  }

  if (route === '/grades') {
    page = (
      <GradesPage
        courses={activeCourses}
        gradesState={gradesState}
        onScenarioChange={handleScenarioChange}
        onScoreChange={handleScoreChange}
        scenarioState={scenarioState}
      />
    )
  }

  if (route === '/courses') {
    page = (
      <CourseSetupPage
        courses={activeCourses}
        onCourseFieldChange={handleCourseFieldChange}
        onMilestoneChange={handleMilestoneChange}
        onReopenSetup={handleReopenSetup}
      />
    )
  }

  if (route === '/analytics') {
    page = <AnalyticsPage courses={activeCourses} weeklyState={weeklyState} />
  }

  return (
    <div className="app-shell">
      <Sidebar activeCourseCount={activeCourses.length} route={route} />
      <main className="main-panel">{page}</main>
    </div>
  )
}

export default App
