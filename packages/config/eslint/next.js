import base from './base.js';
import tseslint from 'typescript-eslint';

/**
 * ESLint config for the Next.js dashboard.
 * Next-specific plugin rules are layered in via the app's own eslint config
 * using `next/core-web-vitals` so this stays framework-version agnostic.
 */
export default tseslint.config(...base, {
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
});
