import type ModuleInstance from './main.js'
import { timerTimeState } from './types.js'

export type FeedbacksSchema = {
	display_image: { type: 'value'; options: Record<string, never> }
	connected: { type: 'boolean'; options: Record<string, never> }
	timer_running: { type: 'boolean'; options: { expected: boolean } }
	timer_mode: { type: 'boolean'; options: { mode: string } }
	timer_state: { type: 'boolean'; options: { state: string } }
	message_visible: { type: 'boolean'; options: { expected: boolean } }
	video_visible: { type: 'boolean'; options: { expected: boolean } }
	display_available: { type: 'boolean'; options: { expected: boolean } }
}

const expectedOptions = [{ type: 'checkbox' as const, id: 'expected' as const, label: 'Expected state', default: true }]

export function updateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		display_image: {
			name: 'Live display image',
			type: 'value',
			options: [],
			callback: () => (self.displayPng64 ? `data:image/png;base64,${self.displayPng64}` : ''),
		},
		connected: {
			name: 'Device is connected',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x006b38, color: 0xffffff },
			options: [],
			callback: () => self.connected,
		},
		timer_running: {
			name: 'Timer running state',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x006b38, color: 0xffffff },
			options: expectedOptions,
			callback: (feedback) => Boolean(self.deviceState?.timer.running) === feedback.options.expected,
		},
		timer_mode: {
			name: 'Timer mode',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x174a73, color: 0xffffff },
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
			callback: (feedback) => self.deviceState?.timer.mode === feedback.options.mode,
		},
		timer_state: {
			name: 'Timer threshold state',
			type: 'boolean',
			defaultStyle: { bgcolor: 0xff0000, color: 0xffffff },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'State',
					default: 'critical',
					choices: [
						{ id: 'enough', label: 'Enough time' },
						{ id: 'warning', label: 'Warning' },
						{ id: 'critical', label: 'Critical' },
						{ id: 'expired', label: 'Expired / overtime' },
					],
				},
			],
			callback: (feedback) => timerTimeState(self.deviceState, self.deviceConfig) === feedback.options.state,
		},
		message_visible: {
			name: 'Message visibility',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x6c4b00, color: 0xffffff },
			options: expectedOptions,
			callback: (feedback) => Boolean(self.deviceState?.message.visible) === feedback.options.expected,
		},
		video_visible: {
			name: 'Video visibility',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x174a73, color: 0xffffff },
			options: expectedOptions,
			callback: (feedback) => Boolean(self.deviceState?.video.visible) === feedback.options.expected,
		},
		display_available: {
			name: 'HUB75 display availability',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x006b38, color: 0xffffff },
			options: expectedOptions,
			callback: (feedback) => Boolean(self.deviceState?.display.available) === feedback.options.expected,
		},
	})
}
