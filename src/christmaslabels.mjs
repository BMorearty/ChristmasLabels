'use strict';

/**
 * Instructions:
 *
 * 1. In Google Contacts go to the Christmas List label.
 * 2. Select a single contact.
 * 3. Click the More button.
 * 4. Click Export.
 * 5. Select Christmas List.
 * 6. Select Google CSV.
 * 7. Click Export.
 * 8. Move the file to the root directory of this project.
 * 9. Run `node christmaslabels.mjs`.
 * 10. Open labels.pdf.
 *
 * Adding people to the Christmas list:
 * 1. In Google Contacts, open the contact you want to add.
 * 2. Add the Christmas List label to the contact.
 * 3. Edit the contact.
 * 4. Add a custom field with type 'Christmas'. The value is the first line of the label.
 *    E.g., "The Smith Family"
 * 5. If the contact has multiple addresses, add type 'Mail' or 'Home' to the one you want to use.
 *    Mail takes precedence over Home.
 */

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

const contacts = [];
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
  let i = 0;
  let y = TOP_MARGIN

  for (const contact of contacts) {
    let firstLine = getFirstLine(contact);
    let address = getAddress(contact);
    const x = LEFT_MARGIN + LABEL_WIDTH * (i % ACROSS);
    doc.text(firstLine, x, y);
    doc.text(address);

    i++;
    if (i % ACROSS === 0) {
      y += LABEL_HEIGHT;
    }
    if (i % (ACROSS * DOWN) === 0) {
      doc.addPage();
      y = TOP_MARGIN;
    }
  }
  doc.end();
}

// Returns the first line to print on the address label,
// which is the custom field whose type is "Christmas".
function getFirstLine(contact) {
  for (let key of Object.keys(contact)) {
    const match = /Custom Field (\d+) - Type/.exec(key);
    if (match && contact[key] === 'Christmas') {
      const fieldNum = match[1]
      return contact[`Custom Field ${fieldNum} - Value`];
    }
  }
  console.log("No first line found for", contact.Name);
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
    const match = /Address (\d+) - Type/.exec(key);
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

  console.log(`Multiple non-blank addresses found for ${contact.Name}. Mark one with type 'Mail'.`);
  process.exit(1);
}

function addressNumber(contact, n) {
  return contact[`Address ${n} - Formatted`].replace(/\nUS$/, '');
}
