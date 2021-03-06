'use strict';

const fs = require('fs');
const zlib = require('zlib');

const headersConfig = require('../config/headers');

class StreamService {
	constructor($) {
		this._$ = $;
		this._streamsStore = [];

		this.addReader = this.addReader.bind(this);
		this.addResponse = this.addResponse.bind(this);
		this.defineCompression = this.defineCompression.bind(this);
		this.pipe = this.pipe.bind(this);
	}

	defineCompression() {
		const encoding = this._$.header(headersConfig.ACCEPT_ENCODING.TITLE) || '';

		const deflateMatch = encoding.match(/\bdeflate\b/);
		const gzipMatch = encoding.match(/\bgzip\b/);

		if (!gzipMatch || !deflateMatch) return this;

		if (deflateMatch) {
			this._$.header(headersConfig.CONTENT_ENCODING.TITLE, headersConfig.CONTENT_ENCODING.VALUE.DEFLATE);
			this._streamsStore.push(zlib.createDeflate());
			return this;
		}

		this._$.header(headersConfig.CONTENT_ENCODING.TITLE, headersConfig.CONTENT_ENCODING.VALUE.GZIP);
		this._streamsStore.push(zlib.createGzip());
		return this;
	}

	addReader(source) {
		this._streamsStore.push(fs.createReadStream(source));
		return this;
	}

	addResponse() {
		this._streamsStore.push(this._$.response);
		return this;
	}

	pipe() {
		return this._streamsStore.reduce((lastStream, currentStream) => lastStream.pipe(currentStream));
	}
}

module.exports = StreamService;
