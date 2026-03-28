export const OFFICIAL_ACADEMICS_URL = 'https://study.iitm.ac.in/es/academics.html#AC1'

const foundationCourses = [
  { code: 'HS1101', name: 'English I', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'MA1101', name: 'Math for Electronics I', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'HS1102', name: 'English II', credits: 4, prerequisites: 'HS1101', corequisites: 'None' },
  { code: 'EE1101', name: 'Electronic Systems Thinking and Circuits', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE1901', name: 'Electronic Systems Thinking and Circuits Lab', credits: 1, prerequisites: 'None', corequisites: 'EE1101' },
  { code: 'CS1101', name: 'Introduction to C Programming', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'CS1901', name: 'C Programming Laboratory', credits: 1, prerequisites: 'None', corequisites: 'CS1101' },
  { code: 'CS1102', name: 'Introduction to Linux and Programming', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'CS1902', name: 'Linux Systems Laboratory', credits: 1, prerequisites: 'None', corequisites: 'CS1102' },
  { code: 'EE1102', name: 'Digital Systems', credits: 4, prerequisites: 'CS1101', corequisites: 'None' },
  { code: 'EE1103', name: 'Electrical and Electronic Circuits', credits: 4, prerequisites: 'EE1101 and MA1101', corequisites: 'None' },
  { code: 'EE1902', name: 'Electronics Laboratory', credits: 3, prerequisites: 'EE1901', corequisites: 'EE1103 and EE1102' },
  { code: 'CS2101', name: 'Embedded C Programming', credits: 4, prerequisites: 'CS1101', corequisites: 'None' },
  { code: 'CS2901', name: 'Embedded C Programming Laboratory', credits: 1, prerequisites: 'None', corequisites: 'CS1901 and CS2101' },
]

const diplomaCourses = [
  { code: 'EE2101', name: 'Signals and Systems', credits: 4, prerequisites: 'EE1103', corequisites: 'None' },
  { code: 'EE2102', name: 'Analog Electronic Systems', credits: 4, prerequisites: 'EE2101', corequisites: 'None' },
  { code: 'EE2901', name: 'Analog Electronics Laboratory', credits: 3, prerequisites: 'None', corequisites: 'EE2102' },
  { code: 'CS1002', name: 'Python Programming', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE2103', name: 'Digital System Design', credits: 4, prerequisites: 'EE1102', corequisites: 'None' },
  { code: 'EE2902', name: 'Digital System Design Laboratory', credits: 1, prerequisites: 'EE1902', corequisites: 'EE2103' },
  { code: 'EE3101', name: 'Digital Signal Processing', credits: 4, prerequisites: 'EE2101', corequisites: 'None' },
  { code: 'EE3103', name: 'Sensors and Applications', credits: 4, prerequisites: 'EE2102', corequisites: 'None' },
  { code: 'EE3901', name: 'Sensors Laboratory', credits: 3, prerequisites: 'EE2901', corequisites: 'EE3103' },
  { code: 'EE4108', name: 'Electronic Testing and Measurement', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE4104', name: 'Computer Organisation', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE3999', name: 'Electronics System Project', credits: 2, prerequisites: '-', corequisites: 'EE2901, EE3901' },
  { code: 'EE4999', name: 'Signals and Systems Project', credits: 2, prerequisites: '-', corequisites: 'EE2101, EE3101' },
]

const degreeCoreCourses = [
  { code: 'MA2101', name: 'Math for Electronics II', credits: 4, prerequisites: 'MA1101', corequisites: 'None' },
  { code: 'EE4101', name: 'Embedded Linux and FPGAs', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE4901', name: 'Embedded Linux and FPGAs Lab', credits: 1, prerequisites: 'None', corequisites: 'EE4101' },
  { code: 'EE3104', name: 'Electromagnetic Fields and Transmission Lines', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE4102', name: 'Electronic Product Design', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'GN3001', name: 'Strategies for Professional Growth', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE3102', name: 'Control Engineering', credits: 4, prerequisites: 'EE2101', corequisites: 'None' },
]

const degreeDepartmentElectives = [
  { code: 'MA3101', name: 'Probability and Statistics', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE4103', name: 'Communication Systems', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE5101', name: 'Internet of Things (IoT)', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE3106', name: 'Semiconductor Devices and VLSI Technology', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE3107', name: 'Analog Circuits', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE5102', name: 'Digital IC Design', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE5103', name: 'Power Management for Electronic Systems', credits: 4, prerequisites: 'None', corequisites: 'None' },
  { code: 'EE5104', name: 'Biomedical Electronic Systems', credits: 4, prerequisites: 'None', corequisites: 'None' },
]

const degreeOpenElectives = [
  { code: 'CS4022', name: 'Operating Systems', credits: 4 },
  { code: 'CS2001', name: 'Database Management Systems (DBMS)', credits: 4 },
  { code: 'CS2002', name: 'Programming Data Structures and Algorithms using Python', credits: 4 },
  { code: 'CS2003', name: 'Modern Application Development I', credits: 4 },
  { code: 'CS2004', name: 'Machine Learning Foundation', credits: 4 },
  { code: 'CS2005', name: 'Programming Concepts using Java', credits: 4 },
  { code: 'CS2006', name: 'Modern Application Development II', credits: 4 },
  { code: 'CS2007', name: 'Machine Learning Techniques', credits: 4 },
  { code: 'CS2008', name: 'Machine Learning Practice', credits: 4 },
  { code: 'CS3004', name: 'Deep Learning', credits: 4 },
  { code: 'CS5003', name: 'Deep Learning for Computer Vision', credits: 4 },
  { code: 'EE4001', name: 'Speech Technology', credits: 4 },
  { code: 'DA5013', name: 'Deep Learning Practice', credits: 4 },
  { code: 'MS4001', name: 'Industry 4.0', credits: 4 },
  { code: 'MS4002', name: 'Design Thinking for Data-Driven App Development', credits: 4 },
  { code: 'GN3002', name: 'Financial Forensics', credits: 4 },
  { code: 'MS3002', name: 'Market Research', credits: 4 },
  { code: 'MS4023', name: 'Game Theory and Strategy', credits: 4 },
  { code: 'MS3033', name: 'Managerial Economics', credits: 4 },
  { code: 'MS3034', name: 'Corporate Finance', credits: 4 },
  { code: 'EE4902', name: 'Apprenticeship in Electronics Systems 1', credits: 4 },
  { code: 'EE4903', name: 'Apprenticeship in Electronics Systems 2', credits: 4 },
]

export const PROGRAM_LEVELS = [
  {
    id: 'foundation',
    label: 'Foundation',
    icon: 'F',
    tag: '43 credits · 9 Theory + 5 Labs',
    duration: '1 - 3 years',
    weeklyCommitment: '10 hrs/course/week',
    fee: 'Rs. 82,000',
    exitAward: 'Foundation Certificate in Electronic Systems',
    progression: 'Learners who clear the Qualifier Exam can register at this level, and completing all 14 courses lets them proceed to Diploma.',
    description: 'The official foundation curriculum covers English, math, circuits, C, Linux, digital systems, embedded C, and the associated labs.',
    courseGroups: [
      {
        id: 'foundation-courses',
        label: 'Official course list',
        selectionRule: '14 required courses',
        courses: foundationCourses,
      },
    ],
  },
  {
    id: 'diploma',
    label: 'Diploma',
    icon: 'D',
    tag: '43 credits · 8 Theory + 3 Labs + 2 Projects',
    duration: '1 - 3 years',
    weeklyCommitment: '10 hrs/course/week',
    fee: 'Rs. 1,62,000',
    exitAward: 'Diploma in Electronic Systems',
    progression: 'After completing Foundation and Diploma, learners can continue to the BS Degree level or exit with the Diploma.',
    description: 'The diploma curriculum adds signals, analog and digital design, DSP, sensors, testing, computer organisation, and two project courses.',
    courseGroups: [
      {
        id: 'diploma-courses',
        label: 'Official course list',
        selectionRule: '13 required courses',
        courses: diplomaCourses,
      },
    ],
  },
  {
    id: 'degree',
    label: 'BS Degree',
    icon: 'BS',
    tag: '56 credits · 12 courses + 1 Lab + Apprenticeship (optional)',
    duration: '1 - 3 years',
    weeklyCommitment: '10 hrs/course/week',
    fee: 'Rs. 3,36,000',
    exitAward: 'BS Degree in Electronic Systems',
    progression: 'Learners need 142 total credits across all levels to graduate. The degree level combines core courses, department electives, open electives, and an optional apprenticeship.',
    description: 'The official degree structure covers control, electromagnetic fields, product design, embedded Linux and FPGAs, professional growth, electives, and optional apprenticeship credits.',
    note: 'The official page says Degree students choose 5 department electives from a list of 9, but the page lists 8 named department electives as of March 28, 2026.',
    courseGroups: [
      {
        id: 'degree-core',
        label: 'Core courses',
        selectionRule: 'All core courses required',
        courses: degreeCoreCourses,
      },
      {
        id: 'degree-dept-electives',
        label: 'Department electives',
        selectionRule: 'Choose 5',
        courses: degreeDepartmentElectives,
      },
      {
        id: 'degree-open-electives',
        label: 'Open electives',
        selectionRule: 'Choose from the listed electives',
        courses: degreeOpenElectives,
      },
    ],
  },
]

export function getProgramLevelById(levelId) {
  return PROGRAM_LEVELS.find((level) => level.id === levelId) ?? PROGRAM_LEVELS[0]
}
