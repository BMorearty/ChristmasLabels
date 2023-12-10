# Christmas Labels

This little program generates a PDF with labels for Christmas letters.

![Rudolph](Rudolph.png)

# Installation

1. First you need NodeJS.
2. `npm install -g pnpm`
3. `pnpm install`

# Instructions to print

1. In Google Contacts go to your Christmas List label. (You can call the label anything you want.)
2. In the top right corner click the Export button (looks like an outbox).
3. Select Google CSV.
4. Click Export.
5. Move the file to the root directory of this project.
6. Run `node src/christmaslabels.mjs`.
7. Open labels.pdf and print it.

## Command line options

`--skip n`
: Still prints all labels but on page 1 it doesn’t print in the first `n` label positions (left-to-right, top-to-bottom). Useful for when you have a left over sheet of labels from a previous printing.

    node src/christmaslabels.mjs --skip 12

# Adding people to the Christmas list:
1. In Google Contacts, open the contact you want to add.
2. Add the Christmas List label to the contact.
3. Edit the contact.
4. Add a custom field with type "Christmas". The value is the first line of the label. E.g., "The Morearty Family". If you forget to add this field, the program will give you an error when you try to generate labels.
5. If the contact has multiple addresses, add type 'Mail' or 'Home' to the one you want to use. Mail takes precedence over Home.
