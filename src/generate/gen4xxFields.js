export function gen490(marcRecord, obj) {
  if (obj.publicationType === 'issn') {
    return;
  }
  if (obj.seriesDetails) {
    return marcRecord.insertField({
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
}
