/**
 * Progressive complexity modes.
 *
 * Modyrn adapts the amount of configuration it exposes to the size and needs of
 * a community. This is one of the defining principles of the platform.
 */
export const ComplexityMode = {
  /** Sane defaults, minimal surface: welcome, mod log, automod presets, warnings, reaction roles. */
  Simple: 'simple',
  /** Granular moderation, detailed logging, custom durations, role config, utilities. */
  Advanced: 'advanced',
  /** Everything: visual automod builder, emergency center, analytics, workflows, webhooks, API. */
  Expert: 'expert',
} as const;

export type ComplexityMode = (typeof ComplexityMode)[keyof typeof ComplexityMode];

export const COMPLEXITY_MODES = Object.values(ComplexityMode);

/** Ordered from least to most complex. Used to gate feature visibility. */
export const COMPLEXITY_ORDER: readonly ComplexityMode[] = [
  ComplexityMode.Simple,
  ComplexityMode.Advanced,
  ComplexityMode.Expert,
];

/**
 * Returns true when the active mode meets or exceeds the required mode.
 *
 * @example
 * meetsComplexity('expert', 'advanced') // true — an expert user sees advanced features
 * meetsComplexity('simple', 'advanced') // false
 */
export function meetsComplexity(active: ComplexityMode, required: ComplexityMode): boolean {
  return COMPLEXITY_ORDER.indexOf(active) >= COMPLEXITY_ORDER.indexOf(required);
}

export const COMPLEXITY_METADATA: Record<
  ComplexityMode,
  { label: string; description: string }
> = {
  [ComplexityMode.Simple]: {
    label: 'Simple',
    description: 'Sane defaults and the essentials. Perfect for small communities.',
  },
  [ComplexityMode.Advanced]: {
    label: 'Advanced',
    description: 'Granular moderation, detailed logging and full role configuration.',
  },
  [ComplexityMode.Expert]: {
    label: 'Expert',
    description: 'The complete toolkit: visual automod, analytics, workflows and more.',
  },
};
