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

import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen-http-client';
import createSruClient from '@natlibfi/sru-client';
import {convertRecord} from './transform';
import {READERS} from '@natlibfi/fixura';

describe('transform', () => {
  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'transform'],
    fixura: {
      reader: READERS.JSON
    }
  });

  async function callback({getFixture, defaultParameters}) {
    const client = createSruClient({...defaultParameters, url: 'http://foo.bar'});
    const incomingRecord = getFixture('incomingRecord.json');
    const expectedOutput = getFixture('expectedOutput.json');
    const result = await convertRecord(incomingRecord, client);

    // Expect records to be marc records
    expect(result).to.eql(expectedOutput);
  }
});
