/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Identifier Service record transformer for the Melinda record batch import system
*
* Copyright (c) 2018-2019 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-import-transformer-identifier-services
*
* melinda-record-import-transformer-identifier-services program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-import-transformer-identifier-services is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import {Utils} from '@natlibfi/identifier-services-commons';
import {MarcRecord} from '@natlibfi/marc-record';
import {EventEmitter} from 'events';
import {parser} from 'stream-json';
import {chain} from 'stream-chain';

class TransformEmitter extends EventEmitter {}
const {createLogger} = Utils;

export default function (stream, {validate = true, fix = true}) {
	MarcRecord.setValidationOptions({subfieldValues: false});
	const Emitter = new TransformEmitter();
	const logger = createLogger();

	logger('debug', 'Starting to send recordEvents');

	readStream(stream);
	return Emitter;

	async function readStream(stream) {
		try {
			const promises = [];
			const pipeline = chain([
				stream,
				parser()
				// StreamArray()
			]);

			pipeline.on('data', async data => {
				promises.push(transform(data.value));

				async function transform(value) {
					const result = convertRecord(value);
					// Emitter.emit('record', result);
				}
			});
			pipeline.on('end', async () => {
				logger.log('debug', `Handled ${promises.length} recordEvents`);
				await Promise.all(promises);
				Emitter.emit('end', promises.length);
			});
		} catch (err) {
			Emitter.emit('error', err);
		}
	}

	function convertRecord(record) {
		console.log('what is this', record);
	}
}
