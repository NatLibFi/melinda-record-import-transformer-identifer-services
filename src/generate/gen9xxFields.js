export function gen935(marcRecord, obj) {
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
