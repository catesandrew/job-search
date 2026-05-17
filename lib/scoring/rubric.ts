export const RUBRIC = {
  impact: {
    weight: 0.2,
    description: 'Quantified outcomes and concrete business or technical impact.',
  },
  seniorityPlatformSignal: {
    weight: 0.2,
    description:
      'Staff/Principal-level architecture, platform, cross-team, and technical leadership signal.',
  },
  atsReadability: {
    weight: 0.15,
    description:
      'Clear standard resume sections, role titles, dates, and searchable technology keywords.',
  },
  sourceFidelity: {
    weight: 0.15,
    description:
      'Claims are source-backed and avoid unsupported or extraction-corrupted wording.',
  },
  modernity: {
    weight: 0.1,
    description:
      'Modern platform, frontend, mobile, cloud, and delivery terminology.',
  },
  chronologyConsistency: {
    weight: 0.1,
    description:
      'Current and prior roles have coherent date ranges without stale Present conflicts.',
  },
  concision: {
    weight: 0.1,
    description: 'Focused content with limited repetition and readable bullet volume.',
  },
} as const
