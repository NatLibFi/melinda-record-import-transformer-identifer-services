import {MARCXML} from '@natlibfi/marc-record-serializers';

export async function getMissingRecordInfo(marcRecord, id, sruClient) {
  const record = await getRecord(id);

  insertFields(/^001$/u, record);
  insertFields(/^003$/u, record);
  insertFields(/^035$/u, record);
  insertFields(/^CAT$/u, record);

  return marcRecord;

  function getRecord(id) {
    return new Promise((resolve, reject) => {
      let promise; // eslint-disable-line functional/no-let
      sruClient.searchRetrieve(`rec.id=${id}`)
        .on('record', xmlString => {
          promise = MARCXML.from(xmlString, {subfieldValues: false});
        })
        .on('end', async () => {
          if (promise) {
            try {
              const record = await promise;
              resolve(record);
            } catch (err) {
              reject(err);
            }

            return;
          }

          resolve();
        })
        .on('error', err => reject(err));
    });
  }

  function insertFields(field, record) {
    const fields = record.get(field);
    fields.forEach(field => marcRecord.insertField(field));
  }
}
