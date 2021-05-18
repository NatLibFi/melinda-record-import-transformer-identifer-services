export function isAudio(o) {
  if (o.publicationType === 'isbn-ismn' && o.formatDetails.format === 'electronic') {
    if (o.formatDetails.fileFormat.format.includes('mp3') || o.formatDetails.fileFormat.format.includes('cd')) {
      return true;
    }
    return false;
  }
  if (o.publicationType === 'issn' && (o.formatDetails.format === 'mp3' || o.formatDetails.format === 'cd')) {
    // ISSN doesn't have mp3 file format
    return true;
  }
  return false;
}

export function isElectronic(o) {
  if (o.publicationType === 'issn' && (o.formatDetails === 'online' || o.formatDetails === 'cd')) {
    return true;
  }
  if (o.publicationType === 'isbn-ismn' && Object.keys(o.formatDetails)[0] === 'fileFormat') {
    return true;
  }
  return false;
}

export function isPrinted(o) {
  if (o.publicationType === 'issn' && o.formatDetails === 'printed') {
    return true;
  }
  if (o.publicationType === 'isbn-ismn' && Object.keys(o.formatDetails)[0] === 'fileFormat') {
    return true;
  }
  return false;
}

export function valuePublicationTime(object) {
  if (object.publicationType === 'issn') {
    return object.firstYear;
  }

  if (object.publicationType === 'isbn-ismn') {
    return `${object.publicationTime.substr(0, 4)}.`;
  }
}
