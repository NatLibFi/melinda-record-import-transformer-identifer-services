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
import {streamArray} from 'stream-json/streamers/StreamArray';

class TransformEmitter extends EventEmitter {}
const {createLogger} = Utils;

export default function (stream, {validate = true, fix = true}) {
	MarcRecord.setValidationOptions({subfieldValues: false});
	const Emitter = new TransformEmitter();
	const logger = createLogger();

	logger.log('debug', 'Starting to send recordEvents');

	readStream(stream);
	return Emitter;

	async function readStream(stream) {
		try {
			const promises = [];
			const pipeline = chain([
				stream,
				parser(),
				streamArray()
			]);

			pipeline.on('data', async data => {
				promises.push(transform(data.value));

				async function transform(value) {
					const result = convertRecord(value);
					console.log(value);
					Emitter.emit('record', result);
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

	function convertRecord(obj) {
		const marcRecord = new MarcRecord();

		genLeader();
		if (obj.formatDetails.format === 'electronic') {
			gen007();
		}

		gen008();
		gen020();
		gen040();
		gen041();
		gen042();
		gen080();
		gen084();
		gen100();
		gen245();
		gen250();
		// gen255();
		// gen263();
		gen264();
		gen336();
		gen337();
		gen338();
		gen490();
		gen594();
		gen700();
		gen776();

		return {failed: false, record: marcRecord};

		function genLeader() {
			let rules = [
				{'05': 'n'},
				{'07': 'm'},
				{'09': 'a'},
				{10: '2'},
				{17: '8'},
				{18: 'i'},
				{'06': 'a'},
				{'08': (obj.formatDetails.format === 'printed' && obj.type === 'dissertation') ? '^' : ' '},
				{11: '2'},
				{'*': ' '}
			];
			// Leader modified for electronic book
			if (obj.formatDetails.format === 'electronic') {
				rules = rules.reduce((acc, item) => {
					const keys = Object.keys(item);
					keys.filter(key => {
						if (key !== '08') {
							acc.push(item);
						}

						return acc;
					});
					return acc;
				}, []);
			}

			const chars = new Array(24).fill(' ');
			rules.forEach(item => {
				const keys = Object.keys(item);
				const values = Object.values(item);
				chars[Number(keys[0])] = values[0];
			});
			marcRecord.leader = chars.join('');
		}

		function gen007() {
			const rules = [{'00': 'c'}, {'01': 'r'}, {'*': ' '}];
			const chars = new Array(23).fill(' ');
			rules.forEach(item => {
				const keys = Object.keys(item);
				const values = Object.values(item);
				if (isNaN(Number(keys[0]))) {
					convertNaN(keys[0], values[0], chars);
				} else {
					chars[Number(keys[0])] = values[0];
				}
			});

			marcRecord.insertField({
				tag: '007', value: chars.join('')
			});

			// ************************ $33 fiction/non-fiction/cartoon not implemented yet **************************************
		}

		function gen008() {
			let rules = [{'06': 's'}, {'07-10': obj.publicationTime.substr(0, 4)}, {'15-17': ' fi'}, {'18-21': '||||'}, {29: '|'}, {30: '0'}, {31: '|'}, {33: '0'}, {34: '|'}, {'35-37': obj.language}, {38: '|'}, {'*': ' '}];
			// Leader modified for electronic book
			if (obj.formatDetails.format === 'electronic') {
				rules = rules.reduce((acc, item) => {
					const keys = Object.keys(item);
					keys.filter(key => {
						if (key !== '15-17') {
							acc.push(item);
						}

						return acc;
					});
					acc.push({23: 'o'});
					return acc;
				}, []);
			}

			if (obj.formatDetails.format === 'printed' && obj.type === 'dissertation') {
				rules.push({24: 'm'});
			}

			const chars = new Array(40).fill(' ');
			rules.forEach(item => {
				const keys = Object.keys(item);
				const values = Object.values(item);
				if (isNaN(Number(keys[0]))) {
					convertNaN(keys[0], values[0], chars);
				} else {
					chars[Number(keys[0])] = values[0];
				}
			});

			marcRecord.insertField({
				tag: '008', value: chars.join('')
			});

			// ************************ $33 fiction/non-fiction/cartoon not implemented yet **************************************
		}

		function gen020() {
			marcRecord.insertField({
				tag: '020',
				subfields: [
					{
						code: 'a',
						value: obj.identifiers.reduce((acc, item) => {
							if (item.type === 'electronic' || item.type === 'printed') {
								acc = item.id;
							}

							return acc;
						}, '')
					},
					{
						code: 'q',
						value: obj.identifiers.reduce((acc, item) => {
							if (item.type === 'printed') {
								acc = obj.formatDetails.printFormat;
							}

							if (item.type === 'electronic') {
								acc = obj.formatDetails.fileFormat;
							}

							return acc;
						}, '')
					}

				]
			});
			// ****************** 	$a another ISBN, if the book is a part of a multi-volume publication is left to implement ********************************
		}

		function gen040() {
			marcRecord.insertField({
				tag: '040',
				subfields: [
					{
						code: 'a',
						value: 'FI-NL'
					},
					{
						code: 'b',
						value: 'fin'
					},
					{
						code: 'e',
						value: 'rda'
					}
				]
			});
		}

		function gen041() {
			marcRecord.insertField({
				tag: '041',
				ind1: '0',
				ind2: '_',
				subfields: [{
					code: 'a',
					value: obj.language
				}]
			});
		}

		function gen042() {
			marcRecord.insertField({
				tag: '042',
				subfields: [
					{
						code: 'a',
						value: 'finb'
					}
				]
			});
		}

		function gen080() {
			if (obj.formatDetails.format === 'printed' && obj.type === 'dissertation') {
				return;
			}

			marcRecord.insertField({
				tag: '080',
				ind1: '1',
				ind2: '_',
				subfields: [
					{
						code: 'a',
						value: '894.541'
					},
					{
						code: 'x',
						value: '-3'
					},
					{
						code: '2',
						value: '1974/fin/fennica'
					},
					{
						code: '9',
						value: 'FENNI<KEEP>'
					}
				]
			});
			// ********************* If cartoon is not implemented yet *************************
		}

		function gen084() {
			if (obj.formatDetails.format === 'printed' && obj.type === 'dissertation') {
				return;
			}

			marcRecord.insertField({
				tag: '084',
				ind1: '_',
				ind2: '_',
				subfields: [
					{
						code: 'a',
						value: '84.2'
					},
					{
						code: '2',
						value: '1974/fin/fennica'
					},
					{
						code: '9',
						value: 'FENNI<KEEP>'
					}
				]
			});
			// *********************** If Finnish cartoon is not implemented yet ***************************
		}

		function gen100() {
			marcRecord.insertField({
				tag: '100',
				ind1: '1',
				ind2: '_',
				subfields: [
					{
						code: 'a',
						value: `${obj.authors[0].givenName}, ${obj.authors[0].familyName}` // Multiple authors ????????????
					},
					{
						code: 'e',
						value: obj.authors[0].role
					},
					{
						code: 'g',
						value: 'ENNAKKOTIETO.'
					}
				]
			});
			// ********************************* If role is 'kirjoittaja' ****************************
		}

		function gen245() {
			marcRecord.insertField({
				tag: '245',
				ind1: ind1(),
				subfields: [
					{
						code: 'a',
						value: `${obj.title}${obj.subtitle ? ' :' : '.'}`
					},
					{
						code: 'b',
						value: `${obj.subtitle}`
					}
				]
			});

			function ind1() {
				if (obj.formatDetails.format === 'printed' && obj.type === 'dissertation') {
					return '1';
				}

				console.log(marcRecord.get(/^100$/).length)
				if (marcRecord.get(/^100$/).length > 0) {
					return '1';
				}

				return '0';
			}

			// *********************** Ends with a period not implemented *******************************
		}

		function gen250() {
			if (obj.formatDetails.format === 'printed' && obj.type === 'dissertation') {
				return;
			}

			marcRecord.insertField({
				tag: '250',
				subfields: [
					{
						code: 'a',
						value: '{edition}'
					}
				]
			});
		}

		function gen255() {
			if (obj.formatDetails.format === 'printed' && obj.type === 'dissertation') {
				return;
			}

			marcRecord.insertField({
				tag: '255',
				subfields: [
					{
						code: 'a',
						value: '{edition}' // Scale, for example a map on a scale of 15:000
					}
				]
			});
		}

		function gen263() {
			marcRecord.insertField({
				tag: '263',
				subfields: [
					{
						code: 'a',
						value: '{edition}' // 	Estimated publication time yyyymm
					}
				]
			});
		}

		function gen264() {
			marcRecord.insertField({
				tag: '264',
				ind1: '_',
				ind2: '1',
				subfields: [
					{
						code: 'a',
						value: `${obj.formatDetails.city} :` // replace with city of a publisher
					},
					{
						code: 'b',
						value: `${obj.publisher},`
					},
					{
						code: 'c',
						value: `${obj.publicationTime.substr(0, 4)}.`
					}
				]
			});

			if (obj.formatDetails.format === 'printed') {
				marcRecord.insertField({
					tag: '264',
					ind1: '_',
					ind2: '3',
					subfields: [
						{
							code: 'a',
							value: `${obj.formatDetails.city} :`
						},
						{
							code: 'b',
							value: `${obj.manufacturer}`
						}
					]
				});
			}
		}

		function gen336() {
			marcRecord.insertField({
				tag: '336',
				subfields: [
					{
						code: 'a',
						value: 'teksti'
					},
					{
						code: 'b',
						value: 'txt'
					},
					{
						code: '2',
						value: 'rdacontent'
					}
				]
			});
		}

		function gen337() {
			marcRecord.insertField({
				tag: '337',
				subfields: [
					{
						code: 'a',
						value: aValue()
					},
					{
						code: 'b',
						value: bValue()
					},
					{
						code: '2',
						value: 'rdamedia'
					}
				]
			});

			function aValue() {
				if (obj.formatDetails.format === 'printed') {
					return 'käytettävissä ilman laitetta';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'tietokonekäyttöinen';
				}
			}

			function bValue() {
				if (obj.formatDetails.format === 'printed') {
					return 'n';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'c';
				}
			}
		}

		function gen338() {
			marcRecord.insertField({
				tag: '338',
				subfields: [
					{
						code: 'a',
						value: aValue()
					},
					{
						code: 'b',
						value: bValue()
					},
					{
						code: '2',
						value: 'rdacarrier'
					}
				]
			});

			function aValue() {
				if (obj.formatDetails.format === 'printed') {
					return 'nide';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'verkkoaineisto';
				}
			}

			function bValue() {
				if (obj.formatDetails.format === 'printed') {
					return 'nc';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'cr';
				}
			}
		}

		function gen490() {
			marcRecord.insertField({
				tag: '490',
				ind1: '0',
				ind2: '_',
				subfields: [
					{
						code: 'a',
						value: `${obj.seriesDetails.title},`
					},
					{
						code: 'x',
						value: `${obj.seriesDetails.identifier} ;`
					},
					{
						code: 'v',
						value: `${obj.seriesDetails.volume}`
					}
				]
			});
		}

		function gen594() {
			marcRecord.insertField({
				tag: '594',
				subfields: [
					{
						code: 'a',
						value: 'ENNAKKOTIETO KANSALLISKIRJASTO'
					},
					{
						code: '5',
						value: 'FENNI'
					}
				]
			});

			marcRecord.insertField({
				tag: '594',
				subfields: [
					{
						code: 'a',
						value: 'EI VASTAANOTETTU'
					},
					{
						code: '5',
						value: 'FENNI'
					}
				]
			});
		}

		function gen700() {
			marcRecord.insertField({
				tag: '700',
				ind1: '1',
				ind2: '_',
				subfields: [
					{
						code: 'a',
						value: `${obj.authors.givenName}, ${obj.authors.familyName}`
					},
					{
						code: 'e',
						value: obj.authors.role // If role is 'toimittaja', 'kuvittaja', 'kääntäjä'!!
					},
					{
						code: 'g',
						value: 'ENNAKKOTIETO.'
					}
				]
			});
		}

		function gen776() {
			marcRecord.insertField({
				tag: '776',
				ind1: '0',
				ind2: '8',
				subfields: [
					{
						code: 'i',
						value: aValue()
					},
					{
						code: 'z',
						value: '{if there is another publication form, z = ISBN of the other form}'
					},
					{
						code: '9',
						value: 'FENNI<KEEP>'
					}
				]
			});

			function aValue() {
				if (obj.formatDetails.format === 'printed') {
					return 'Verkkoaineisto';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'Painettu';
				}
			}
		}

		function convertNaN(key, value, chars) {
			const keysArray = key.split('-');
			const valuesArray = value.split('');

			const last = keysArray[1];

			for (let init = Number(keysArray[0]), count = 0; init <= last; init++, count++) {
				chars[init] = valuesArray[count];
			}
		}
	}
}
