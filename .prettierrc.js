/**
 * @type {import('prettier').Config}
 */
export default {
	useTabs: true,
	overrides: [
		{
			files: ['*.js', '*.cjs', '*.mjs', '*.ts'],
			options: {
				semi: true,
				singleQuote: true,
				trailingComma: 'none',
				printWidth: 100
			}
		}
	]
};
