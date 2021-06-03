import {isAudio, isElectronic, isPrinted} from './util';

export function gen020(marcRecord, obj) {
  if (obj.publicationType === 'isbn-ismn' && obj.type !== 'music') {
    if (obj.seriesDetails) { // eslint-disable-line
      marcRecord.insertField({
        tag: '020',
        subfields: [
          {
            code: 'a',
            value: obj.seriesDetails.identifier
          },
          {
            code: 'q',
            value: 'kokonaisuus'
          }
        ]
      });
    }
    obj.identifier.forEach(i => {
      marcRecord.insertField({
        tag: '020',
        subfields: [
          {
            code: 'a',
            value: i.id
          },
          {
            code: 'q',
            value: i.type
          }
        ]
      });
    });
  }
}

export function gen022(marcRecord, obj) {
  if (obj.publicationType === 'issn') {
    if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
      return marcRecord.insertField({
        tag: '022',
        ind1: '0',
        ind2: '_',
        subfields: [
          {
            code: 'a',
            value: `${obj.identifier.filter(i => i.type === obj.formatDetails.format)[0].id}`
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

export function gen024(marcRecord, obj) {
  if (obj.publicationType === 'isbn-ismn' && obj.type === 'music') {
    marcRecord.insertField({
      tag: '024',
      ind1: '2',
      ind2: '_',
      subfields: [
        {
          code: 'a',
          value: `${obj.identifier.filter(i => i.type === obj.formatDetails.format)[0].id}`
        },
        {
          code: 'q',
          value: obj.formatDetails.format
        }
      ]
    });

    /* If (part of multi volume ) {
        return marcRecord.insertField({
          tag: '024',
          ind1: '2',
          ind2: '_',
          subfields: [
            {
              code: 'a',
              value: obj.identifier // Need to fix(obj.identifier according to data)
            },
            {
              code: 'q',
              value: obj.formatDetails.printFormat
            }
          ]
        });
    } */
    return;
  }
}

export function gen040(marcRecord, obj) {
  if (isPrinted(obj) || isElectronic(obj) || isElectronic(obj) || isAudio(obj)) {
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

export function gen041(marcRecord, obj) {
  if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
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
    if (isAudio(obj) && (obj.type !== 'music' && obj.type !== 'dissertation')) {
      return 'd';
    }

    return 'a';
  }
}

export function gen042(marcRecord, obj) {
  if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
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

export function gen080(marcRecord, obj) {
  if (obj.type === 'dissertation' || obj.publicationType === 'issn' || obj.type === 'music') {
    return;
  }

  if ('3' in obj.isbnClassification) { // 3 denotes the stored value for cartoon
    return marcRecord.insertField({
      tag: '080',
      ind1: '1',
      ind2: '_',
      subfields: [
        {
          code: 'a',
          value: '741.5'
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

  if ('2' in obj.isbnClassification && '3' in obj.isbnClassification && obj.language === 'fin') {
    return marcRecord.insertField({
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
          code: 'x',
          value: '(024.7)'
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

  if ('2' in obj.isbnClassification) {
    return marcRecord.insertField({
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
  }
}

export function gen084(marcRecord, obj) {
  if (obj.publicationType === 'isbn-ismn' && obj.type !== 'music') {
    if ('2' in obj.isbnClassification && !('3' in obj.isbnClassification)) { // '2' = fiction && '3' = cartoon
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

    if ('3' in obj.isbnClassification) { // '3' is referring to cartoon
      return marcRecord.insertField({
        tag: '084',
        ind1: '_',
        ind2: '_',
        subfields: [
          {
            code: 'a',
            value: '85.32'
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
  }
}
