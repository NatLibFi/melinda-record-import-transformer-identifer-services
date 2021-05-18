import {isAudio, isElectronic, isPrinted} from './util';

export function gen700(marcRecord, obj) {
  if (obj.publicationType === 'isbn-ismn' && obj.authors.some(item => item.role === 'toimittaja' || item.role === 'kääntäjä' || item.role === 'kuvittaja' || item.role === 'lukija')) {
    if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
      return marcRecord.insertField({
        tag: '700',
        ind1: '1',
        ind2: '_',
        subfields: [
          {
            code: 'a',
            value: `${obj.authors[0].givenName}, ${obj.authors[0].familyName}`
          },
          {
            code: 'e',
            value: obj.authors[0].role
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

export function gen710(marcRecord, obj) {
  if (obj.publicationType === 'issn') {
    return marcRecord.insertField({
      tag: '710',
      ind1: '2',
      ind2: '_',
      subfields: [
        {
          code: 'a',
          value: `${obj.publisher.name}.`
        }
      ]
    });
  }
}

export function gen760(marcRecord, obj) {
  if (obj.publicationType === 'issn' && obj.seriesDetails && obj.seriesDetails.mainSeries) {
    return marcRecord.insertField({
      tag: '760',
      ind1: '0',
      ind2: '0',
      subfields: valueSubfields()
    });
  }

  function valueSubfields() {
    if (isPrinted(obj) || isElectronic(obj)) {
      const subfields = [
        {
          code: 't',
          value: `${obj.seriesDetails.mainSeries.title}`
        },
        {
          code: 'x',
          value: `${obj.seriesDetails.mainSeries.identifier}`
        },
        {
          code: '9',
          value: 'FENNI<KEEP>'
        }
      ];
      return subfields;
    }
  }
}

export function gen776(marcRecord, obj) {
  marcRecord.insertField({
    tag: '776',
    ind1: '0',
    ind2: '8',
    subfields: valueSubfields()

  });

  function aValue() {
    if (isPrinted(obj)) {
      return 'Verkkoaineisto';
    }

    if (isElectronic(obj)) {
      return 'Painettu';
    }
  }

  function valueSubfields() {
    const subfields = [
      {
        code: 'i',
        value: aValue()
      },
      {
        code: '9',
        value: 'FENNI<KEEP>'
      }
    ];
    if (obj.publicationType === 'issn') {
      return subfields.concat({code: 't', value: '{title from another form'}, {code: 'x', value: '{ISSN from another form}'}); // Identifer & title from printed or electronic format vise versa
    }

    return subfields.concat({code: 'z', value: '{ISBN from another form}'}); // Identifer from printed or electronic format vise versa
  }
}

export function gen780(marcRecord, obj) {
  if (obj.publicationType === 'issn' && obj.previousPublication) {
    return marcRecord.insertField({
      tag: '780',
      ind1: '0',
      ind2: '0',
      subfields: [
        {
          code: 't',
          value: `${obj.previousPublication.title}`
        },
        {
          code: 'x',
          value: `${obj.previousPublication.identifier}`
        },
        {
          code: '9',
          value: 'FENNI<KEEP>'
        }
      ]
    });
  }
}
