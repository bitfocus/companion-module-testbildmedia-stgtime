import type ModuleInstance from './main.js'

export type VariablesSchema = {
	connected: boolean
	timer: string
	timer_value_ms: number
	timer_duration: string
	timer_duration_ms: number
	timer_remaining_ms: number
	timer_progress_percent: number
	timer_mode: string
	timer_running: boolean
	timer_state: string
	overtime_enabled: boolean
	message_text: string
	message_visible: boolean
	video_label: string
	video_remaining: string
	video_remaining_ms: number
	video_visible: boolean
	version: string
	display_driver: string
	display_available: boolean
	ip_addresses: string
}

export function updateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions({
		connected: { name: 'Device connected' },
		timer: { name: 'Formatted timer value' },
		timer_value_ms: { name: 'Timer value in milliseconds' },
		timer_duration: { name: 'Formatted timer duration' },
		timer_duration_ms: { name: 'Timer duration in milliseconds' },
		timer_remaining_ms: { name: 'Remaining time in milliseconds' },
		timer_progress_percent: { name: 'Timer progress percent' },
		timer_mode: { name: 'Timer mode' },
		timer_running: { name: 'Timer is running' },
		timer_state: { name: 'Timer color state' },
		overtime_enabled: { name: 'Negative overtime enabled' },
		message_text: { name: 'Message text' },
		message_visible: { name: 'Message is visible' },
		video_label: { name: 'Video label' },
		video_remaining: { name: 'Formatted video remaining time' },
		video_remaining_ms: { name: 'Video remaining time in milliseconds' },
		video_visible: { name: 'Video area is visible' },
		version: { name: 'STGTIME software version' },
		display_driver: { name: 'Display driver' },
		display_available: { name: 'Display is available' },
		ip_addresses: { name: 'Device IP addresses' },
	})
}
