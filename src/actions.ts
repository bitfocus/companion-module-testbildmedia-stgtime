import type ModuleInstance from './main.js'

export type ActionsSchema = {
	timer_transport: { options: { operation: string } }
	set_mode: { options: { mode: string } }
	set_time: { options: { hours: number; minutes: number; seconds: number; start: boolean } }
	adjust_time: { options: { amount: number; unit: number } }
	set_overtime: { options: { enabled: boolean } }
	set_timer_appearance: {
		options: {
			warning_seconds: string
			critical_seconds: string
			enough_color: string
			warning_color: string
			critical_color: string
			blink_at_end: boolean
		}
	}
	load_preset: { options: { preset_id: string } }
	set_message: { options: { text: string; color: string; visible: boolean } }
	message_visibility: { options: { operation: string } }
	set_video: {
		options: { label: string; remaining_seconds: string; duration_seconds: string; color: string; visible: boolean }
	}
	video_visibility: { options: { operation: string } }
	set_display: { options: { brightness: number; clock_visible: boolean; clock_color: string; time_format: string } }
}

const transportChoices = [
	{ id: 'start', label: 'Start' },
	{ id: 'stop', label: 'Stop' },
	{ id: 'toggle', label: 'Toggle start/stop' },
	{ id: 'reset', label: 'Reset' },
]

const colorField = <T extends string>(id: T, label: string, defaultValue: string) => ({
	type: 'textinput' as const,
	id,
	label,
	default: defaultValue,
	regex: '/^#[0-9a-fA-F]{6}$/',
})

function resolveText(value: string): string {
	return String(value ?? '')
}

function resolveSeconds(value: string, label: string): number {
	const resolved = resolveText(value)
	const seconds = Number(resolved)
	if (!Number.isFinite(seconds) || seconds < 0) throw new Error(`${label} must resolve to a non-negative number`)
	return seconds
}

function resolveColor(value: string, label: string): string {
	const color = resolveText(value)
	if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error(`${label} must resolve to a six-digit hex color`)
	return color
}

export function updateActions(self: ModuleInstance): void {
	const presetChoices = (self.deviceConfig?.presets || []).map((preset) => ({ id: preset.id, label: preset.name }))
	if (!presetChoices.length) presetChoices.push({ id: '', label: 'No presets available' })
	self.setActionDefinitions({
		timer_transport: {
			name: 'Timer: Transport',
			options: [
				{ type: 'dropdown', id: 'operation', label: 'Operation', default: 'toggle', choices: transportChoices },
			],
			callback: async (event) => self.send('/timer/action', 'POST', { action: event.options.operation }),
		},
		set_mode: {
			name: 'Timer: Set mode',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'countdown',
					choices: [
						{ id: 'countdown', label: 'Countdown' },
						{ id: 'stopwatch', label: 'Stopwatch' },
					],
				},
			],
			callback: async (event) => self.send('/timer', 'PUT', { mode: event.options.mode }),
		},
		set_time: {
			name: 'Timer: Set time',
			options: [
				{ type: 'number', id: 'hours', label: 'Hours', default: 0, min: 0, max: 99 },
				{ type: 'number', id: 'minutes', label: 'Minutes', default: 10, min: 0, max: 59 },
				{ type: 'number', id: 'seconds', label: 'Seconds', default: 0, min: 0, max: 59 },
				{ type: 'checkbox', id: 'start', label: 'Start immediately', default: false },
			],
			callback: async (event) => {
				const durationMs =
					(Number(event.options.hours) * 3600 + Number(event.options.minutes) * 60 + Number(event.options.seconds)) *
					1000
				await self.send('/timer', 'PUT', { durationMs }, false)
				if (event.options.start) await self.send('/timer/action', 'POST', { action: 'start' })
				else await self.poll()
			},
		},
		adjust_time: {
			name: 'Timer: Adjust time',
			options: [
				{ type: 'number', id: 'amount', label: 'Amount (negative subtracts)', default: 1, min: -86400, max: 86400 },
				{
					type: 'dropdown',
					id: 'unit',
					label: 'Unit',
					default: 60000,
					choices: [
						{ id: 1000, label: 'Seconds' },
						{ id: 60000, label: 'Minutes' },
					],
				},
			],
			callback: async (event) =>
				self.send('/timer', 'PUT', { jogMs: Number(event.options.amount) * Number(event.options.unit) }),
		},
		set_overtime: {
			name: 'Timer: Set negative overtime',
			options: [{ type: 'checkbox', id: 'enabled', label: 'Continue below zero', default: true }],
			callback: async (event) => self.send('/timer', 'PUT', { continueNegative: event.options.enabled }),
		},
		set_timer_appearance: {
			name: 'Timer: Set thresholds and colors',
			options: [
				{
					type: 'textinput',
					id: 'warning_seconds',
					label: 'Warning threshold in seconds (variables allowed)',
					default: '120',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'critical_seconds',
					label: 'Critical threshold in seconds (variables allowed)',
					default: '60',
					useVariables: true,
				},
				colorField('enough_color', 'Enough-time color', '#00ff00'),
				colorField('warning_color', 'Warning color', '#ffd000'),
				colorField('critical_color', 'Critical color', '#ff0000'),
				{ type: 'checkbox', id: 'blink_at_end', label: 'Blink at zero / in overtime', default: true },
			],
			callback: async (event) => {
				const warning = resolveSeconds(event.options.warning_seconds, 'Warning threshold')
				const critical = resolveSeconds(event.options.critical_seconds, 'Critical threshold')
				if (critical > warning) throw new Error('Critical threshold must not exceed warning threshold')
				await self.send('/config', 'PUT', {
					timer: {
						thresholdsMs: { warning: warning * 1000, critical: critical * 1000 },
						colors: {
							normal: resolveColor(event.options.enough_color, 'Enough-time color'),
							warning: resolveColor(event.options.warning_color, 'Warning color'),
							critical: resolveColor(event.options.critical_color, 'Critical color'),
						},
						blinkAtEnd: event.options.blink_at_end,
					},
				})
			},
		},
		load_preset: {
			name: 'Timer: Load STGTIME preset',
			options: [
				{
					type: 'dropdown',
					id: 'preset_id',
					label: 'Preset',
					default: presetChoices[0]?.id || '',
					choices: presetChoices,
				},
			],
			callback: async (event) => {
				if (!event.options.preset_id) throw new Error('No STGTIME preset is available')
				await self.send(`/presets/${encodeURIComponent(event.options.preset_id)}`, 'POST')
			},
		},
		set_message: {
			name: 'Message: Set content',
			options: [
				{
					type: 'textinput',
					id: 'text',
					label: 'Message (maximum 64 characters; variables allowed)',
					default: '',
					useVariables: true,
				},
				colorField('color', 'Color (hex)', '#ffffff'),
				{ type: 'checkbox', id: 'visible', label: 'Show message', default: true },
			],
			callback: async (event) => {
				await self.send('/message', 'PUT', {
					text: resolveText(event.options.text),
					color: resolveColor(event.options.color, 'Message color'),
					visible: event.options.visible,
				})
			},
		},
		message_visibility: {
			name: 'Message: Visibility',
			options: [
				{
					type: 'dropdown',
					id: 'operation',
					label: 'Operation',
					default: 'toggle',
					choices: [
						{ id: 'show', label: 'Show' },
						{ id: 'hide', label: 'Hide' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: async (event) => {
				const visible =
					event.options.operation === 'toggle' ? !self.deviceState?.message.visible : event.options.operation === 'show'
				await self.send('/message', 'PUT', { visible })
			},
		},
		set_video: {
			name: 'Video: Set state',
			options: [
				{
					type: 'textinput',
					id: 'label',
					label: 'Label (maximum 8 characters; variables allowed)',
					default: 'VIDEO',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'remaining_seconds',
					label: 'Remaining seconds (variables allowed)',
					default: '0',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'duration_seconds',
					label: 'Duration seconds (variables allowed)',
					default: '0',
					useVariables: true,
				},
				colorField('color', 'Video color', '#00ff48'),
				{ type: 'checkbox', id: 'visible', label: 'Show video state', default: true },
			],
			callback: async (event) => {
				await self.send('/video', 'PUT', {
					label: resolveText(event.options.label),
					remainingMs: resolveSeconds(event.options.remaining_seconds, 'Remaining time') * 1000,
					durationMs: resolveSeconds(event.options.duration_seconds, 'Duration') * 1000,
					color: resolveColor(event.options.color, 'Video color'),
					visible: event.options.visible,
				})
			},
		},
		video_visibility: {
			name: 'Video: Visibility',
			options: [
				{
					type: 'dropdown',
					id: 'operation',
					label: 'Operation',
					default: 'toggle',
					choices: [
						{ id: 'show', label: 'Show' },
						{ id: 'hide', label: 'Hide' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: async (event) => {
				const visible =
					event.options.operation === 'toggle' ? !self.deviceState?.video.visible : event.options.operation === 'show'
				await self.send('/video', 'PUT', { ...self.deviceState?.video, visible })
			},
		},
		set_display: {
			name: 'Display: Set basic options',
			options: [
				{ type: 'number', id: 'brightness', label: 'Brightness percent', default: 85, min: 1, max: 100 },
				{ type: 'checkbox', id: 'clock_visible', label: 'Show NTP clock', default: true },
				colorField('clock_color', 'Clock color', '#ff8800'),
				{
					type: 'dropdown',
					id: 'time_format',
					label: 'Main time format',
					default: 'HH:MM:SS',
					choices: [
						{ id: 'HH:MM:SS', label: 'HH:MM:SS' },
						{ id: 'MM:SS', label: 'MM:SS' },
					],
				},
			],
			callback: async (event) =>
				self.send('/config', 'PUT', {
					display: {
						brightness: Number(event.options.brightness),
						clockVisible: event.options.clock_visible,
						clockColor: resolveColor(event.options.clock_color, 'Clock color'),
						format: event.options.time_format,
					},
				}),
		},
	})
}
