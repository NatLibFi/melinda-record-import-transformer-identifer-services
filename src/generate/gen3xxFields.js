import {isAudio, isElectronic, isPrinted} from './util';

export function gen310(marcRecord, obj) {
  if (obj.publicationType === 'issn') {
    if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
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

export function gen336(marcRecord, obj) {
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
    if ((isPrinted(obj) || isElectronic(obj)) && obj.type !== 'music') {
      if (val === 'a') {
        return 'teksti';
      }

      if (val === 'b') {
        return 'txt';
      }
    }

    if (isAudio(obj) && (obj.type !== 'music' && obj.type !== 'dissertation')) {
      if (val === 'a') {
        return 'puhe';
      }

      if (val === 'b') {
        return 'spw';
      }
    }

    if (obj.type === 'music') {
      return val === 'a' ? 'nuottikirjoitus' : 'ntm';
    }
  }
}

export function gen337(marcRecord, obj) {
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
      if (isPrinted(obj)) {
        return 'käytettävissä ilman laitetta';
      }

      if (isElectronic(obj)) {
        return 'tietokonekäyttöinen';
      }

      if (isAudio(obj) && (obj.type !== 'dissertation' && obj.type !== 'music')) {
        return 'audio';
      }
    }
    if (obj.publicationType === 'issn') {
      if (isPrinted(obj)) {
        return 'käytettävissä ilman laitetta';
      }

      if (isElectronic(obj)) {
        return 'tietokonekäyttöinen';
      }

      if (isAudio(obj)) {
        return 'audio';
      }
    }
  }


  function bValue() {
    if (obj.publicationType === 'isbn-ismn') {
      if (isPrinted(obj)) {
        return 'n';
      }

      if (isElectronic(obj)) {
        return 'c';
      }

      if (isAudio(obj) && obj.type === 'book') {
        return 's';
      }
    }

    if (obj.publicationType === 'issn') {
      if (isPrinted(obj)) {
        return 'n';
      }

      if (isElectronic(obj)) {
        return 'c';
      }

      if (isAudio(obj)) {
        return 's';
      }
    }
  }
}

export function gen338(marcRecord, obj) {
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
      if (isPrinted(obj)) {
        return 'nide';
      }

      if (isElectronic(obj)) {
        return 'verkkoaineisto';
      }

      if (isAudio(obj) && obj.type === 'book') {
        const value = marcRecord.get(/^020$/u)[0].subfields.filter(val => val.code === 'q');
        if (value[0].value === undefined) {
          return 'äänilevy';
        }

        if (value[0].value === 'mp3') {
          return 'verkkoaineisto';
        }
      }
    }

    if (obj.publicationType === 'issn') {
      if (isPrinted(obj)) {
        return 'nide';
      }

      if (obj.formatDetails.format === 'online') {
        return 'verkkoaineisto';
      }

      if (isAudio(obj)) {
        return 'äänilevy';
      }
    }
  }

  function bValue() {
    if (obj.publicationType === 'isbn-ismn') {
      if (isPrinted(obj)) {
        return 'nc';
      }

      if (isElectronic(obj)) {
        return 'cr';
      }

      if (isAudio(obj) && obj.type === 'book') {
        return 'sd';
      }
    }

    if (obj.publicationType === 'issn') {
      if (isPrinted(obj)) {
        return 'nc';
      }

      if (obj.formatDetails.format === 'online') {
        return 'cr';
      }

      if (isAudio(obj)) {
        return 'sd';
      }
    }
  }
}

export function gen362(marcRecord, obj) {
  if (obj.publicationType === 'issn') {
    return marcRecord.insertField({
      tag: '362',
      ind1: '0',
      ind2: '_',
      subfields: [
        {
          code: 'a',
          value: obj.firstNumber
        }
      ]
    });
  }
}
