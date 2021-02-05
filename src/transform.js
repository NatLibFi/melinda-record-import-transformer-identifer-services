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

  function readStream(stream) {
    try {
      const promises = [];
      const pipeline = chain([
        stream,
        parser(),
        streamArray()
      ]).on('error', err => Emitter.emit('error', err));

      pipeline.on('data', data => {
        promises.push(transform(data.value)); // eslint-disable-line functional/immutable-data

        function transform(value) {
          try {
            const result = convertRecord(value);
            Emitter.emit('record', result);
          } catch (err) {
            Emitter.emit('error', err);
          }
        }
      });
      pipeline.on('end', async () => {
        try {
          logger.log('debug', `Handled ${promises.length} recordEvents`);
          await Promise.all(promises);
          Emitter.emit('end', promises.length);
        } catch (err) {
          Emitter.emit('error', err);
        }
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
    return {failed: false, record: marcRecord};

    function genLeader() {
      const rules = makeRules();
      const chars = new Array(24).fill(' ')
        .map((_, index) => {
          const entry = rules.find(({index: ruleIndex}) => ruleIndex === index);
          if (entry) {
            return entry.value;
          }

          return ' ';
        });

      marcRecord.leader = chars.join(''); // eslint-disable-line functional/immutable-data

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

        return baseChars;

        function value08() {
          if (obj.publicationType === 'isbn-ismn') {
            if (obj.formatDetails.format === 'printed' && obj.type === 'book') {
              return ' ';
            }
            if (obj.formatDetails.format === 'printed' && obj.type === 'dissertation') {
              return '^';
            }
          }

          if (obj.publicationType === 'issn') {
            if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'audio') && obj.type === 'serial') {
              return '^';
            }
          }
        }

        function value07() {
          if (obj.publicationType === 'isbn-ismn') {
            return 'm';
          }

          if (obj.publicationType === 'issn') {
            return 's';
          }
        }
      }
    }

    function gen007() {
      const rules = makeRules();
      const chars = new Array(23).fill(' ')
        .map((_, index) => {
          const entry = rules && rules.find(({index: ruleIndex}) => ruleIndex === index);
          if (entry) {
            return entry.value;
          }

          return _;
        });

      marcRecord.insertField({
        tag: '007', value: chars.join('')
      });

      function makeRules() {
        if (obj.publicationType === 'isbn-ismn') {
          if (obj.formatDetails.format === 'electronic' && (obj.type === 'book' || obj.type === 'dissertation')) {
            const initialChars = [
              {index: 0, value: 'c'},
              {index: 1, value: 'r'}
            ];

            const finalChars = new Array(21).fill(' ')
              .map((_, index) => ({index: index + initialChars.length, value: ' '}));
            return initialChars.concat(finalChars);
          }

          if (obj.formatDetails.format === 'audio' && obj.type === 'book') {
            const initialChars = [
              {index: 0, value: 's'},
              {index: 1, value: 'd'}
            ];

            const finalChars = new Array(21).fill(' ')
              .map((_, index) => ({index: index + initialChars.length, value: '|'}));
            return initialChars.concat(finalChars);
          }
        }

        if (obj.publicationType === 'issn') {
          if (obj.formatDetails.format === 'printed' && obj.type === 'serial') {
            const initialChars = [
              {index: 0, value: 't'},
              {index: 1, value: 'a'}
            ];

            const finalChars = new Array(21).fill(' ')
              .map((_, index) => ({index: index + initialChars.length, value: ' '}));
            return initialChars.concat(finalChars);
          }

          if (obj.formatDetails.format === 'electronic' && obj.type === 'serial') {
            const initialChars = [
              {index: 0, value: 'c'},
              {index: 1, value: 'r'}
            ];

            const finalChars = new Array(21).fill(' ')
              .map((_, index) => ({index: index + initialChars.length, value: '|'}));
            return initialChars.concat(finalChars);
          }

          if (obj.formatDetails.format === 'audio' && obj.type === 'serial') {
            const initialChars = [
              {index: 0, value: 's'},
              {index: 1, value: 'd'}
            ];

            const finalChars = new Array(21).fill(' ')
              .map((_, index) => ({index: index + initialChars.length, value: ' '}));
            return initialChars.concat(finalChars);
          }
        }
      }
    }

    function gen008() {
      const rules = makeRules();
      const chars = new Array(40).fill(' ')
        .map((_, index) => {
          const entry = rules && rules.find(({index: ruleIndex}) => ruleIndex === index);
          if (entry) {
            return entry.value;
          }

          return ' ';
        });

      marcRecord.insertField({
        tag: '008', value: chars.join('')
      });

      // ************************ $33 fiction/non-fiction/cartoon not implemented yet **************************************

      function makeRules() {
        // Works in a condition when there is no publication time in Issn. Need to check this later
        const baseChars = obj.publicationTime
          ? [
            {index: 6, value: value06()},
            {index: 38, value: '|'}
          ].concat(gen0710(), gen3537())
          : [
            {index: 6, value: value06()},
            {index: 38, value: '|'}
          ]
            .concat(gen3537());

        if (obj.publicationType === 'issn') {
          const seriesChars = [
            {index: 19, value: 'r'},
            {index: 21, value: 'p'},
            {index: 22, value: '|'},
            {index: 29, value: '0'},
            {index: 33, value: 'b'},
            {index: 34, value: '0'}
          ].concat(gen1114(), gen1517(), gen3032());

          if (obj.formatDetails.format === 'electronic') {
            return baseChars.concat(seriesChars, [{index: 23, value: 'o'}]);
          }

          if (obj.formatDetails.format === 'printed') {
            return baseChars.concat(seriesChars);
          }
        }

        if (obj.type === 'book') {
          const bookChars = [
            {index: 29, value: '|'},
            {index: 30, value: '0'},
            {index: 31, value: '|'},
            {index: 33, value: '0'},
            {index: 34, value: '|'}
          ].concat(gen1517());

          if (obj.formatDetails.format === 'electronic') {
            return baseChars.concat(bookChars, [{index: 23, value: 'o'}]);
          }

          if (obj.formatDetails.format === 'printed') {
            return baseChars.concat(bookChars);
          }
        }

        if (obj.type === 'dissertation') {
          const dissertationChars = [
            {index: 24, value: 'm'},
            {index: 29, value: '|'},
            {index: 30, value: '0'},
            {index: 31, value: '|'},
            {index: 33, value: '0'},
            {index: 34, value: '|'}
          ].concat(gen1517(), gen1821());

          if (obj.formatDetails.format === 'electronic') {
            return baseChars.concat(dissertationChars, [
              {index: 22, value: '^'},
              {index: 23, value: 'o'}
            ]);
          }

          if (obj.formatDetails.format === 'printed') {
            return baseChars.concat(dissertationChars);
          }
        }

        function value06() {
          if (obj.publicationType === 'issn') {
            return 'c';
          }

          if (obj.publicationType === 'isbn-ismn') {
            return 's';
          }
        }

        function gen1114() {
          if (obj.publicationType === 'issn') {
            return generate('9999', 11);
          }
        }

        function gen0710() {
          return obj.publicationTime && generate(obj.publicationTime.slice(0, 4), 7);
        }

        function gen1517() {
          return generate(' fi', 15);
        }

        function gen1821() {
          return generate('||||', 18);
        }

        function gen3032() {
          return generate('|||', 30);
        }

        function gen3537() {
          return generate(obj.language, 35);
        }

        function generate(string, startIndex) {
          return string.split('').map((value, index) => ({value, index: index + startIndex}));
        }
      }
    }

    function gen020() {
      if (obj.publicationType === 'isbn-ismn') {
        marcRecord.insertField({
          tag: '020',
          subfields: [
            {
              code: 'a',
              value: 'to do later' // Not clear specification
            },
            {
              code: 'q',
              value: 'to do later' // Not clear specification
            }

          ]
        });

        if (obj.seriesDetails && obj.seriesDetails.volume > 1) {
          return marcRecord.insertField({
            tag: '020',
            subfields: [
              {
                code: 'a',
                value: 'something' // Not clear specification
              },
              {
                code: 'q',
                value: 'to do later' // Not clear specification
              }
            ]
          });
        }
      }
      // ****************** $a another ISBN, if the book is a part of a multi-volume publication is left to implement ********************************
    }

    function gen022() {
      if (obj.publicationType === 'issn') {
        if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && obj.type === 'serial') {
          return marcRecord.insertField({
            tag: '022',
            ind1: '0',
            ind2: '_',
            subfields: [
              {
                code: 'a',
                value: `${obj.identifier}`
              },
              {
                code: '2',
                value: 'a'
              }
            ]
          });
        }
      }
    }

    function gen040() {
      if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && (obj.type === 'book' || obj.type === 'dissertation' || obj.type === 'serial')) {
        return marcRecord.insertField({
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
    }

    function gen041() {
      if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && (obj.type === 'book' || obj.type === 'dissertation' || obj.type === 'serial')) {
        return marcRecord.insertField({
          tag: '041',
          ind1: '0',
          ind2: '_',
          subfields: [
            {
              code: selectCode(),
              value: `${obj.language}`
            }
          ]
        });
      }

      function selectCode() {
        if (obj.formatDetails.format === 'audio' && (obj.type === 'book' || obj.type === 'serial')) {
          return 'd';
        }

        return 'a';
      }
    }

    function gen042() {
      if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && (obj.type === 'book' || obj.type === 'dissertation' || obj.type === 'serial')) {
        return marcRecord.insertField({
          tag: '042',
          subfields: [
            {
              code: 'a',
              value: 'finb'
            }
          ]
        });
      }
    }

    function gen080() {
      if (obj.type === 'dissertation' || obj.publicationType === 'issn') {
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
      if (obj.publicationType === 'isbn-ismn' && (obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic')) {
        return marcRecord.insertField({
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
      }

      // *********************** If Finnish cartoon is not implemented yet ***************************
    }

    function gen100() {
      if (obj.publicationType === 'isbn-ismn' && obj.authors.some(item => item.role === 'author')) {
        if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && (obj.type === 'dissertation' || obj.type === 'book')) {
          const author = obj.authors.filter(item => item.role === 'author');
          return marcRecord.insertField({
            tag: '100',
            ind1: '1',
            ind2: '_',
            subfields: [
              {
                code: 'a',
                value: `${author[0].givenName} ${author[0].familyName}`
              },
              {
                code: 'e',
                value: author[0].role
              },
              {
                code: 'g',
                value: 'ENNAKKOTIETO.'
              }
            ]
          });
        }
      }
    }

    function gen222() {
      if (obj.publicationType === 'issn') {
        if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && obj.type === 'serial') {
          return marcRecord.insertField({
            tag: '222',
            ind1: '_',
            ind2: '0',
            subfields: [
              {
                code: 'a',
                value: ''
              },
              {
                code: 'b',
                value: valueSubFieldb() // If there is another publication form (printed)
              }
            ]
          });
        }
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
      if (obj.publicationType === 'isbn-ismn' || obj.publicationType === 'issn') {
        if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && (obj.type === 'book' || obj.type === 'dissertation' || obj.type === 'serial')) {
          return marcRecord.insertField({
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
        }
      }

      function ind1() {
        if (marcRecord.get(/^100$/u).length > 0) {
          return '1';
        }

        return '0';
      }
    }

    function gen250() {
      if (obj.publicationType === 'isbn-ismn') {
        if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic') && obj.type === 'book') {
          return marcRecord.insertField({
            tag: '250',
            subfields: [
              {
                code: 'a',
                value: '.' // To be added later
              }
            ]
          });
        }
      }
    }

    function gen255() {
      if (obj.publicationType === 'isbn-ismn') {
        if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic') && obj.type === 'book') {
          return marcRecord.insertField({
            tag: '255',
            subfields: [
              {
                code: 'a',
                value: 'NOT CLEAR IN SPECIFICATION' // Scale, for example a map on a scale of 15:000
              }
            ]
          });
        }
      }
    }

    function gen263() {
      marcRecord.insertField({
        tag: '263',
        subfields: [
          {
            code: 'a',
            value: aValue()
          }
        ]
      });

      function aValue() {
        if (obj.publicationType === 'isbn-ismn') {
          if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && (obj.type === 'book' || obj.type === 'dissertation')) {
            return obj.publicationTime.slice(0, 4) + obj.publicationTime.slice(5, 7);
          }
        }

        if (obj.publicationType === 'issn') {
          if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && obj.type === 'serial') {
            return `${obj.firstYear}--`;
          }
        }
      }
    }

    function gen264() {
      marcRecord.insertField({
        tag: '264',
        ind1: '_',
        ind2: '1',
        subfields: [
          {
            code: 'a',
            value: `${obj.city} :`
          },
          {
            code: 'b',
            value: `${obj.publisher},`
          },
          {
            code: 'c',
            value: obj.publicationTime && `${obj.publicationTime.substr(0, 4)}.`
          }
        ]
      });

      if (obj.formatDetails.format === 'printed') {
        return marcRecord.insertField({
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
      if (obj.publicationType === 'issn') {
        if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') && obj.type === 'serial') {
          return marcRecord.insertField({
            tag: '310',
            subfields: [
              {
                code: 'a',
                value: obj.frequency
              }
            ]
          });
        }
      }
    }

    function gen336() {
      marcRecord.insertField({
        tag: '336',
        subfields: [
          {
            code: 'a',
            value: aValue('a')
          },
          {
            code: 'b',
            value: aValue('b')
          },
          {
            code: '2',
            value: 'rdacontent'
          }
        ]
      });


      function aValue(val) {
        if (obj.publicationType === 'isbn-ismn' || obj.publicationType === 'issn') {
          if ((obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic') && (obj.type === 'dissertation' || obj.type === 'book')) {
            if (val === 'a') {
              return 'teksti';
            }

            if (val === 'b') {
              return 'txt';
            }
          }

          if (obj.formatDetails.format === 'audio' && (obj.type === 'book' || obj.type === 'serial')) {
            if (val === 'a') {
              return 'puhe';
            }

            if (val === 'b') {
              return 'spw';
            }
          }
        }
      }
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
        if (obj.publicationType === 'isbn-ismn') {
          if (obj.formatDetails.format === 'printed' && (obj.type === 'dissertation' || obj.type === 'book')) {
            return 'käytettävissä ilman laitetta';
          }

          if (obj.formatDetails.format === 'electronic' && (obj.type === 'dissertation' || obj.type === 'book')) {
            return 'tietokonekäyttöinen';
          }

          if (obj.formatDetails.format === 'audio' && obj.type === 'book') {
            return 'audio';
          }
        }
        if (obj.publicationType === 'issn') {
          if (obj.formatDetails.format === 'printed') {
            return 'käytettävissä ilman laitetta';
          }

          if (obj.formatDetails.format === 'electronic') {
            return 'tietokonekäyttöinen';
          }

          if (obj.formatDetails.format === 'audio') {
            return 'audio';
          }
        }
      }


      function bValue() {
        if (obj.publicationType === 'isbn-ismn') {
          if (obj.formatDetails.format === 'printed' && (obj.type === 'dissertation' || obj.type === 'book')) {
            return 'n';
          }

          if (obj.formatDetails.format === 'electronic' && (obj.type === 'dissertation' || obj.type === 'book')) {
            return 'c';
          }

          if (obj.formatDetails.format === 'audio' && obj.type === 'book') {
            return 's';
          }
        }

        if (obj.publicationType === 'issn') {
          if (obj.formatDetails.format === 'printed') {
            return 'n';
          }

          if (obj.formatDetails.format === 'electronic') {
            return 'c';
          }

          if (obj.formatDetails.format === 'audio') {
            return 's';
          }
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
        if (obj.publicationType === 'isbn-ismn') {
          if (obj.formatDetails.format === 'printed' && (obj.type === 'dissertation' || obj.type === 'book')) {
            return 'nide';
          }

          if (obj.formatDetails.format === 'electronic' && (obj.type === 'dissertation' || obj.type === 'book')) {
            return 'verkkoaineisto';
          }

          if (obj.formatDetails.format === 'audio' && obj.type === 'book') {
            const value = marcRecord.get(/^020$/u)[0].subfields.filter(val => val.code === 'q');
            if (value[0].value === undefined) {
              return 'äänilevy';
            }

            if (value[0].value === 'MP3') {
              return 'verkkoaineisto';
            }
          }
        }

        if (obj.publicationType === 'issn') {
          if (obj.formatDetails.format === 'printed') {
            return 'nide';
          }

          if (obj.formatDetails.format === 'electronic') {
            return 'verkkoaineisto';
          }

          if (obj.formatDetails.format === 'audio') {
            return 'äänilevy';
          }
        }
      }

      function bValue() {
        if (obj.publicationType === 'isbn-ismn') {
          if (obj.formatDetails.format === 'printed' && (obj.type === 'dissertation' || obj.type === 'book')) {
            return 'nc';
          }

          if (obj.formatDetails.format === 'electronic' && (obj.type === 'dissertation' || obj.type === 'book')) {
            return 'cr';
          }

          if (obj.formatDetails.format === 'audio' && obj.type === 'book') {
            return 'sd';
          }
        }

        if (obj.publicationType === 'issn') {
          if (obj.formatDetails.format === 'printed') {
            return 'nc';
          }

          if (obj.formatDetails.format === 'electronic') {
            return 'cr';
          }

          if (obj.formatDetails.format === 'audio') {
            return 'sd';
          }
        }
      }
    }

    function gen362() {
      if (obj.publicationType === 'issn') {
        return marcRecord.insertField({
          tag: '362',
          ind1: '0',
          ind2: '_',
          subfields: [
            {
              code: 'a',
              value: 'To do later' // No number or volume in schema for ISSN there is main series and sub series with title and identifier
            }
          ]
        });
      }
    }

    function gen490() {
      if (obj.publicationType === 'issn') {
        return;
      }

      marcRecord.insertField({
        tag: '490',
        ind1: '0',
        ind2: '_',
        subfields: [
          {
            code: 'a',
            value: obj.seriesDetails && `${obj.seriesDetails.title},`
          },
          {
            code: 'x',
            value: obj.seriesDetails && `${obj.seriesDetails.identifier} ;`
          },
          {
            code: 'v',
            value: obj.seriesDetails && `${obj.seriesDetails.volume}`
          }
        ]
      });
    }

    function gen502() {
      if (obj.publicationType === 'issn') {
        return;
      }

      if ((obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'printed') && obj.type === 'dissertation') {
        return marcRecord.insertField({
          tag: '502',
          subfields: [
            {
              code: 'a',
              value: `${obj.type},`
            },
            {
              code: 'c',
              value: '{name of the university, ends with period}' // No university field in schema provided
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

      if (obj.publicationType === 'isbn-ismn') {
        return marcRecord.insertField({
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
      if (obj.publicationType === 'isbn-ismn' && obj.authors.some(item => item.role === 'editor' || item.role === 'illustrator' || item.role === 'translator')) {
        if (obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'audio') {
          return marcRecord.insertField({
            tag: '700',
            ind1: '1',
            ind2: '_',
            subfields: [
              {
                code: 'a',
                value: `${obj.authors[0].givenName}, ${obj.authors[0].familyName}`
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
        }
      }
    }

    function gen710() {
      if (obj.publicationType === 'issn') {
        return marcRecord.insertField({
          tag: '710',
          ind1: '2',
          ind2: '_',
          subfields: [
            {
              code: 'a',
              value: `${obj.publisher}.`
            }
          ]
        });
      }
    }

    function gen760() {
      if (obj.publicationType === 'issn' && obj.seriesDetails && obj.seriesDetails.mainSeries) {
        return marcRecord.insertField({
          tag: '760',
          ind1: '0',
          ind2: '0',
          subfields: valueSubfields()
        });
      }

      function valueSubfields() {
        if (obj.formatDetails.format === 'printed' || obj.formatDetails.format === 'electronic' || obj.formatDetails.format === 'serial') {
          const subfields = [
            {
              code: 't',
              value: `${obj.seriesDetails.mainSeries.title}`
            },
            {
              code: 'x',
              value: `${obj.seriesDetails.mainSeries.identifier}`
            },
            {
              code: '9',
              value: 'FENNI<KEEP>'
            }
          ];
          return subfields;
        }
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
        if (obj.publicationType === 'issn') {
          return subfields.concat({code: 't', value: '{title from another form'}, {code: 'x', value: '{ISSN from another form}'}); // Another Form not clear
        }

        return subfields.concat({code: 'z', value: '{ISBN from another form}'});
      }
    }

    function gen780() {
      if (obj.publicationType === 'issn' && obj.previousPublication) {
        return marcRecord.insertField({
          tag: '780',
          ind1: '0',
          ind2: '0',
          subfields: [
            {
              code: 't',
              value: `${obj.previousPublication.title}`
            },
            {
              code: 'c',
              value: '{Not Specified}' // Not specified
            },
            {
              code: 'x',
              value: `${obj.previousPublication.identifier}`
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
      if (obj.publicationType === 'issn') {
        return marcRecord.insertField({
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
