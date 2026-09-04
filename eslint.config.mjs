import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

export default [
	...(await generateEslintConfig({
		enableTypescript: true,
	})),
	{
		files: ['verification/**/*.mjs'],
		rules: {
			'n/no-missing-import': 'off',
			'n/no-unpublished-import': 'off',
		},
	},
]
