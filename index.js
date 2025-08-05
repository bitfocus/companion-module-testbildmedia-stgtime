const { InstanceBase, InstanceStatus, runEntrypoint, combineRgb } = require('@companion-module/base')
const axios = require('axios')
const Jimp = require('jimp')

const getActions = require('./src/actions')
const getFeedbacks = require('./src/feedbacks')
const getVariables = require('./src/variables')
const getPresets = require('./src/presets')
const upgradeScripts = require('./src/upgrades')
const { configFields } = require('./src/config.js');

class STGTIMEInstance extends InstanceBase {

    async configUpdated(config) {
		this.config = config
		this.pollingInterval = config.pollms
        this.token = null

		if (!this.hostIsValid()) { this.updateStatus(InstanceStatus.BadConfig, 'Host missing'); return } 
		if (!this.portIsValid()) { this.updateStatus(InstanceStatus.BadConfig, 'Port missing'); return } 
		       
        this.startTokenPolling()
	}

	async init(config) {
        this.config = config
		this.pollingInterval = config.pollms
        this.token = null

		this.setActionDefinitions(getActions(this, combineRgb))
		this.setFeedbackDefinitions(getFeedbacks(this, combineRgb))
		this.setVariableDefinitions(getVariables(this))
		this.setPresetDefinitions(getPresets(this, combineRgb))

		if (!this.hostIsValid()) { this.updateStatus(InstanceStatus.BadConfig, 'Host missing'); return } 
		if (!this.portIsValid()) { this.updateStatus(InstanceStatus.BadConfig, 'Port missing'); return } 
		       
        this.startTokenPolling()
	}

	startTokenPolling(){
	if (this._tokenTimer) {
		clearTimeout(this._tokenTimer)
	}
	const tryConnect = async () => {
		if (!this.token) {
			await this.getToken()
		}
		if (!this.token) {
			this._tokenTimer = setTimeout(tryConnect, 5000)
		} else {
			this._tokenTimer = null
		}
	}
	tryConnect()
}

	PollingLoop(){
		if (this._pollingTimer) {
			clearTimeout(this._pollingTimer)
		}
		const polling = async () => {
			try {
				this.timerStatus = await this.sendRequest('GET', '/api/v1/timer/status');
				this.timerConfig = await this.sendRequest('GET', '/api/v1/config');
				this.screenImg = await this.getLiveImage();
				
				this.checkFeedbacks('display_image')
				this.checkFeedbacks('duration_match')
				this.checkFeedbacks('timer_running')
				this.checkFeedbacks('timer_stopped')
				this.checkFeedbacks('video_visible')

				this.setVariableValues({
					display_brightness: this.timerConfig.display.brightness,
					duration_time_s: this.timerStatus.timer.duration / 1000,
					remaining_time_hms: this.formatMsToHMS(this.timerStatus.timer.remaining),
				})
			} catch (err) {
				this.log('warn', `Error on Request: ${err.message}`)
            	this.resetConnection()
				return
			}
			this._pollingTimer = setTimeout(polling, this.pollingInterval || 250)
		}
		polling()
	}


    async getToken() {
		if (this.token) return
		if (!this.hostIsValid() || !this.portIsValid()) {
			this.updateStatus(InstanceStatus.BadConfig, 'Invalid host or port')
			return
		}
		this.updateStatus(InstanceStatus.Connecting, 'Connecting')
		try {
			const res = await axios.get(`http://${this.config.host}:${this.config.port}/api/token`)
			this.token = res.data.token
			this.updateStatus(InstanceStatus.Ok)
			this.PollingLoop()
		} catch (err) {
			this.token = null
			this.updateStatus(InstanceStatus.ConnectionFailure, 'No Connection')
		}
	}

    async sendRequest(method, path, data = null, responseType = 'json') {
		if (!this.token) return null

		const url = `http://${this.config.host}:${this.config.port}${path}`
		const headers = {'x-api-token': this.token}

		try {
			const res = await axios({ method, url, headers, data, responseType })
			return res.data
		} catch (err) {
			this.log('error', `Request-Fehler: ${err.message}`)
			throw err
		}
	}

	async getLiveImage() {
			if (!this.token || typeof this.token !== 'string' || this.token.length < 10) {
				this.log('debug', 'Image retrieval skipped – token not available')
				return {}
			}
			try {
				const response = await axios({
					method: 'GET',
					url: `http://${this.config.host}:${this.config.port}/api/v1/display`,
					responseType: 'arraybuffer',
					headers: {
						'x-api-token': this.token,
						Accept: 'image/png',
					},
					validateStatus: () => true,
				})
				if (response.status === 200 && response.data) {
					const image = await Jimp.read(Buffer.from(response.data))
					const png64 = await image.getBase64Async(Jimp.MIME_PNG)

					return { png64 }
				} else if (response.status !== 200) {
					this.log('warn', `Image retrieval failed: HTTP ${response.status} ${response.statusText}`)
				} else {
					this.log('warn', 'Image retrieval: Empty response at status 200')
				}
			} catch (err) {
				this.log('error', `Image retrieval error: ${err.message}`)
				throw err
			}
			return {}
		}

    getConfigFields() {
		return configFields
	}

    hostIsValid() {
		return typeof this.config.host === 'string' && this.config.host.trim().length > 0 && this.config.host !== '127.0.0.1' && this.config.host !== 'localhost'
	}
    portIsValid() {
		return typeof this.config.port === 'number' && this.config.port >= 0 && this.config.port <= 65535
	}
	formatMsToHMS(ms) {
		const totalSeconds = Math.floor(ms / 1000)
		const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
		const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
		const seconds = String(totalSeconds % 60).padStart(2, '0')
		return `${hours}:${minutes}:${seconds}`
	}

	resetConnection() {
		clearTimeout(this._tokenTimer)
		clearTimeout(this._pollingTimer)
		this._tokenTimer = null
		this._pollingTimer = null
		this.token = null
		this.startTokenPolling()
	}

}

runEntrypoint(STGTIMEInstance, upgradeScripts)