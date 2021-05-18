import {isElectronic, isPrinted} from './util';

export function gen502(marcRecord, obj) {
  if (obj.publicationType === 'issn') {
    return;
  }

  if ((isElectronic(obj) || isPrinted(obj)) && obj.type === 'dissertation') {
    return marcRecord.insertField({
      tag: '502',
      subfields: [
        {
          code: 'a',
          value: `${obj.type},`
        },
        {
          code: 'c',
          value: obj.publisher.university.name
        },
        {
          code: '9',
          value: 'FENNI<KEEP>'
        }
      ]
    });
  }
}

export function gen511(marcRecord, obj) {
  if (obj.publicationType === 'issn') {
    return;
  }

  if (obj.publicationType === 'isbn-ismn' && obj.authors.some(item => item.role === 'lukija')) {
    return marcRecord.insertField({
      tag: '511',
      ind1: 0,
      subfields: [
        {
          code: 'a',
          value: 'Lukija'
        },
        {
          code: 'g',
          value: 'KEEP.'
        }
      ]
    });
  }
}

export function gen594(marcRecord, obj) {
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

