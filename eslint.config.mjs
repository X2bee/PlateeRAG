// @ts-check

import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import prettierConfig from 'eslint-config-prettier';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

export default tseslint.config(
    { ignores: ['node_modules/', '.next/'] },

    eslint.configs.recommended,
    ...tseslint.configs.recommended,

    ...compat.extends(
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'next/core-web-vitals',
    ),

    {
        files: ['src/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react-hooks/rules-of-hooks': 'off',
            'react/no-unescaped-entities': 'warn',
            'jsx-a11y/no-noninteractive-tabindex': 'warn',
            'jsx-a11y/label-has-associated-control': 'warn',
            'jsx-a11y/anchor-is-valid': 'warn',
            'jsx-a11y/no-static-element-interactions': 'warn',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/mouse-events-have-key-events': 'warn',
            'jsx-a11y/no-autofocus': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            //TODO 아래 두개 추가했는데, 문제 없는지 확인. 
            'react-hooks/exhaustive-deps': 'warn',
            'no-useless-escape': 'warn',
        },
    },

    prettierConfig,
);
