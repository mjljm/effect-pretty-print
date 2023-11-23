/**
 * When typescript eslint will support new eslint flat config, we will be able to put this file into the config repo.
 */
/* eslint-disable import/no-commonjs */

const node = false;
const browser = false;
const library = true;

/**
 * @type {import('eslint').Linter.BaseConfig['parser']}
 */
const javascriptParser = '@typescript-eslint/parser';

/**
 * @type {import('eslint').Linter.BaseConfig['settings']}
 */
const javascriptSettings = {
	'import/parsers': {
		'@typescript-eslint/parser': ['.ts', '.tsx']
	},
	'import/resolver': {
		typescript: {
			alwaysTryTypes: true
		}
	}
};

/**
 * @type {import('eslint').Linter.Config['rules']}
 */
const extraRules = {
	'@typescript-eslint/no-namespace': 'off', // We want to be able to use namespace
	'no-redeclare': 'off', // We want to allow types and variables with same names
	'codegen/codegen': 'error',
	'sort-destructure-keys/sort-destructure-keys': 2,
	'import/first': 'error',
	'import/newline-after-import': 'error',
	'import/no-relative-packages': 'error',
	'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
	'import/no-extraneous-dependencies': [
		'error',
		{
			devDependencies: false,
			optionalDependencies: false,
			peerDependencies: false
		}
	],
	'import/no-import-module-exports': 'error',
	'import/no-self-import': 'error',
	'import/extensions': ['error', 'never'],
	'import/no-empty-named-blocks': 'error',
	'import/no-amd': 'error',
	'import/no-commonjs': 'error',
	'import/no-unresolved': 'error',
	'import/no-duplicates': 'error'
};

/**
 * @type {import('eslint').Linter.ParserOptions}
 */
const javascriptParserOptions = {
	ecmaVersion: 'latest',
	ecmaFeatures: { impliedStrict: true },
	project: true,
	tsConfigRootDir: './tsconfig.json'
};

/**
 * @type {import('eslint').Linter.BaseConfig['extends']}
 */
const javascriptExtends = [
	'eslint:recommended',
	'plugin:import/recommended',
	'plugin:import/typescript',
	'plugin:deprecation/recommended',
	'plugin:@typescript-eslint/recommended-type-checked',
	'prettier'
];

/**
 * @type {import('eslint').Linter.BaseConfig['plugins']}
 */
const javascriptPlugins = ['codegen', 'sort-destructure-keys'];

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
	// Same rules as in .gitignore
	ignorePatterns: ['dist/'],
	root: true,
	overrides: [
		{
			files: ['**/*.js', '**/*.mjs', '**/*.ts'],
			parser: javascriptParser,
			settings: javascriptSettings,
			extends: javascriptExtends,
			parserOptions: {
				...javascriptParserOptions,
				sourceType: 'module'
			},
			plugins: javascriptPlugins,
			rules: extraRules,
			env: {
				es2024: true,
				node,
				browser,
				['shared-node-browser']: library
			}
		},
		{
			files: ['**/*.cjs'],
			parser: javascriptParser,
			settings: javascriptSettings,
			extends: javascriptExtends,
			parserOptions: {
				...javascriptParserOptions,
				sourceType: 'script'
			},
			plugins: javascriptPlugins,
			rules: extraRules,
			env: {
				es2024: true,
				commonjs: true,
				node,
				browser,
				['shared-node-browser']: library
			}
		},
		{
			files: ['**/*.html'],
			extends: ['plugin:@html-eslint/recommended'],
			parser: '@html-eslint/parser',
			plugins: ['@html-eslint']
		},
		{
			files: ['**/*.md'],
			extends: 'plugin:markdown/recommended',
			plugins: ['markdown'],
			processor: 'markdown/markdown'
		},
		{
			files: ['*.yaml', '*.yml'],
			extends: ['plugin:yml/recommended'],
			parser: 'yaml-eslint-parser'
		}
	]
};
