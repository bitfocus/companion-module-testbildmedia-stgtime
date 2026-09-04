import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { updateActions, type ActionsSchema } from './actions.js'
import { StgtimeApiError, StgtimeClient } from './client.js'
import { getConfigFields, normalizeConfig } from './config.js'
import { updateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { updatePresets } from './presets.js'
import type { ModuleConfig, ModuleSecrets, StgtimeConfig, StgtimeState } from './types.js'
import { formatTime, timerTimeState } from './types.js'
import { UpgradeScripts } from './upgrades.js'
import { updateVariableDefinitions, type VariablesSchema } from './variables.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: ModuleSecrets
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig
	secrets: ModuleSecrets = { apiToken: '' }
	deviceState: StgtimeState | null = null
	deviceConfig: StgtimeConfig | null = null
	displayPng64 = ''
	connected = false
	private pollTimer: ReturnType<typeof setInterval> | undefined
	private configPollsRemaining = 0
	private polling = false

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = normalizeConfig(config)
		this.secrets = { apiToken: String(secrets?.apiToken || '').trim() }
		this.updateStatus(InstanceStatus.Connecting)
		updateVariableDefinitions(this)
		updateActions(this)
		updateFeedbacks(this)
		updatePresets(this)
		this.startPolling()
		await this.poll()
	}

	async destroy(): Promise<void> {
		this.stopPolling()
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = normalizeConfig(config)
		this.secrets = { apiToken: String(secrets?.apiToken || '').trim() }
		this.deviceConfig = null
		this.configPollsRemaining = 0
		this.stopPolling()
		this.startPolling()
		await this.poll()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	private startPolling(): void {
		this.pollTimer = setInterval(() => void this.poll(), this.config.pollInterval)
	}

	private stopPolling(): void {
		if (this.pollTimer) clearInterval(this.pollTimer)
		this.pollTimer = undefined
	}

	private async request<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
		return new StgtimeClient({
			host: this.config.host,
			port: this.config.port,
			apiToken: this.secrets.apiToken,
		}).request<T>(path, method, payload)
	}

	async send(path: string, method: 'POST' | 'PUT', payload?: unknown, refresh = true): Promise<void> {
		try {
			await this.request(path, method, payload)
			if (refresh) await this.poll()
		} catch (error) {
			this.handleError(error)
			throw error
		}
	}

	async poll(): Promise<void> {
		if (this.polling || !this.config.host) return
		this.polling = true
		try {
			const client = new StgtimeClient({
				host: this.config.host,
				port: this.config.port,
				apiToken: this.secrets.apiToken,
			})
			const [state, displayPng64] = await Promise.all([
				client.request<StgtimeState>('/state'),
				client.requestPngBase64('/display.png').catch(() => ''),
			])
			this.deviceState = state
			if (displayPng64) this.displayPng64 = displayPng64
			if (!this.deviceConfig || this.configPollsRemaining <= 0) {
				this.deviceConfig = await this.request<StgtimeConfig>('/config')
				this.configPollsRemaining = Math.max(1, Math.round(30000 / this.config.pollInterval))
				updateActions(this)
				updatePresets(this)
			} else {
				this.configPollsRemaining -= 1
			}
			this.connected = true
			this.updateStatus(InstanceStatus.Ok)
			this.updateVariables()
			this.checkAllFeedbacks()
		} catch (error) {
			this.handleError(error)
		} finally {
			this.polling = false
		}
	}

	private handleError(error: unknown): void {
		this.connected = false
		this.setVariableValues({ connected: false })
		this.checkAllFeedbacks()
		if (error instanceof StgtimeApiError && (error.status === 401 || error.status === 403)) {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'API authentication failed')
			return
		}
		const message = error instanceof Error ? error.message : String(error)
		this.updateStatus(InstanceStatus.ConnectionFailure, message)
	}

	private updateVariables(): void {
		const state = this.deviceState
		if (!state) return
		const showHours = this.deviceConfig?.display.format !== 'MM:SS'
		const duration = Math.max(0, state.timer.durationMs)
		const elapsed = state.timer.mode === 'countdown' ? duration - Math.max(0, state.timer.valueMs) : state.timer.valueMs
		const progress = duration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100))) : 0
		this.setVariableValues({
			connected: true,
			timer: formatTime(state.timer.valueMs, showHours),
			timer_value_ms: Math.round(state.timer.valueMs),
			timer_duration: formatTime(duration, showHours),
			timer_duration_ms: duration,
			timer_remaining_ms: Math.round(state.timer.remainingMs),
			timer_progress_percent: progress,
			timer_mode: state.timer.mode,
			timer_running: state.timer.running,
			timer_state: timerTimeState(state, this.deviceConfig),
			overtime_enabled: state.timer.continueNegative,
			message_text: state.message.text,
			message_visible: state.message.visible,
			video_label: state.video.label,
			video_remaining: formatTime(state.video.remainingMs, false),
			video_remaining_ms: state.video.remainingMs,
			video_visible: state.video.visible,
			version: state.system.version,
			display_driver: state.display.driver,
			display_available: state.display.available,
			ip_addresses: state.system.addresses.map((address) => address.address).join(', '),
		})
	}
}
