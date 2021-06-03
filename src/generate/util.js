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
  const electronicFormats = ['online', 'cd', 'pdf', 'epub', 'mp3'];
  if (o.publicationType === 'issn' && electronicFormats.includes(o.formatDetails.format)) {
    return true;
  }
  if (o.publicationType === 'isbn-ismn' && Object.keys(o.formatDetails)[0] === 'fileFormat') {
    return true;
  }
  return false;
}

export function isPrinted(o) {
  const printFormats = ['paperback', 'hardback', 'spiral-binding', 'printed'];
  if (o.publicationType === 'issn' && printFormats.includes(o.formatDetails.format)) {
    return true;
  }
  if (o.publicationType === 'isbn-ismn' && (o.formatDetails.format === 'printed' || Object.keys(o.formatDetails)[0] === 'fileFormat')) {
    return true;
  }
  return false;
}

export function valuePublicationTime(object) {
  if (object.publicationType === 'issn') {
    return object.firstYear.toString();
  }

  if (object.publicationType === 'isbn-ismn') {
    return `${object.publicationTime.substr(0, 4)}.`;
  }
}
