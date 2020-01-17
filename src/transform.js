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
import createValidator from './validate';

class TransformEmitter extends EventEmitter {}
const {createLogger} = Utils;

export default function (stream, {validate = true}) {
	MarcRecord.setValidationOptions({subfieldValues: false});
	const Emitter = new TransformEmitter();
	const logger = createLogger();
	let validator;
	logger.log('debug', 'Starting to send recordEvents');

	readStream(stream);
	return Emitter;

	async function readStream(stream) {
		validator = await createValidator();
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
		gen007();
		gen008();
		gen020();
		gen022();
		gen040();
		gen041();
		gen042();
		gen080();
		gen084();
		gen100();
		gen222();
		gen245();
		gen250();
		gen255();
		gen263();
		gen264();
		gen310();
		gen336();
		gen337();
		gen338();
		gen362();
		gen490();
		gen502();
		gen594();
		gen700();
		gen710();
		gen760();
		gen776();
		gen780();
		gen935();

		if (validate === true) {
			return validator(marcRecord, validate);
		}

		return {failed: false, record: marcRecord};

		function genLeader() {
			let rules = [
				{'05': 'n'},
				{'07': value07()},
				{'09': 'a'},
				{10: '2'},
				{17: '8'},
				{18: 'i'},
				{'06': 'a'},
				{'08': value08()},
				{11: '2'},
				{'*': ' '}
			];
			// Leader modified for electronic book
			if (obj.formatDetails.format === 'electronic' || obj.type === 'book') {
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

			function value08() {
				if (obj.formatDetails.format === 'printed') {
					if (obj.type === 'dissertation' || Object.keys(obj.seriesDetails).length > 0) {
						return '^';
					}
				}

				return ' ';
			}

			function value07() {
				if (Object.keys(obj.seriesDetails).length > 0) {
					return 's';
				}

				return 'm';
			}
		}

		function gen007() {
			let rules;
			if (obj.formatDetails.format === 'electronic') {
				rules = [{'00': 'c'}, {'01': 'r'}];
				if (Object.keys(obj.seriesDetails).length > 0) {
					rules.push({'*': '|'});
				} else {
					rules.push({'*': ' '});
				}
			}

			if (obj.formatDetails.format === 'printed') {
				if (Object.keys(obj.seriesDetails).length > 0) {
					rules = [{'00': 't'}, {'01': 'a'}];
				}
			}

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
			let rules = [
				{'06': value06()},
				{'07-10': obj.publicationTime.substr(0, 4)},
				{'11-14': value1114()},
				{'15-17': ' fi'},
				{'18-21': '||||'},
				{29: '|'},
				{30: '0'},
				{31: '|'},
				{33: '0'},
				{34: '|'},
				{'35-37': obj.language},
				{38: '|'},
				{'*': ' '}
			];

			if (Object.keys(obj.seriesDetails).length > 0) {
				rules = rules.reduce((acc, item) => {
					const keys = Object.keys(item);
					keys.filter(key => {
						if (key !== '15-17' && key !== 29 && key !== 30 && key !== 31 && key !== 33 && key !== 34) {
							acc.push(item);
						}

						return acc;
					});
					acc.push({19: 'r'}, {21: 'p'}, {22: '|'}, {29: '0'}, {'30-32': '|'}, {33: 'b'}, {34: '0'});
					if (obj.formatDetails.format === 'electronic') {
						rules.push({23: 'o'});
					}

					return acc;
				}, []);
			}

			// Leader modified for electronic book
			if (obj.formatDetails.format === 'electronic') {
				if (obj.type !== 'dissertation') {
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

				rules.push({22: '^'}, {23: 'o'}, {24: 'm'});
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

			function value06() {
				if (Object.keys(obj.seriesDetails).length > 0) {
					return 'c';
				}

				return 's';
			}

			function value1114() {
				if (Object.keys(obj.seriesDetails).length > 0) {
					return '9999';
				}
			}

			// ************************ $33 fiction/non-fiction/cartoon not implemented yet **************************************
		}

		function gen020() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				return;
			}

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

		function gen022() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				marcRecord.insertField({
					tag: '022',
					ind1: '0',
					ind2: '_',
					subfields: [
						{
							code: 'a',
							value: '{ISSN id}'
						},
						{
							code: '2',
							value: 'a'
						}

					]
				});
			}
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
			if (obj.type === 'dissertation') {
				return;
			}

			if (Object.keys(obj.seriesDetails).length > 0) {
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
			if (obj.type === 'dissertation') {
				return;
			}

			if (Object.keys(obj.seriesDetails).length > 0) {
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
			if (Object.keys(obj.seriesDetails).length > 0) {
				return;
			}

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

		function gen222() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				marcRecord.insertField({
					tag: '222',
					ind1: '_',
					ind2: '0',
					subfields: [
						{
							code: 'a',
							value: '{keytitle}'
						},
						{
							code: 'b',
							value: valueSubFieldb() // If there is another publication form (printed)
						}
					]
				});
			}

			function valueSubFieldb() {
				// Check if there is another publication not implemented yet
				if (obj.formatDetails.format === 'printed') {
					return 'Painettu';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'Verkkoaineisto';
				}
			}
		}

		function gen245() {
			marcRecord.insertField({
				tag: '245',
				ind1: ind1(),
				ind2: '0',
				subfields: [
					{
						code: 'a',
						value: `${obj.title}${obj.subtitle ? ' :' : '.'}`
					},
					{
						code: 'b',
						value: `${obj.subtitle}.`
					}
				]
			});

			function ind1() {
				if (obj.type === 'dissertation') {
					return '1';
				}

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

			if (Object.keys(obj.seriesDetails).length > 0) {
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

			if (Object.keys(obj.seriesDetails).length > 0) {
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
						value: `${obj.formatDetails.city} :` // Replace with city of a publisher
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

		function gen310() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				marcRecord.insertField({
					tag: '310',
					subfields: [
						{
							code: 'a',
							value: '{frequency}'
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
				if (obj.formatDetails.format === 'printed' || Object.keys(obj.seriesDetails).length > 0) {
					return 'käytettävissä ilman laitetta';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'tietokonekäyttöinen';
				}
			}

			function bValue() {
				if (obj.formatDetails.format === 'printed' || Object.keys(obj.seriesDetails).length > 0) {
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
				if (obj.formatDetails.format === 'printed' || Object.keys(obj.seriesDetails).length > 0) {
					return 'nide';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'verkkoaineisto';
				}
			}

			function bValue() {
				if (obj.formatDetails.format === 'printed' || Object.keys(obj.seriesDetails).length > 0) {
					return 'nc';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'cr';
				}
			}
		}

		function gen362() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				marcRecord.insertField({
					tag: '362',
					ind1: '0',
					ind2: '_',
					subfields: [
						{
							code: 'a',
							value: `${obj.seriesDetails.volume},`
						}
					]
				});
			}
		}

		function gen490() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				return;
			}

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

		function gen502() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				return;
			}

			if (obj.type === 'dissertation') {
				marcRecord.insertField({
					tag: '502',
					subfields: [
						{
							code: 'a',
							value: `${obj.seriesDetails.title},`
						},
						{
							code: 'c',
							value: '{name of the university, ends with period}'
						},
						{
							code: '9',
							value: 'FENNI<KEEP>'
						}
					]
				});
			}
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

			if (!Object.keys(obj.seriesDetails).length > 0) {
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
		}

		function gen700() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				return;
			}

			if (obj.type === 'dissertation') {
				return;
			}

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

		function gen710() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				marcRecord.insertField({
					tag: '710',
					ind1: '2',
					ind2: '_',
					subfields: [
						{
							code: 'a',
							value: `${obj.publisher}.` // Ends with period
						}
					]
				});
			}
		}

		function gen760() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				marcRecord.insertField({
					tag: '760',
					ind1: '0',
					ind2: '0',
					subfields: valueSubfields()
				});
			}

			function valueSubfields() {
				const subfields = [
					{
						code: 't',
						value: '{title of the main series}' // If publication is part of main series
					},
					{
						code: 'x',
						value: '{ISSN of main series}' // If publication is part of main series
					},
					{
						code: '9',
						value: 'FENNI<KEEP>'
					}
				];

				if (obj.formatDetails.format === 'printed') {
					return subfields;
				}

				subfields.push({
					code: 'c',
					value: '{}' // Not Defined in description
				});
				return subfields;
			}
		}

		function gen776() {
			marcRecord.insertField({
				tag: '776',
				ind1: '0',
				ind2: '8',
				subfields: valueSubfields()

			});

			function aValue() {
				if (obj.formatDetails.format === 'printed') {
					return 'Verkkoaineisto';
				}

				if (obj.formatDetails.format === 'electronic') {
					return 'Painettu';
				}
			}

			function valueSubfields() {
				const subfields = [
					{
						code: 'i',
						value: aValue()
					},
					{
						code: '9',
						value: 'FENNI<KEEP>'
					}
				];
				if (Object.keys(obj.seriesDetails).length > 0) {
					subfields.push({code: 't', value: '{title from another form'}, {code: 'x', value: '{ISSN from another form'});
					return subfields;
				}

				subfields.push({code: 'z', value: '{ISBN from another form'});
				return subfields;
			}
		}

		function gen780() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				marcRecord.insertField({
					tag: '780',
					ind1: '0',
					ind2: '0',
					subfields: [
						{
							code: 't',
							value: '{title of the previously issued series}'
						},
						{
							code: 'c',
							value: '{Not Specified}' // Not specified
						},
						{
							code: 'x',
							value: '{ISSN of the previously issued series}'
						},
						{
							code: '9',
							value: 'FENNI<KEEP>'
						}
					]
				});
			}
		}

		function gen935() {
			if (Object.keys(obj.seriesDetails).length > 0) {
				marcRecord.insertField({
					tag: '935',
					subfields: [
						{
							code: 'a',
							value: 'ISSNpre'
						},
						{
							code: '5',
							value: 'FENNI'
						}
					]
				});
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
