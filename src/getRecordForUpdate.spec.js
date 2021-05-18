import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen-http-client';
import createSruClient from '@natlibfi/sru-client';
import {getMissingRecordInfo} from './getRecordForUpdate';
import {MarcRecord} from '@natlibfi/marc-record';
import {READERS} from '@natlibfi/fixura';

describe('getRecordForUpdate', () => {

  generateTests({
    callback,
    path: [__dirname, '..', 'test-fixtures', 'getRecordForUpdates'],
    fixura: {
      reader: READERS.JSON
    }
  });

  async function callback({getFixture, defaultParameters, emptyRecord}) {
    const client = createSruClient({...defaultParameters, url: 'http://foo.bar'});
    const incomingRecord = emptyRecord
      ? new MarcRecord(undefined, {subfieldValues: false})
      : new MarcRecord(getFixture('incomingRecord.json'), {subfieldValues: false});
    const expectedOutput = getFixture('expectedOutput.json');
    const result = await getMissingRecordInfo(incomingRecord, '001234567', client);

    // Expect records to be marc records
    expect(result).to.eql(expectedOutput);
  }
});
