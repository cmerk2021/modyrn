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
    // `consistent-type-imports` conflicts with Nest's constructor-based DI:
    // provider types used only as constructor parameters must remain *value*
    // imports so `emitDecoratorMetadata` can resolve them at runtime. Using
    // `import type` here would erase them and break dependency injection.
    '@typescript-eslint/consistent-type-imports': 'off',
  },
});
