/**
 * When typescript eslint will support new eslint flat config, we will be able to put this file into a seperate
 * ecmascript module. However requiring it does not work as require implies node context. So impossible to do it
 * for now
 */

/**
 * @type {import('eslint').Linter.Config['rules']}
 */
const silencedRules = {
	'@typescript-eslint/no-namespace': 'off', // We want to be able to use namespace
	'no-redeclare': 'off' // We want to allow types and variables with same names
};

/**
 * @type {import('eslint').Linter.ParserOptions}
 */
const javascriptBaseParserOptions = {
	ecmaVersion: 'latest',
	ecmaFeatures: { impliedStrict: true }
};

/**
 * @type {import('eslint').Linter.BaseConfig['extends']}
 */
const javascriptBaseExtends = ['eslint:recommended', 'prettier'];

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
	// Same rules as .gitignore
	ignorePatterns: ['dist/'],
	root: true,
	// env is set globally because it needs to be extended and it does not disturb non
	// javascript parsers
	env: {
		es2024: true
	},
	overrides: [
		{
			files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts'],
			overrides: [
				{
					files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
					extends: javascriptBaseExtends
				},
				{
					files: ['**/*.cjs'],
					parserOptions: {
						...javascriptBaseParserOptions,
						sourceType: 'script'
					}
				},
				{
					files: ['**/*.js', '**/*.mjs'],
					parserOptions: {
						...javascriptBaseParserOptions,
						sourceType: 'module'
					}
				},
				{
					files: ['**/*.ts'],
					// eslint-recommended must come before 'plugin:@typescript-eslint/strict-type-checked'
					// because the second turns off rules of the first.
					extends: [
						'eslint:recommended',
						'plugin:@typescript-eslint/strict-type-checked',
						'prettier'
					],
					parser: '@typescript-eslint/parser',
					plugins: ['@typescript-eslint'],
					parserOptions: { project: true }
				},
				{
					files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts'],
					rules: silencedRules
				}
			]
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
