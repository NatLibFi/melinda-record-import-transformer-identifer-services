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

export default function (stream) {
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
					Emitter.emit('record', result);

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
						return {failed: false, record: marcRecord};

						function genLeader() {
							const rules = makeRules();
							const chars = new Array(24).fill(' ').map((_, index) => {
								const entry = rules.filter(({index: ruleIndex}) => ruleIndex === index);
								if (entry.length > 0) {
									return entry[0].value;
								}

								return ' ';
							});
							marcRecord.leader = chars.join('');

							function makeRules() {
								const baseChars = [
									{index: 5, value: 'n'},
									{index: 6, value: 'a'},
									{index: 7, value: value07()},
									{index: 9, value: 'a'},
									{index: 10, value: '2'},
									{index: 11, value: '2'},
									{index: 17, value: '8'},
									{index: 18, value: 'i'}
								];

								if (obj.formatDetails.format === 'printed') {
									return baseChars.concat({index: '08', value: value08()});
								}

								function value08() {
									if (obj.type === 'dissertation' || Object.keys(obj.seriesDetails).length > 0) {
										return '^';
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
						}

						function gen007() {
							const rules = makeRules();
							const chars = new Array(23).fill(' ').map((_, index) => {
								const entry = rules.filter(({index: ruleIndex}) => ruleIndex === index);
								if (obj.formatDetails.format === 'electronic') {
									if (Object.keys(obj.seriesDetails).length > 0) {
										return '|';
									}

									if (entry.length > 0) {
										return entry[0].value;
									}

									return ' ';
								}

								if (obj.formatDetails.format === 'printed' && Object.keys(obj.seriesDetails).length > 0) {
									if (entry.length > 0) {
										return entry[0].value;
									}

									return ' ';
								}

								/* eslint array-callback-return: "error" */
								return false;
							});

							marcRecord.insertField({
								tag: '007', value: chars.join('')
							});
							// ************************ $33 fiction/non-fiction/cartoon not implemented yet **************************************
							function makeRules() {
								if (obj.formatDetails.format === 'electronic') {
									return [{index: 0, value: 'c'}, {index: 1, value: 'r'}];
								}

								if (obj.formatDetails.format === 'printed') {
									if (Object.keys(obj.seriesDetails).length > 0) {
										return [{index: 0, value: 't'}, {index: 1, value: 'a'}];
									}
								}
							}
						}

						function gen008() {
							const rules = makeRules();
							const chars = new Array(40).fill(' ').map((_, index) => {
								const entry = rules.reduce((acc, item) => {
									if (isNaN(Number(item.index))) {
										const indexArray = item.index.split('-');
										const valueArray = item.value.split('');
										for (let init = Number(indexArray[0]), count = 0; init <= indexArray[1]; init++, count++) {
											if (index === init) {
												acc.push({index: index, value: valueArray[count]});
											}
										}
									}

									if (item.index === index) {
										acc.push(item);
									}

									return acc;
								}, []);

								if (entry.length > 0) {
									return entry[0].value;
								}

								return ' ';
							});

							marcRecord.insertField({
								tag: '008', value: chars.join('')
							});
							// ************************ $33 fiction/non-fiction/cartoon not implemented yet **************************************
							function makeRules() {
								const baseChars = [
									{index: 6, value: value06()},
									{index: '7-10', value: obj.publicationTime.substr(0, 4)},
									{index: '35-37', value: obj.language},
									{index: 38, value: '|'}
								];

								if (Object.keys(obj.seriesDetails).length > 0) {
									const seriesChars = [
										{index: '11-14', value: value1114()},
										{index: '15-17', value: ' fi'},
										{index: 19, value: 'r'},
										{index: 21, value: 'p'},
										{index: 22, value: '|'},
										{index: 29, value: '0'},
										{index: '30-32', value: '|||'},
										{index: 33, value: 'b'},
										{index: 34, value: '0'}
									];
									if (obj.formatDetails.format === 'electronic') {
										return baseChars.concat(seriesChars, [{index: 23, value: 'o'}]);
									}

									if (obj.formatDetails.format === 'printed') {
										return baseChars.concat(seriesChars);
									}
								}

								if (obj.type === 'book') {
									const bookChars = [
										{index: '15-17', value: ' fi'},
										{index: 29, value: '|'},
										{index: 30, value: '0'},
										{index: 31, value: '|'},
										{index: 33, value: '0'},
										{index: 34, value: '|'}
									];
									if (obj.formatDetails.format === 'electronic') {
										return baseChars.concat(bookChars, [{index: 23, value: 'o'}]);
									}

									if (obj.formatDetails.format === 'printed') {
										return baseChars.concat(bookChars);
									}
								}

								if (obj.type === 'dissertation') {
									const dissertationChars = [
										{index: '15-17', value: ' fi'},
										{index: '18-21', value: '||||'},
										{index: 24, value: 'm'},
										{index: 29, value: '|'},
										{index: 30, value: '0'},
										{index: 31, value: '|'},
										{index: 33, value: '0'},
										{index: 34, value: '|'}
									];
									if (obj.formatDetails.format === 'electronic') {
										return baseChars.concat(dissertationChars, [{index: 22, value: '^'}, {index: 23, value: 'o'}]);
									}

									if (obj.formatDetails.format === 'printed') {
										return baseChars.concat(dissertationChars);
									}
								}

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
							}
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
							if (obj.type === 'dissertation' || Object.keys(obj.seriesDetails).length > 0) {
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
							if (obj.type === 'dissertation' || Object.keys(obj.seriesDetails).length > 0) {
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
							if ((obj.formatDetails.format === 'printed' && obj.type === 'dissertation') || Object.keys(obj.seriesDetails).length > 0) {
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
							if ((obj.formatDetails.format === 'printed' && obj.type === 'dissertation') || Object.keys(obj.seriesDetails).length > 0) {
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
							if (Object.keys(obj.seriesDetails).length > 0 || obj.type === 'dissertation') {
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
					}
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
}
