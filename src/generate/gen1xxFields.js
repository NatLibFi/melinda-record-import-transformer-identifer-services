import {isAudio, isElectronic, isPrinted} from './util';

export function gen100(marcRecord, obj) {
  if (obj.publicationType === 'isbn-ismn' && (obj.authors.some(item => item.role === 'tekijä') || obj.type === 'dissertation')) {
    if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
      const author = obj.authors.filter(item => item.role === 'tekijä');
      return marcRecord.insertField({
        tag: '100',
        ind1: '1',
        ind2: '_',
        subfields: [
          {
            code: 'a',
            value: `${author[0].givenName}, ${author[0].familyName}`
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
