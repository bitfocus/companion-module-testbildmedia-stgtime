import type { JsonObject } from '@companion-module/base'

export interface ModuleConfig extends JsonObject {
	host: string
	port: number
	pollInterval: number
}

export interface ModuleSecrets extends JsonObject {
	apiToken: string
}

export interface StgtimeTimerState {
	mode: 'countdown' | 'stopwatch'
	running: boolean
	durationMs: number
	valueMs: number
	remainingMs: number
	continueNegative: boolean
}

export interface StgtimeState {
	timer: StgtimeTimerState
	display: { driver: string; available: boolean; error?: string | null }
	message: { visible: boolean; text: string; color: string }
	video: { visible: boolean; label: string; remainingMs: number; durationMs: number; color?: string }
	system: { version: string; uptimeMs: number; addresses: Array<{ interface: string; address: string }> }
}

export interface StgtimeConfig {
	display: { brightness: number; format: 'HH:MM:SS' | 'MM:SS'; clockVisible: boolean }
	timer: {
		blinkAtEnd: boolean
		colors: { normal: string; warning: string; critical: string }
		thresholdsMs: { warning: number; critical: number }
	}
	presets: Array<{ id: string; name: string; durationMs: number; thresholdsMs?: { warning: number; critical: number } }>
}

export type TimeState = 'enough' | 'warning' | 'critical' | 'expired'

export function formatTime(milliseconds: number, showHours = true): string {
	const sign = milliseconds < 0 ? '-' : ''
	const total = Math.floor(Math.abs(milliseconds) / 1000)
	const hours = Math.floor(total / 3600)
	const minutes = showHours ? Math.floor((total % 3600) / 60) : Math.floor(total / 60)
	const seconds = total % 60
	return showHours
		? `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
		: `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function timerTimeState(state: StgtimeState | null, config: StgtimeConfig | null): TimeState {
	if (!state || !config || state.timer.mode !== 'countdown') return 'enough'
	if (state.timer.valueMs <= 0) return 'expired'
	if (state.timer.valueMs <= config.timer.thresholdsMs.critical) return 'critical'
	if (state.timer.valueMs <= config.timer.thresholdsMs.warning) return 'warning'
	return 'enough'
}
