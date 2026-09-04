import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { StgtimeApiError, StgtimeClient } from '../dist/client.js'
import { updateFeedbacks } from '../dist/feedbacks.js'
import { updatePresets } from '../dist/presets.js'

test('client authenticates and sends JSON to the STGTIME API', async () => {
	const requests = []
	const server = createServer(async (request, response) => {
		let body = ''
		for await (const chunk of request) body += chunk
		requests.push({ method: request.method, url: request.url, token: request.headers['x-api-token'], body })
		response.writeHead(200, { 'content-type': 'application/json' })
		response.end(JSON.stringify({ timer: { running: true } }))
	})
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	try {
		const client = new StgtimeClient({ host: '127.0.0.1', port: server.address().port, apiToken: 'test-token' })
		assert.deepEqual(await client.request('/timer/action', 'POST', { action: 'start' }), { timer: { running: true } })
		assert.deepEqual(requests, [
			{ method: 'POST', url: '/api/v1/timer/action', token: 'test-token', body: '{"action":"start"}' },
		])
	} finally {
		await new Promise((resolve) => server.close(resolve))
	}
})

test('client exposes STGTIME authentication failures without leaking the token', async () => {
	const server = createServer((_request, response) => {
		response.writeHead(401, { 'content-type': 'application/json' })
		response.end(JSON.stringify({ error: 'authentication_required' }))
	})
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	try {
		const client = new StgtimeClient({ host: '127.0.0.1', port: server.address().port, apiToken: 'never-log-this' })
		await assert.rejects(client.request('/state'), (error) => {
			assert.ok(error instanceof StgtimeApiError)
			assert.equal(error.status, 401)
			assert.equal(error.message, 'authentication_required')
			assert.doesNotMatch(error.message, /never-log-this/)
			return true
		})
	} finally {
		await new Promise((resolve) => server.close(resolve))
	}
})

test('client downloads the authenticated display PNG as base64', async () => {
	const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])
	let token = ''
	const server = createServer((request, response) => {
		token = request.headers['x-api-token'] || ''
		response.writeHead(200, { 'content-type': 'image/png' })
		response.end(png)
	})
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	try {
		const client = new StgtimeClient({ host: '127.0.0.1', port: server.address().port, apiToken: 'image-token' })
		assert.equal(await client.requestPngBase64('/display.png'), png.toString('base64'))
		assert.equal(token, 'image-token')
	} finally {
		await new Promise((resolve) => server.close(resolve))
	}
})

test('live display feedback exposes a PNG data URI for Companion image elements', async () => {
	let feedbacks
	updateFeedbacks({
		displayPng64: 'iVBORw0KGgo=',
		setFeedbackDefinitions: (definitions) => {
			feedbacks = definitions
		},
	})

	assert.equal(feedbacks.display_image.type, 'value')
	assert.equal(await feedbacks.display_image.callback(), 'data:image/png;base64,iVBORw0KGgo=')
})

test('Companion 5 presets use only the requested layered graphics', () => {
	let presets
	updatePresets({
		deviceConfig: {
			presets: [{ id: 'five', name: '5 minutes', durationMs: 300000 }],
		},
		setPresetDefinitions: (_structure, definitions) => {
			presets = definitions
		},
	})

	assert.equal(presets.live_display.type, 'layered')
	assert.deepEqual(
		presets.live_display.elements.map((element) => element.type),
		['image'],
	)
	assert.equal(JSON.stringify(presets.live_display).includes('imageBuffer'), false)
	assert.deepEqual(presets.live_display.feedbacks, [])
	assert.deepEqual(presets.live_display.localVariables, [
		{ variableType: 'feedback', variableName: 'display_image', feedbackId: 'display_image', options: {} },
	])
	assert.deepEqual(presets.live_display.elements[0].base64Image, {
		isExpression: true,
		value: '$(local:display_image)',
	})

	for (const [id, preset] of Object.entries(presets)) {
		assert.equal(preset.type, 'layered', id)
		if (id === 'live_display') continue
		assert.deepEqual(
			preset.elements.map((element) => element.type),
			['box', 'text'],
			id,
		)
		const fontSize = preset.elements.find((element) => element.type === 'text').fontsize
		assert.equal(Number.isInteger(fontSize), true, id)
		assert.ok(fontSize <= 28, id)
	}

	assert.equal(presets.start.elements[1].fontsize, 26)
	assert.equal(presets.start.elements[1].color, 0x000000)
	assert.equal(presets.start.elements[0].color, 0x00ff00)
	assert.equal(presets.stop.elements[1].fontsize, 26)
	assert.equal(presets.stop.elements[0].color, 0xff0000)
	assert.equal(presets.toggle.elements[1].fontsize, 26)
	assert.equal(presets.timer_display.elements[1].fontsize, 28)
	assert.equal(presets.reset.elements[1].fontsize, 26)
	assert.equal(presets.countdown.elements[1].text, 'COUNT\nDOWN')
	assert.equal(presets.countdown.elements[0].color, 0x331900)
	assert.deepEqual(presets.countdown.feedbacks[0].styleOverrides[0].override, {
		isExpression: false,
		value: 0x994c00,
	})
	assert.equal(presets.stopwatch.elements[1].text, 'STOP\nWATCH')
	assert.equal(presets.show_message.elements[1].fontsize, 22)
	assert.equal(presets.hide_message.elements[1].fontsize, 22)
	assert.equal(presets.message_toggle.elements[1].fontsize, 22)
	assert.equal(presets.message_toggle.elements[0].color, 0xff0000)
	assert.equal(presets.message_toggle.elements[1].color, 0xffffff)
	assert.equal(presets.message_toggle.feedbacks[0].feedbackId, 'message_visible')
	assert.deepEqual(presets.message_toggle.feedbacks[0].styleOverrides, [
		{ elementId: 'background', elementProperty: 'color', override: { isExpression: false, value: 0x00ff00 } },
		{ elementId: 'text', elementProperty: 'color', override: { isExpression: false, value: 0x000000 } },
	])
	assert.equal(presets.toggle.elements[0].color, 0xff0000)
	assert.equal(presets.toggle.elements[1].color, 0xffffff)
	assert.equal(presets.toggle.feedbacks[0].feedbackId, 'timer_running')
	assert.equal(presets.add_minute.elements[1].fontsize, 28)
	assert.equal(presets.subtract_minute.elements[1].fontsize, 28)
	assert.equal(presets.device_preset_five.elements[1].fontsize, 20)
	assert.equal(presets.device_preset_five.elements[1].text, '5 minutes\n00:05:00')
})
