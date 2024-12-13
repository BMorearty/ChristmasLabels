'use strict';

import csv from 'csv-parser';
import fs from 'fs';
import process from 'process';
import PDFDocument from 'pdfkit';

// Labels across and down each page
const ACROSS = 3;
const DOWN = 10;

const LEFT_MARGIN = 32;
const RIGHT_MARGIN = 0;
const TOP_MARGIN = 60;
const BOTTOM_MARGIN = 16;
const LABEL_WIDTH = 198;
const LABEL_HEIGHT = 72;

// Number of labels to skip before printing. Useful when you have a partially-used sheet.
let skip = 0;
const contacts = [];

for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--skip') {
    skip = parseInt(process.argv[i + 1]);
    break;
  }
}

fs.createReadStream('contacts.csv')
  .pipe(csv())
  .on('data', (data) => contacts.push(data))
  .on('end', () => {
    printAddresses(contacts);
  });

function printAddresses(contacts) {
  const doc = new PDFDocument({ margins:
      { top: TOP_MARGIN, bottom: BOTTOM_MARGIN, left: LEFT_MARGIN, right: RIGHT_MARGIN }
  });
  doc.pipe(fs.createWriteStream('labels.pdf'));
  doc.font('PTSerif.ttc', 'PTSerif-Regular');
  doc.fontSize(9);
  let i = skip;

  for (const contact of contacts) {
    let firstLine = getFirstLine(contact);
    let address = getAddress(contact);
    const x = LEFT_MARGIN + LABEL_WIDTH * (i % ACROSS);
    const y = TOP_MARGIN + Math.floor(i / ACROSS) * LABEL_HEIGHT;
    doc.text(firstLine, x, y);
    doc.text(address);

    i++;
    if (i % (ACROSS * DOWN) === 0) {
      doc.addPage();
      i = 0;
    }
  }
  doc.end();
}

// Returns the first line to print on the address label,
// which is the custom field whose type is "Christmas".
function getFirstLine(contact) {
  for (let key of Object.keys(contact)) {
    const match = /Custom Field (\d+) - Label/.exec(key);
    if (match && contact[key] === 'Christmas') {
      const fieldNum = match[1]
      return contact[`Custom Field ${fieldNum} - Value`];
    }
  }
  console.log("No first line found for", contact['First Name'], contact['Last Name']);
  process.exit(1);
}

// Returns the address to print on the label, which is either:
//
// 1. The address whose type is 'Mail'
// 2. The address whose type is 'Home'
// 3. The only non-blank address
function getAddress(contact) {
  let addrTypes = [];
  for (let key of Object.keys(contact)) {
    const match = /Address (\d+) - Label/.exec(key);
    if (match) {
      addrTypes.push({addrNum: match[1], type: contact[key]});
    }
  }

  // Look for the address labeled 'Mail'
  let addrNum = addrTypes.find(addr => addr.type === 'Mail')?.addrNum;
  if (addrNum) {
    return addressNumber(contact, addrNum);
  }

  // Look for the address labeled 'Home'
  addrNum = addrTypes.find(addr => addr.type === 'Home')?.addrNum;
  if (addrNum) {
    return addressNumber(contact, addrNum);
  }

  // Look for the only non-blank address
  let nonBlankAddrNums = [];
  for (let addr of addrTypes) {
    if (contact[`Address ${addr.addrNum} - Formatted`] !== '') {
      nonBlankAddrNums.push(addr.addrNum);
    }
  }
  if (nonBlankAddrNums.length === 1) {
    return addressNumber(contact, nonBlankAddrNums[0]);
  }
  if (nonBlankAddrNums.length === 0) {
    console.log(`No address found for ${contact['First Name'] + ' ' + contact['Last Name']}.`);
    process.exit(1);
  }

  console.log(`Multiple non-blank addresses found for ${contact['First Name'] + ' ' + contact['Last Name']}. Mark one with type 'Mail'.`);
  process.exit(1);
}

function addressNumber(contact, n) {
  const address = contact[`Address ${n} - Formatted`].replace(/\nUS$/, '');
  if (address.includes(' ::: ')) {
    console.error(`There are multiple addresses with the same label for ${contact['First Name'] + ' ' + contact['Last Name']}.`)
    process.exit(1);
  }
  return address;
}
