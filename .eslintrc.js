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
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'react-app',
        'react-app/jest'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off', // 너무 엄격하므로 비활성화
        '@typescript-eslint/no-explicit-any': 'error', // warn → error
        '@typescript-eslint/strict-boolean-expressions': ['warn', {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false
        }],
        'no-magic-numbers': ['error', {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false
        }],
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
      }
    },
    {
      // Schedule components - temporary disable strict boolean (must be after TypeScript rules)
      files: ['src/components/schedules/**/*.ts', 'src/components/schedules/**/*.tsx'],
      rules: {
        '@typescript-eslint/strict-boolean-expressions': 'off'
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