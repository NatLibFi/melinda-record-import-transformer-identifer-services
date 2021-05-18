/* eslint-disable max-lines */
/* eslint-disable max-statements */
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
import {SRU_URL} from './config';
import createSruClient from '@natlibfi/sru-client';
import {getMissingRecordInfo} from './getRecordForUpdate';
import {gen007, gen008} from './generate/genControlFields';
import {gen020, gen022, gen024, gen040, gen041, gen042, gen080, gen084} from './generate/gen0xxFields';
import {gen100} from './generate/gen1xxFields';
import {gen222, gen245, gen250, gen255, gen263, gen264} from './generate/gen2xxFields';
import {gen310, gen336, gen337, gen338, gen362} from './generate/gen3xxFields';
import {gen490} from './generate/gen4xxFields';
import {gen502, gen511, gen594} from './generate/gen5xxFields';
import {gen700, gen710, gen760, gen776, gen780} from './generate/gen7xxFields';
import {gen935} from './generate/gen9xxFields';
import {isAudio, isPrinted} from './generate/util';

class TransformEmitter extends EventEmitter { }
const {createLogger} = Utils;

export default function (stream) {
  MarcRecord.setValidationOptions({subfieldValues: false});
  const Emitter = new TransformEmitter();
  const logger = createLogger();
  const sruClient = createSruClient({url: SRU_URL, recordSchema: 'marcxml', retrieveAll: false});
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
            const result = convertRecord(value, sruClient);
            Emitter.emit('record', result);
          } catch (err) {
            logger.log('ERROR-ON-DATA', err);
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
          logger.log('ERROR-ON-END', err);
          Emitter.emit('error', err);
        }
      });
    } catch (err) {
      logger.log('ERROR-COMMON', err);
      Emitter.emit('error', err);
    }
  }
}

export async function convertRecord(obj, sruClient) {
  const marcRecord = obj.metadataReference && obj.metadataReference.state === 'processed' && obj.metadataReference.update === true
    ? await getMissingRecordInfo(new MarcRecord(undefined, {subfieldValues: false}), obj.metadataReference.id, sruClient)
    : new MarcRecord(undefined, {subfieldValues: false});

  genLeader(marcRecord, obj);
  gen007(marcRecord, obj);
  gen008(marcRecord, obj);
  gen020(marcRecord, obj);
  gen022(marcRecord, obj);
  gen024(marcRecord, obj);
  gen040(marcRecord, obj);
  gen041(marcRecord, obj);
  gen042(marcRecord, obj);
  gen080(marcRecord, obj);
  gen084(marcRecord, obj);
  gen100(marcRecord, obj);
  gen222(marcRecord, obj);
  gen245(marcRecord, obj);
  gen250(marcRecord, obj);
  gen255(marcRecord, obj);
  gen263(marcRecord, obj);
  gen264(marcRecord, obj);
  gen310(marcRecord, obj);
  gen336(marcRecord, obj);
  gen337(marcRecord, obj);
  gen338(marcRecord, obj);
  gen362(marcRecord, obj);
  gen490(marcRecord, obj);
  gen502(marcRecord, obj);
  gen511(marcRecord, obj);
  gen594(marcRecord, obj);
  gen700(marcRecord, obj);
  gen710(marcRecord, obj);
  gen760(marcRecord, obj);
  gen776(marcRecord, obj);
  gen780(marcRecord, obj);
  gen935(marcRecord, obj);

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

      if (isPrinted(obj)) {
        return baseChars.concat({index: '08', value: value08()});
      }

      return baseChars;

      function value08() {
        if (obj.publicationType === 'isbn-ismn') {
          if (isPrinted(obj) && obj.type !== 'music' && obj.type !== 'dissertation') {
            return ' ';
          }
          if (isPrinted(obj) && obj.type === 'dissertation') {
            return ' '; // Replaced with blank space instead of ^
          }
        }

        if (obj.publicationType === 'issn') {
          if ((isPrinted(obj) || isAudio(obj)) && obj.type === 'serial') {
            return ' '; // Replaced with blank space instead of ^
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
}
