export class StgtimeApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message)
	}
}

export interface StgtimeConnection {
	host: string
	port: number
	apiToken: string
}

export class StgtimeClient {
	constructor(private readonly connection: StgtimeConnection) {}

	private headers(): Record<string, string> {
		const headers: Record<string, string> = { accept: 'application/json' }
		if (this.connection.apiToken) headers['x-api-token'] = this.connection.apiToken
		return headers
	}

	private url(path: string): string {
		return `http://${this.connection.host}:${this.connection.port}/api/v1${path}`
	}

	async request<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
		const headers = this.headers()
		if (payload !== undefined) headers['content-type'] = 'application/json'
		const response = await fetch(this.url(path), {
			method,
			headers,
			body: payload === undefined ? undefined : JSON.stringify(payload),
			signal: AbortSignal.timeout(3000),
		})
		const result = (await response.json().catch(() => ({}))) as Record<string, unknown>
		if (!response.ok) {
			const message = typeof result.error === 'string' ? result.error : `HTTP ${response.status}`
			throw new StgtimeApiError(message, response.status)
		}
		return result as T
	}

	async requestPngBase64(path: string): Promise<string> {
		const response = await fetch(this.url(path), {
			headers: { ...this.headers(), accept: 'image/png' },
			signal: AbortSignal.timeout(3000),
		})
		if (!response.ok) throw new StgtimeApiError(`Display image returned HTTP ${response.status}`, response.status)
		return Buffer.from(await response.arrayBuffer()).toString('base64')
	}
}
