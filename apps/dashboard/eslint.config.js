import base from '@modyrn/config/eslint/next';

// Next.js linting is handled by `next lint` / the Next ESLint plugin during
// build; here we apply Modyrn's shared TypeScript rules.
export default [
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
  ...base,
];
