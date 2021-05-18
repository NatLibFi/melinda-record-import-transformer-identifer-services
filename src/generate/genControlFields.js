import {isAudio, isElectronic, isPrinted} from './util';

export function gen007(marcRecord, obj) {
  const rules = makeRules();
  const chars = new Array(23).fill(' ')
    .map((_, index) => {
      const entry = rules && rules.find(({index: ruleIndex}) => ruleIndex === index);
      if (entry) {
        return entry.value;
      }

      return _;
    });
  if ((obj.publicationType === 'isbn-ismn' && isElectronic(obj)) || obj.publicationType === 'issn') { // eslint-disable-line
    return marcRecord.insertField({
      tag: '007', value: chars.join('')
    });
  }

  function makeRules() {
    if (obj.publicationType === 'isbn-ismn') {
      if (isAudio(obj) && obj.type !== 'dissertation') {
        const initialChars = [
          {index: 0, value: 's'},
          {index: 1, value: 'd'}
        ];
        const finalChars = new Array(21).fill(' ')
          .map((_, index) => ({index: index + initialChars.length, value: '|'}));
        return initialChars.concat(finalChars);
      }
      const initialChars = [
        {index: 0, value: 'c'},
        {index: 1, value: 'r'}
      ];

      const finalChars = new Array(21).fill(' ')
        .map((_, index) => ({index: index + initialChars.length, value: ' '}));
      return initialChars.concat(finalChars);
    }

    if (obj.publicationType === 'issn') {
      if (isPrinted(obj)) {
        const initialChars = [
          {index: 0, value: 't'},
          {index: 1, value: 'a'}
        ];

        const finalChars = new Array(21).fill(' ')
          .map((_, index) => ({index: index + initialChars.length, value: ' '}));
        return initialChars.concat(finalChars);
      }

      if (isElectronic(obj)) {
        const initialChars = [
          {index: 0, value: 'c'},
          {index: 1, value: 'r'}
        ];

        const finalChars = new Array(21).fill(' ')
          .map((_, index) => ({index: index + initialChars.length, value: '|'}));
        return initialChars.concat(finalChars);
      }

      if (isAudio(obj)) {
        const initialChars = [
          {index: 0, value: 's'},
          {index: 1, value: 'd'}
        ];

        const finalChars = new Array(21).fill(' ')
          .map((_, index) => ({index: index + initialChars.length, value: ' '}));
        return initialChars.concat(finalChars);
      }
    }
  }
}

export function gen008(marcRecord, obj) {
  const rules = makeRules();
  const chars = new Array(40).fill(' ')
    .map((_, index) => {
      const entry = rules && rules.find(({index: ruleIndex}) => ruleIndex === index);
      if (entry) {
        return entry.value;
      }

      return ' ';
    });

  marcRecord.insertField({
    tag: '008', value: chars.join('')
  });

  // ************************ $33 fiction/non-fiction/cartoon not implemented yet **************************************

  function makeRules() {
    // Works in a condition when there is no publication time in Issn. Need to check this later
    const baseChars = obj.publicationTime
      ? [
        {index: 6, value: value06()},
        {index: 38, value: '|'}
      ].concat(gen0710(), gen3537())
      : [
        {index: 6, value: value06()},
        {index: 38, value: '|'}
      ]
        .concat(gen3537());

    if (obj.publicationType === 'issn') {
      const seriesChars = [
        {index: 19, value: 'r'},
        {index: 21, value: 'p'},
        {index: 22, value: '|'},
        {index: 29, value: '0'},
        {index: 33, value: 'b'},
        {index: 34, value: '0'}
      ].concat(gen1114(), gen1517(), gen3032());

      if (isElectronic(obj)) {
        return baseChars.concat(seriesChars, [{index: 23, value: 'o'}]);
      }

      if (isPrinted(obj)) {
        return baseChars.concat(seriesChars);
      }
    }

    if (obj.publicationType === 'isbn-ismn') {
      if (obj.type !== 'music' && obj.type !== 'dissertation') {
        const bookChars = [
          {index: 29, value: '|'},
          {index: 30, value: '0'},
          {index: 31, value: '|'},
          {index: 33, value: gen33(obj)},
          {index: 34, value: '|'}
        ].concat(gen1517());

        if (isElectronic(obj)) {
          return baseChars.concat(bookChars, [{index: 23, value: 'o'}]);
        }

        if (isPrinted(obj)) {
          return baseChars.concat(bookChars);
        }
      }

      if (obj.type === 'music') {
        const musicChars = [
          {index: 29, value: '|'},
          {index: 30, value: '0'},
          {index: 31, value: '|'},
          {index: 33, value: '0'},
          {index: 34, value: '|'}
        ].concat(gen1517(), gen1821());

        if (isElectronic(obj)) {
          return baseChars.concat(musicChars, [{index: 23, value: 'o'}]);
        }

        if (isPrinted(obj)) {
          return baseChars.concat(musicChars);
        }
      }

      if (obj.type === 'dissertation') {
        const dissertationChars = [
          {index: 24, value: 'm'},
          {index: 29, value: '|'},
          {index: 30, value: '0'},
          {index: 31, value: '|'},
          {index: 33, value: '0'},
          {index: 34, value: '|'}
        ].concat(gen1517(), gen1821());

        if (isElectronic(obj)) {
          return baseChars.concat(dissertationChars, [
            {index: 22, value: ' '},
            {index: 23, value: 'o'}
          ]);
        }

        if (isPrinted(obj)) {
          return baseChars.concat(dissertationChars);
        }
      }
    }

    function value06() {
      if (obj.publicationType === 'issn') {
        return 'c';
      }

      if (obj.publicationType === 'isbn-ismn') {
        return 's';
      }
    }

    function gen1114() {
      if (obj.publicationType === 'issn') {
        return generate('9999', 11);
      }
    }

    function gen0710() {
      return obj.publicationTime && generate(obj.publicationTime.slice(0, 4), 7);
    }

    function gen1517() {
      return generate(' fi', 15);
    }

    function gen1821() {
      return generate('||||', 18);
    }

    function gen3032() {
      return generate('|||', 30);
    }

    function gen33(object) {
      if ('1' in object.isbnClassification && '2' in object.isbnClassification) {
        if ('3' in object.isbnClassification) {
          return '1';
        }
        return 'm';
      }

      if ('1' in object.isbnClassification) {
        if ('3' in object.isbnClassification) {
          return '1';
        }
        return '0';
      }

      if ('2' in object.isbnClassification) {
        if ('3' in object.isbnClassification) {
          return '1';
        }
        return 'f';
      }
    }

    function gen3537() {
      return generate(obj.language, 35);
    }

    function generate(string, startIndex) {
      return string.split('').map((value, index) => ({value, index: index + startIndex}));
    }
  }
}
