import base from './base.js';
import tseslint from 'typescript-eslint';

/** ESLint config tuned for NestJS backend services. */
export default tseslint.config(...base, {
  rules: {
    // Nest relies heavily on decorators and DI metadata.
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
});
