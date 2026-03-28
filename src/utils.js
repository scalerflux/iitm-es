import { getDeadlineWindowDays, TERM } from './data'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const MILESTONE_PRIORITY = { release: 0, deadline: 1, exam: 2, milestone: 3 }

function getPhaseStateKey(itemId, phase) {
  return `${itemId}|${phase.kind}|${phase.date}`
}

function getWeekStart(selectedWeek) {
  const start = new Date(`${TERM.startDate}T00:00:00`)
  start.setDate(start.getDate() + (selectedWeek - 1) * 7)
  return start
}

function toTitleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function average(values) {
  const valid = values.filter((value) => value !== null)
  if (!valid.length) {
    return null
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function bestAverage(values, count) {
  const valid = values.filter((value) => value !== null).sort((a, b) => b - a)
  if (!valid.length) {
    return null
  }
  return average(valid.slice(0, count))
}

function averageFromKeys(values, keys) {
  return average(keys.map((key) => getScore(values, key)))
}

function bestAverageFromKeys(values, keys, count) {
  return bestAverage(keys.map((key) => getScore(values, key)), count)
}

function bonusFromThresholds(value, tiers = []) {
  if (value === null) {
    return 0
  }

  return tiers.reduce((bonus, tier) => (value >= tier.min ? tier.bonus : bonus), 0)
}

function estimateBand(score) {
  if (score === null) {
    return 'Pending'
  }
  if (score >= 90) {
    return 'S'
  }
  if (score >= 80) {
    return 'A'
  }
  if (score >= 70) {
    return 'B'
  }
  if (score >= 60) {
    return 'C'
  }
  if (score >= 50) {
    return 'D'
  }
  if (score >= 40) {
    return 'E'
  }
  return 'U'
}

function mergeScores(baseScores, overrides) {
  const result = { ...baseScores }
  Object.entries(overrides).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      result[key] = value
    }
  })
  return result
}

function getScore(values, key) {
  return toNumber(values[key])
}

function roundScore(score) {
  return Number(score.toFixed(1))
}

function theoryEligibility(values, params) {
  const {
    assignmentKeys = [],
    bestCount = assignmentKeys.length,
    threshold = 40,
    quizKeys = ['q1', 'q2'],
    assignmentLabel = 'GA',
  } = params

  const assignmentValues = assignmentKeys.map((key) => getScore(values, key))
  const bestAssignmentAverage = bestAverage(assignmentValues, bestCount)
  const hasQuiz = quizKeys.some((key) => getScore(values, key) !== null)
  const pending = bestAssignmentAverage === null || ((bestAssignmentAverage ?? 0) >= threshold && !hasQuiz)

  return {
    bestGaAverage: bestAssignmentAverage,
    eligible: !pending && (bestAssignmentAverage ?? 0) >= threshold && hasQuiz,
    pending,
    note: `Best ${bestCount}/${assignmentKeys.length} ${assignmentLabel} >= ${threshold} and at least one quiz attended`,
  }
}

function linuxEligibility(values, params) {
  const {
    firstThreeBptKeys = [],
    sctKey = 'oppeSct',
    oppeKey = 'oppe',
    finalKey = 'final',
    threshold = 40,
  } = params

  const firstThreeAverage = averageFromKeys(values, firstThreeBptKeys)
  const oppeSct = getScore(values, sctKey)
  const oppe = getScore(values, oppeKey)
  const final = getScore(values, finalKey)

  let pending = false
  let eligible = false
  let note = 'Enter BPT 1-3 and OPPE SCT status to evaluate OPPE eligibility'

  if (firstThreeAverage === null) {
    pending = true
  } else if (firstThreeAverage < threshold) {
    note = `OPPE needs the average of the first 3 BPT scores to be >= ${threshold}`
  } else if (oppeSct === null) {
    pending = true
    note = 'First 3 BPT average is clear. Mark OPPE SCT completion to confirm OPPE eligibility'
  } else if (oppeSct < 1) {
    note = 'Complete the OPPE SCT to unlock OPPE scheduling'
  } else if (oppe === null) {
    pending = true
    note = `OPPE unlocked. Final course grade still needs OPPE >= ${threshold} and End Term attendance`
  } else if (oppe < threshold) {
    note = `Course grade needs OPPE >= ${threshold} and End Term attendance`
  } else if (final === null) {
    pending = true
    note = 'OPPE threshold met. Final course grade still needs End Term attendance'
  } else {
    eligible = true
    note = 'OPPE SCT, first 3 BPT average, and OPPE threshold are all clear'
  }

  return {
    bestGaAverage: firstThreeAverage,
    eligible,
    pending,
    note,
  }
}

function electronicsLabEligibility(values, params) {
  const {
    onlineKeys = [],
    bestCount = onlineKeys.length,
    threshold = 40,
    inPersonKey = 'il',
  } = params

  const weeklyExperimentAverage = averageFromKeys(values, onlineKeys)
  const bestSixAverage = bestAverageFromKeys(values, onlineKeys, bestCount)
  const inCampus = getScore(values, inPersonKey)

  let pending = false
  let eligible = false
  let note = `Best ${bestCount}/${onlineKeys.length} online lab average must be >= ${threshold} to attend the in-person lab`

  if (bestSixAverage === null) {
    pending = true
  } else if (bestSixAverage < threshold) {
    note = `In-person lab needs the best ${bestCount}/${onlineKeys.length} online lab average to be >= ${threshold}`
  } else if ((weeklyExperimentAverage ?? 0) < threshold) {
    note = `Final course grade needs WE >= ${threshold} and attendance in the IITM in-person lab`
  } else if (inCampus === null) {
    pending = true
    note = 'In-person lab unlocked. Final course grade still needs the IITM in-person lab score'
  } else {
    eligible = true
    note = 'Best 6/8 OL average, WE threshold, and in-person lab requirements are satisfied'
  }

  return {
    bestGaAverage: bestSixAverage,
    eligible,
    pending,
    note,
  }
}

function linuxLabEligibility(values, params) {
  const {
    onlineKeys = [],
    threshold = 40,
    inPersonKey = 'il',
  } = params

  const onlineAverage = averageFromKeys(values, onlineKeys)
  const inCampus = getScore(values, inPersonKey)
  const overallAverage = average([...onlineKeys.map((key) => getScore(values, key)), inCampus])

  let pending = false
  let eligible = false
  let note = `Average of all online lab scores must be >= ${threshold} to attend the in-person lab`

  if (onlineAverage === null) {
    pending = true
  } else if (onlineAverage < threshold) {
    note = `In-person lab needs the average of all online lab scores to be >= ${threshold}`
  } else if (inCampus === null) {
    pending = true
    note = 'In-person lab unlocked. Final grade still needs the IITM in-person lab score'
  } else if ((overallAverage ?? 0) < threshold) {
    note = `Final lab course grade needs the average of all lab scores to be >= ${threshold}`
  } else {
    eligible = true
    note = 'Online lab average, overall average, and in-person lab requirements are satisfied'
  }

  return {
    bestGaAverage: onlineAverage,
    eligible,
    pending,
    note,
  }
}

function embeddedCLabEligibility(values, params) {
  const { attendanceKey = 'attendance' } = params
  const attendance = getScore(values, attendanceKey)

  if (attendance === null) {
    return {
      bestGaAverage: null,
      eligible: false,
      pending: true,
      note: 'Enter the in-person lab attendance/score to evaluate the course outcome',
    }
  }

  return {
    bestGaAverage: attendance,
    eligible: attendance > 0,
    pending: false,
    note:
      attendance > 0
        ? 'Embedded C Lab is in-person only. Attendance requirement is satisfied'
        : 'Embedded C Lab requires attending the in-person lab',
  }
}

const COURSE_CALCULATORS = {
  foundationTheory(values, params) {
    const q1 = getScore(values, 'q1') ?? 0
    const q2 = getScore(values, 'q2') ?? 0
    const final = getScore(values, 'final') ?? 0
    const primary = params.quizWeightsPrimary.finalWeight * final + params.quizWeightsPrimary.bestQuizWeight * Math.max(q1, q2)
    const secondary =
      params.quizWeightsSecondary.finalWeight * final +
      params.quizWeightsSecondary.quiz1Weight * q1 +
      params.quizWeightsSecondary.quiz2Weight * q2
    const bonus = params.tutorialBonusKey
      ? bonusFromThresholds(getScore(values, params.tutorialBonusKey), params.tutorialBonus)
      : 0

    return {
      score: roundScore(Math.max(primary, secondary) + bonus),
      eligibility: theoryEligibility(values, params.eligibility ?? {}),
    }
  },
  linuxTheory(values, params) {
    const q1 = getScore(values, 'q1') ?? 0
    const oppe = getScore(values, 'oppe') ?? 0
    const final = getScore(values, 'final') ?? 0
    const bptAverage = averageFromKeys(values, params.bptKeys ?? []) ?? 0
    const vmt = getScore(values, 'vmt') ?? 0
    const nppe = getScore(values, 'nppe') ?? 0
    const score =
      params.weights.q1 * q1 +
      params.weights.oppe * oppe +
      params.weights.final * final +
      params.weights.bptAverage * bptAverage +
      params.weights.vmt * vmt +
      params.weights.nppe * nppe

    return {
      score: roundScore(score),
      eligibility: linuxEligibility(values, {
        firstThreeBptKeys: params.firstThreeBptKeys,
        ...params.eligibility,
      }),
    }
  },
  embeddedCTheory(values, params) {
    const q1 = getScore(values, 'q1') ?? 0
    const q2 = getScore(values, 'q2') ?? 0
    const final = getScore(values, 'final') ?? 0
    const grpa = bestAverageFromKeys(values, params.grpaKeys ?? [], params.grpaBestCount) ?? 0
    const primary = params.quizWeightsPrimary.finalWeight * final + params.quizWeightsPrimary.bestQuizWeight * Math.max(q1, q2)
    const secondary =
      params.quizWeightsSecondary.finalWeight * final +
      params.quizWeightsSecondary.quiz1Weight * q1 +
      params.quizWeightsSecondary.quiz2Weight * q2

    return {
      score: roundScore(params.grpaWeight * grpa + Math.max(primary, secondary)),
      eligibility: theoryEligibility(values, params.eligibility ?? {}),
    }
  },
  electronicsLab(values, params) {
    const weeklyExperimentAverage = averageFromKeys(values, params.onlineKeys ?? []) ?? 0
    const inPerson = getScore(values, params.inPersonKey) ?? 0

    return {
      score: roundScore(params.onlineWeight * weeklyExperimentAverage + params.inPersonWeight * inPerson),
      eligibility: electronicsLabEligibility(values, {
        onlineKeys: params.onlineKeys,
        inPersonKey: params.inPersonKey,
        ...params.eligibility,
      }),
    }
  },
  linuxLab(values, params) {
    const onlineAverage = averageFromKeys(values, params.onlineKeys ?? []) ?? 0
    const inPerson = getScore(values, params.inPersonKey) ?? 0

    return {
      score: roundScore(params.onlineWeight * onlineAverage + params.inPersonWeight * inPerson),
      eligibility: linuxLabEligibility(values, {
        onlineKeys: params.onlineKeys,
        inPersonKey: params.inPersonKey,
        ...params.eligibility,
      }),
    }
  },
  embeddedCLab(values, params) {
    const attendance = getScore(values, params.attendanceKey) ?? 0
    const viva = getScore(values, params.vivaKey) ?? 0

    return {
      score: roundScore(params.attendanceWeight * attendance + params.vivaWeight * viva),
      eligibility: embeddedCLabEligibility(values, { attendanceKey: params.attendanceKey }),
    }
  },
}

export function calculateCourse(course, rawValues, overrides = {}) {
  const values = mergeScores(rawValues, overrides)
  const hasAnyInput = Object.values(values).some(
    (value) => value !== '' && value !== null && value !== undefined,
  )

  if (!hasAnyInput) {
    return {
      score: null,
      band: estimateBand(null),
      eligibility: {
        eligible: false,
        pending: true,
        bestGaAverage: null,
        note: 'Enter scores to evaluate eligibility',
      },
    }
  }

  let score = null
  let eligibility = {
    eligible: false,
    pending: true,
    bestGaAverage: null,
    note: 'Enter scores to evaluate eligibility',
  }

  const calculator = COURSE_CALCULATORS[course.grading?.calculator]

  if (calculator) {
    const result = calculator(values, course.grading?.params ?? {})
    score = result.score
    eligibility = result.eligibility
  }

  return {
    score,
    band: estimateBand(score),
    eligibility,
  }
}

export function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function getTodayLabel() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())
}

function getTimelineEvents(courses, extraEvents = []) {
  const courseEvents = courses.flatMap((course) =>
    course.milestones.map((milestone) => ({
      courseId: course.id,
      course: course.shortName,
      accent: course.accent,
      label: milestone.label,
      timelineLabel: milestone.timelineTitle ?? milestone.label,
      phaseLabel:
        milestone.phaseLabel ??
        (milestone.kind === 'release'
          ? 'Opens'
          : milestone.kind === 'deadline'
            ? 'Due'
            : milestone.kind === 'exam'
              ? 'Exam'
              : 'Date'),
      date: milestone.date,
      kind: milestone.kind ?? 'milestone',
      groupKey: milestone.timelineGroup
        ? `${course.id}|${milestone.timelineGroup}`
        : `${milestone.date}|${milestone.label}|${milestone.kind ?? 'milestone'}`,
    })),
  )

  const calendarEvents = extraEvents.map((event) => ({
    courseId: 'calendar',
    course: 'Calendar',
    accent: event.accent ?? '#c3b5ff',
    label: event.label,
    timelineLabel: event.timelineTitle ?? event.label,
    phaseLabel:
      event.phaseLabel ??
      (event.kind === 'release'
        ? 'Opens'
        : event.kind === 'deadline'
          ? 'Due'
          : event.kind === 'exam'
            ? 'Exam'
            : 'Date'),
    date: event.date,
    kind: event.kind ?? 'milestone',
    groupKey: event.timelineGroup
      ? `calendar|${event.timelineGroup}`
      : `calendar|${event.date}|${event.label}|${event.kind ?? 'milestone'}`,
  }))

  return [...courseEvents, ...calendarEvents]
}

function buildTimelineItems(courses, today, extraEvents = []) {
  const groups = new Map()

  getTimelineEvents(courses, extraEvents).forEach((event) => {
    if (!groups.has(event.groupKey)) {
      groups.set(event.groupKey, {
        id: event.groupKey,
        label: event.timelineLabel,
        courses: [],
        phases: [],
      })
    }

    const group = groups.get(event.groupKey)
    if (!group.courses.some((course) => course.name === event.course)) {
      group.courses.push({ name: event.course, accent: event.accent })
    }

    if (!group.phases.some((phase) => phase.kind === event.kind && phase.date === event.date && phase.label === event.phaseLabel)) {
      group.phases.push({
        kind: event.kind,
        label: event.phaseLabel,
        date: event.date,
      })
    }
  })

  return Array.from(groups.values()).map((group) => {
    const phases = [...group.phases].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return (MILESTONE_PRIORITY[a.kind] ?? 9) - (MILESTONE_PRIORITY[b.kind] ?? 9)
    })

    const upcomingPhase = phases.find((phase) => new Date(`${phase.date}T00:00:00`) >= today) ?? null
    const latestPhase = phases[phases.length - 1] ?? null
    const anchorPhase = upcomingPhase ?? latestPhase

    return {
      ...group,
      phases,
      kind: anchorPhase?.kind ?? 'milestone',
      date: anchorPhase?.date ?? phases[0]?.date,
    }
  })
}

export function getUpcomingDeadlines(courses, extraEvents = []) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const threshold = new Date(today)
  threshold.setDate(threshold.getDate() + getDeadlineWindowDays())

  return buildTimelineItems(courses, today, extraEvents)
    .map((item) => {
      const nextPhase = item.phases.find((phase) => {
        const date = new Date(`${phase.date}T00:00:00`)
        return date >= today && date <= threshold
      })

      if (!nextPhase) {
        return null
      }

      const nextDate = new Date(`${nextPhase.date}T00:00:00`)
      return {
        ...item,
        stateKey: getPhaseStateKey(item.id, nextPhase),
        date: nextPhase.date,
        kind: nextPhase.kind,
        daysAway: Math.round((nextDate.getTime() - today.getTime()) / DAY_MS),
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return (MILESTONE_PRIORITY[a.kind] ?? 9) - (MILESTONE_PRIORITY[b.kind] ?? 9)
    })
}

export function getPastDeadlines(courses, extraEvents = []) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return buildTimelineItems(courses, today, extraEvents)
    .map((item) => {
      const hasFuturePhase = item.phases.some((phase) => new Date(`${phase.date}T00:00:00`) >= today)
      if (hasFuturePhase) {
        return null
      }

      const latestPhase = item.phases[item.phases.length - 1]
      if (!latestPhase) {
        return null
      }

      const latestDate = new Date(`${latestPhase.date}T00:00:00`)
      return {
        ...item,
        stateKey: getPhaseStateKey(item.id, latestPhase),
        date: latestPhase.date,
        kind: latestPhase.kind,
        daysAgo: Math.round((today.getTime() - latestDate.getTime()) / DAY_MS),
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date)
      }
      return (MILESTONE_PRIORITY[a.kind] ?? 9) - (MILESTONE_PRIORITY[b.kind] ?? 9)
    })
}

export function getTodaySessions(courses) {
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  return courses
    .flatMap((course) =>
      (course.sessions[day] ?? []).map((session) => ({
        id: `${course.id}-${session}`,
        course: course.shortName,
        accent: course.accent,
        session,
      })),
    )
}

export function getWeeklySessions(courses, selectedWeek) {
  const weekStart = getWeekStart(selectedWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return courses
    .flatMap((course) =>
      Object.entries(course.sessions ?? {}).flatMap(([day, entries]) => {
        const dayIndex = WEEK_DAYS.indexOf(day)
        if (dayIndex < 0) {
          return []
        }

        const sessionDate = new Date(weekStart)
        sessionDate.setDate(sessionDate.getDate() + dayIndex)
        if (sessionDate < weekStart || sessionDate > weekEnd) {
          return []
        }

        const isoDate = sessionDate.toISOString().slice(0, 10)

        return entries.map((session, index) => ({
          id: `${course.id}-${isoDate}-${index}`,
          course: course.shortName,
          accent: course.accent,
          session,
          day: toTitleCase(day),
          date: isoDate,
          isToday: isoDate === today.toISOString().slice(0, 10),
          isPast: sessionDate < today,
        }))
      }),
    )
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return a.course.localeCompare(b.course)
    })
}

export function getCourseChecklist(course, week = TERM.week) {
  const plannedItems = (course.weeklyPlan ?? [])
    .filter((entry) => entry.weeks.includes(week))
    .map((entry) => entry.item)

  return [...new Set([...course.weeklyItems, ...plannedItems, ...course.customTrackers])]
}

export function getWeekCompletion(course, week, weeklyState) {
  const items = getCourseChecklist(course, week)
  const courseWeek = weeklyState[course.id]?.[week] ?? {}
  const completed = items.filter((item) => courseWeek[item]).length

  return {
    total: items.length,
    completed,
    percent: items.length ? Math.round((completed / items.length) * 100) : 0,
  }
}

export function getCourseProgress(course, weeklyState) {
  let total = 0
  let completed = 0

  for (let week = 1; week <= TERM.totalWeeks; week += 1) {
    const items = getCourseChecklist(course, week)
    const courseWeek = weeklyState[course.id]?.[week] ?? {}
    total += items.length
    items.forEach((item) => {
      if (courseWeek[item]) {
        completed += 1
      }
    })
  }

  const percent = total ? Math.round((completed / total) * 100) : 0
  const ideal = Math.round((TERM.week / TERM.totalWeeks) * 100)

  let status = 'On Track'
  if (percent >= ideal + 10) {
    status = 'Ahead'
  } else if (percent <= ideal - 30) {
    status = 'Critical'
  } else if (percent <= ideal - 12) {
    status = 'Behind'
  }

  return { total, completed, percent, ideal, status }
}

export function getOverallWeekProgress(courses, week, weeklyState) {
  let total = 0
  let completed = 0

  courses.forEach((course) => {
    const result = getWeekCompletion(course, week, weeklyState)
    total += result.total
    completed += result.completed
  })

  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
  }
}

export function getDashboardSummary(
  courses,
  weeklyState,
  gradesState,
  deadlineState,
  extraEvents = [],
) {
  const currentWeek = TERM.week
  const weekProgress = getOverallWeekProgress(courses, currentWeek, weeklyState)
  const upcoming = getUpcomingDeadlines(courses, extraEvents)
  const pendingPast = getPastDeadlines(courses, extraEvents).filter((item) => !deadlineState[item.id])
  const atRisk = courses.filter((course) => {
    const result = calculateCourse(course, gradesState[course.id] ?? {})
    return result.score !== null && !result.eligibility.eligible && !result.eligibility.pending
  })
  const behind = courses.filter((course) => {
    const status = getCourseProgress(course, weeklyState).status
    return status === 'Behind' || status === 'Critical'
  })


  const stableAreas = []
  const improvementAreas = []

  if (weekProgress.percent >= 70) {
    stableAreas.push(`Weekly completion is ${weekProgress.percent}% for the current week.`)
  } else if (weekProgress.percent >= 45) {
    stableAreas.push(`Weekly completion is ${weekProgress.percent}%. You are moving, but there is not much buffer.`)
  } else {
    improvementAreas.push(`Weekly completion is only ${weekProgress.percent}%. Close the checklist gap earlier in the week.`)
  }

  if (!atRisk.length) {
    stableAreas.push('No active eligibility warnings from the scores entered so far.')
  } else {
    improvementAreas.push(`Eligibility risk: ${atRisk.map((course) => course.shortName).join(', ')}.`)
  }

  if (upcoming.length) {
    const nextItem = upcoming[0]
    improvementAreas.push(
      `Next pressure point: ${nextItem.label} on ${formatDate(nextItem.date)} for ${nextItem.courses
        .map((course) => course.name)
        .join(', ')}.`,
    )
  }

  if (pendingPast.length) {
    improvementAreas.push(
      `${pendingPast.length} past milestone${pendingPast.length > 1 ? 's are' : ' is'} still unchecked. Mark them done or review what slipped.`,
    )
  }

  if (behind.length) {
    improvementAreas.push(`Progress is trailing in ${behind.map((course) => course.shortName).join(', ')}.`)
  }



  if (!stableAreas.length) {
    stableAreas.push('No strong buffer yet. Tighten execution this week to create breathing room.')
  }

  if (!improvementAreas.length) {
    improvementAreas.push('Keep clearing videos and checklist items before the earliest session or deadline each week.')
  }

  const headline =
    improvementAreas.length > 2
      ? 'You are still in catch-up mode.'
      : weekProgress.percent >= 70 && !atRisk.length
        ? 'The tracker looks stable.'
        : 'You are close, but the buffer is thin.'

  return {
    headline,
    stableAreas: stableAreas.slice(0, 2),
    improvementAreas: improvementAreas.slice(0, 4),
  }
}

export function getAnalyticsSeries(courses, weeklyState) {
  return Array.from({ length: TERM.totalWeeks }, (_, index) => {
    const week = index + 1
    const actual = getOverallWeekProgress(courses, week, weeklyState).percent
    const ideal = Math.round((week / TERM.totalWeeks) * 100)
    return { week, actual, ideal }
  })
}

export function getStoragePayload(
  courses,
  weeklyState,
  gradesState,
  scenarioState,
  selectedWeek,
  deadlineState,
  sessionWatchState,
  setupState,
  configId,
  customTermPacks,
) {
  return JSON.stringify({
    configId,
    setupState,
    courses,
    weeklyState,
    gradesState,
    scenarioState,
    selectedWeek,
    deadlineState,
    sessionWatchState,
    customTermPacks,
  })
}
