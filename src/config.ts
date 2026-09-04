import type { SomeCompanionConfigField } from '@companion-module/base'
import type { ModuleConfig } from './types.js'

export function getConfigFields(): SomeCompanionConfigField[] {
	return [
		{ type: 'textinput', id: 'host', label: 'STGTIME host or IP address', width: 8, default: 'stgtime.local' },
		{ type: 'number', id: 'port', label: 'HTTP port', width: 4, min: 1, max: 65535, default: 80 },
		{ type: 'secret-text', id: 'apiToken', label: 'Device API token', width: 12, default: '' },
		{
			type: 'dropdown',
			id: 'pollInterval',
			label: 'Polling interval',
			width: 6,
			default: 500,
			choices: [
				{ id: 250, label: '250 ms' },
				{ id: 500, label: '500 ms (recommended)' },
				{ id: 1000, label: '1 second' },
				{ id: 2000, label: '2 seconds' },
			],
		},
	]
}

export function normalizeConfig(config: ModuleConfig): ModuleConfig {
	return {
		host: String(config.host || 'stgtime.local')
			.trim()
			.replace(/^https?:\/\//i, '')
			.replace(/\/+$/, ''),
		port: Math.min(65535, Math.max(1, Number(config.port) || 80)),
		pollInterval: [250, 500, 1000, 2000].includes(Number(config.pollInterval)) ? Number(config.pollInterval) : 500,
	}
}
