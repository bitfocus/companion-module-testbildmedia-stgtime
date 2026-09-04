import {
	ButtonGraphicsDecorationType,
	ButtonGraphicsShowStatusIcons,
	type CompanionLayeredButtonPresetDefinition,
	type CompanionPresetAction,
	type CompanionPresetDefinitions,
	type CompanionPresetSection,
	type SomeButtonGraphicsElement,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { ModuleSchema } from './main.js'
import { formatTime } from './types.js'

const BLACK = 0x000000
const WHITE = 0xffffff
const GREEN = 0x00ff00
const RED = 0xff0000
const MODE_INACTIVE = 0x331900
const MODE_ACTIVE = 0x994c00

const action = (actionId: keyof ModuleSchema['actions'], options: Record<string, unknown>) =>
	({ actionId, options }) as CompanionPresetAction<ModuleSchema['actions']>

function textElements(
	text: string | { isExpression: true; value: string },
	fontSize: number,
	textColor: number,
	backgroundColor: number,
): SomeButtonGraphicsElement[] {
	return [
		{
			type: 'box',
			id: 'background',
			name: 'Background',
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			color: backgroundColor,
			borderWidth: 0,
		},
		{
			type: 'text',
			id: 'text',
			name: 'Text',
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			text,
			fontsize: fontSize,
			fontsizeAllowShrink: false,
			font: 'companion-sans',
			weight: 'normal',
			color: textColor,
			halign: 'center',
			valign: 'center',
		},
	]
}

function textButton(
	name: string,
	text: string | { isExpression: true; value: string },
	fontSize: number,
	textColor: number,
	backgroundColor: number,
	down: CompanionPresetAction<ModuleSchema['actions']>[] = [],
	feedbacks: CompanionLayeredButtonPresetDefinition<ModuleSchema>['feedbacks'] = [],
): CompanionLayeredButtonPresetDefinition<ModuleSchema> {
	return {
		type: 'layered',
		name,
		elements: textElements(text, fontSize, textColor, backgroundColor),
		canvas: { decoration: ButtonGraphicsDecorationType.None, showStatusIcons: ButtonGraphicsShowStatusIcons.None },
		steps: [{ down, up: [] }],
		feedbacks,
	}
}

const backgroundOverride = (color: number) => ({
	elementId: 'background',
	elementProperty: 'color',
	override: { isExpression: false as const, value: color },
})

const textColorOverride = (color: number) => ({
	elementId: 'text',
	elementProperty: 'color',
	override: { isExpression: false as const, value: color },
})

export function updatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {
		live_display: {
			type: 'layered',
			name: 'Live STGTIME display',
			elements: [
				{
					type: 'image',
					id: 'display',
					name: 'Live Display',
					x: 0,
					y: 0,
					width: 100,
					height: 100,
					base64Image: { isExpression: true, value: '$(local:display_image)' },
					halign: 'center',
					valign: 'center',
					fillMode: 'fit',
				},
			],
			canvas: { decoration: ButtonGraphicsDecorationType.None, showStatusIcons: ButtonGraphicsShowStatusIcons.None },
			steps: [{ down: [], up: [] }],
			feedbacks: [],
			localVariables: [
				{
					variableType: 'feedback',
					variableName: 'display_image',
					feedbackId: 'display_image',
					options: {},
				},
			],
		},
		start: textButton('Start timer', 'START', 26, BLACK, GREEN, [action('timer_transport', { operation: 'start' })]),
		stop: textButton('Stop timer', 'STOP', 26, WHITE, RED, [action('timer_transport', { operation: 'stop' })]),
		toggle: textButton(
			'Toggle timer',
			'TOGGLE',
			26,
			WHITE,
			RED,
			[action('timer_transport', { operation: 'toggle' })],
			[
				{
					feedbackId: 'timer_running',
					options: { expected: true },
					styleOverrides: [backgroundOverride(GREEN), textColorOverride(BLACK)],
				},
			],
		),
		timer_display: textButton(
			'Timer value and running state',
			{ isExpression: true, value: '$(instance:timer)' },
			28,
			WHITE,
			RED,
			[],
			[
				{
					feedbackId: 'timer_running',
					options: { expected: true },
					styleOverrides: [backgroundOverride(GREEN), textColorOverride(BLACK)],
				},
			],
		),
		reset: textButton('Reset timer', 'RESET', 26, WHITE, BLACK, [action('timer_transport', { operation: 'reset' })]),
		countdown: textButton(
			'Countdown mode',
			'COUNT\nDOWN',
			26,
			WHITE,
			MODE_INACTIVE,
			[action('set_mode', { mode: 'countdown' })],
			[
				{
					feedbackId: 'timer_mode',
					options: { mode: 'countdown' },
					styleOverrides: [backgroundOverride(MODE_ACTIVE)],
				},
			],
		),
		stopwatch: textButton(
			'Stopwatch mode',
			'STOP\nWATCH',
			26,
			WHITE,
			MODE_INACTIVE,
			[action('set_mode', { mode: 'stopwatch' })],
			[
				{
					feedbackId: 'timer_mode',
					options: { mode: 'stopwatch' },
					styleOverrides: [backgroundOverride(MODE_ACTIVE)],
				},
			],
		),
		add_minute: textButton('Add one minute', '+1\nMIN', 28, WHITE, BLACK, [
			action('adjust_time', { amount: 1, unit: 60000 }),
		]),
		subtract_minute: textButton('Subtract one minute', '-1\nMIN', 28, WHITE, BLACK, [
			action('adjust_time', { amount: -1, unit: 60000 }),
		]),
		show_message: textButton('Show message', 'SHOW\nMESSAGE', 22, BLACK, GREEN, [
			action('message_visibility', { operation: 'show' }),
		]),
		hide_message: textButton('Hide message', 'HIDE\nMESSAGE', 22, WHITE, RED, [
			action('message_visibility', { operation: 'hide' }),
		]),
		message_toggle: textButton(
			'Toggle message visibility',
			'TOGGLE\nMESSAGE',
			22,
			WHITE,
			RED,
			[action('message_visibility', { operation: 'toggle' })],
			[
				{
					feedbackId: 'message_visible',
					options: { expected: true },
					styleOverrides: [backgroundOverride(GREEN), textColorOverride(BLACK)],
				},
			],
		),
	}

	const devicePresetIds: string[] = []
	for (const devicePreset of self.deviceConfig?.presets || []) {
		const id = `device_preset_${devicePreset.id.replace(/[^a-z0-9_-]/gi, '_')}`
		devicePresetIds.push(id)
		presets[id] = textButton(
			`Load ${devicePreset.name}`,
			`${devicePreset.name}\n${formatTime(devicePreset.durationMs)}`,
			20,
			WHITE,
			BLACK,
			[action('load_preset', { preset_id: devicePreset.id })],
		)
	}

	const structure: CompanionPresetSection[] = [
		{
			id: 'display',
			name: 'Display',
			definitions: [{ id: 'live', type: 'simple', name: 'Live display', presets: ['live_display'] }],
		},
		{
			id: 'timer_transport',
			name: 'Timer transport',
			definitions: [
				{
					id: 'transport',
					type: 'simple',
					name: 'Transport',
					presets: ['start', 'stop', 'toggle', 'timer_display', 'reset'],
				},
			],
		},
		{
			id: 'timer_modes',
			name: 'Timer modes and adjustment',
			definitions: [
				{ id: 'modes', type: 'simple', name: 'Modes', presets: ['countdown', 'stopwatch'] },
				{ id: 'adjustments', type: 'simple', name: 'Adjustments', presets: ['add_minute', 'subtract_minute'] },
			],
		},
		...(devicePresetIds.length
			? [
					{
						id: 'stgtime_presets',
						name: 'STGTIME presets',
						definitions: [
							{ id: 'device_presets', type: 'simple' as const, name: 'Device presets', presets: devicePresetIds },
						],
					},
				]
			: []),
		{
			id: 'messages',
			name: 'Messages',
			definitions: [
				{
					id: 'message_visibility',
					type: 'simple',
					name: 'Visibility',
					presets: ['show_message', 'hide_message', 'message_toggle'],
				},
			],
		},
	]
	self.setPresetDefinitions(structure, presets)
}
