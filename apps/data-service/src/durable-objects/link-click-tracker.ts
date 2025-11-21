import { DurableObject } from 'cloudflare:workers';
import moment from 'moment';

const CREATE_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS geo_link_clicks (
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        country TEXT NOT NULL,
        time INTEGER NOT NULL
    )
`;

const INSERT_CLICK_QUERY = `
    INSERT INTO geo_link_clicks (latitude, longitude, country, time)
    VALUES (?, ?, ?, ?)
`;

export class LinkClickTracker extends DurableObject {
	sql: SqlStorage;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sql = ctx.storage.sql;

		ctx.blockConcurrencyWhile(async () => {
			this.sql.exec(CREATE_TABLE_QUERY);
		});
	}

	async addClick(latitude: number, longitude: number, country: string, time: number) {
		this.sql.exec(INSERT_CLICK_QUERY, latitude, longitude, country, time);
	}

	async fetch(_: Request) {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);
		this.ctx.acceptWebSocket(server);
		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}
}
