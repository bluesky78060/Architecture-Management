module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  env: {
    browser: true,
    es6: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [
    {
      // JavaScript 파일용 규칙 (TypeScript 규칙 완전 비활성화)
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        'no-unused-vars': 'warn',
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
      }
    },
    {
      // TypeScript 파일용 규칙
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'react-app',
        'react-app/jest'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off', // 너무 엄격하므로 비활성화
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
      }
    }
  ],
  rules: {
    // 공통 규칙
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off'
  }
};