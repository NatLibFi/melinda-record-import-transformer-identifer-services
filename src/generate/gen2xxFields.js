import {isAudio, isElectronic, isPrinted, valuePublicationTime} from './util';

export function gen222(marcRecord, obj) {
  if (obj.publicationType === 'issn') {
    if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
      if (obj.formatDetails.multiFormat) {
        return marcRecord.insertField({
          tag: '222',
          ind1: '_',
          ind2: '0',
          subfields: [
            {
              code: 'a',
              value: `${obj.title}${obj.subtitle ? ' :' : '.'}`
            },
            {
              code: 'b',
              value: valueSubFieldb()
            }
          ]
        });
      }
      return marcRecord.insertField({
        tag: '222',
        ind1: '_',
        ind2: '0',
        subfields: [
          {
            code: 'a',
            value: `${obj.title}${obj.subtitle ? ' :' : '.'}`
          }
        ]
      });
    }
  }

  function valueSubFieldb() {
    if (isPrinted(obj)) {
      return 'Painettu';
    }

    if (isElectronic(obj)) {
      return 'Verkkoaineisto';
    }
  }
}

export function gen245(marcRecord, obj) {
  if (obj.publicationType === 'isbn-ismn' || obj.publicationType === 'issn') {
    if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
      marcRecord.insertField({
        tag: '245',
        ind1: ind1(),
        ind2: '0',
        subfields: [
          {
            code: 'a',
            value: `${obj.title}${obj.subtitle ? ' :' : '.'}`
          }
        ]
      });
      return marcRecord.insertField({
        tag: '245',
        subfields: [
          {
            code: 'b',
            value: `${obj.subtitle}.`
          }
        ]
      });
    }
  }

  function ind1() {
    if (marcRecord.get(/^100$/u).length > 0) {
      return '1';
    }

    return '0';
  }
}

export function gen250(marcRecord, obj) {
  if (obj.publicationType === 'isbn-ismn') {
    if ((isPrinted(obj) || isElectronic(obj) || isAudio(obj)) && obj.type !== 'dissertation' && obj.formatDetails.edition) {
      return marcRecord.insertField({
        tag: '250',
        subfields: [
          {
            code: 'a',
            value: `${obj.formatDetails.edition}.`
          }
        ]
      });
    }
  }
}

export function gen255(marcRecord, obj) {
  if (obj.publicationType === 'isbn-ismn') {
    if ((isPrinted(obj) || isElectronic(obj)) && obj.type === 'map' && obj.mapDetails && obj.mapDetails.scale) {
      return marcRecord.insertField({
        tag: '255',
        subfields: [
          {
            code: 'a',
            value: obj.mapDetails.scale
          }
        ]
      });
    }
  }
}

export function gen263(marcRecord, obj) {
  marcRecord.insertField({
    tag: '263',
    subfields: [
      {
        code: 'a',
        value: aValue()
      }
    ]
  });

  function aValue() {
    if (obj.publicationType === 'isbn-ismn') {
      if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
        return obj.publicationTime.slice(0, 4) + obj.publicationTime.slice(5, 7);
      }
    }

    if (obj.publicationType === 'issn') {
      if (isPrinted(obj) || isElectronic(obj) || isAudio(obj)) {
        return `${obj.firstYear}--`;
      }
    }
  }
}

export function gen264(marcRecord, obj) {
  if (isPrinted(obj)) {
    if (obj.formatDetails.city && obj.manufacturer) {
      return marcRecord.insertField({
        tag: '264',
        ind1: '#',
        ind2: '3',
        subfields: [
          {
            code: 'a',
            value: `${obj.formatDetails.city} :`
          },
          {
            code: 'b',
            value: `${obj.manufacturer}`
          }
        ]
      });
    }

    if (!obj.formatDetails.city && obj.manufacturer) {
      return marcRecord.insertField({
        tag: '264',
        ind1: '#',
        ind2: '3',
        subfields: [
          {
            code: 'b',
            value: `${obj.manufacturer}`
          }
        ]
      });
    }

    if (obj.formatDetails.city && !obj.manufacturer) {
      return marcRecord.insertField({
        tag: '264',
        ind1: '#',
        ind2: '3',
        subfields: [
          {
            code: 'a',
            value: `${obj.formatDetails.city} :`
          }
        ]
      });
    }

    return marcRecord.insertField({
      tag: '264',
      ind1: '#',
      ind2: '1',
      subfields: [
        {
          code: 'a',
          value: `${obj.publisher.postalAddress.city} :`
        },
        {
          code: 'b',
          value: `${obj.publisher.name},`
        },
        {
          code: 'c',
          value: valuePublicationTime(obj)
        }
      ]
    });
  }

  return marcRecord.insertField({
    tag: '264',
    ind1: '#',
    ind2: '1',
    subfields: [
      {
        code: 'a',
        value: `${obj.publisher.postalAddress.city} :`
      },
      {
        code: 'b',
        value: `${obj.publisher.name},`
      },
      {
        code: 'c',
        value: valuePublicationTime(obj)
      }
    ]
  });
}
