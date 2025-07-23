/**
 * QR Code Test Helper
 *
 * Use this to generate QR codes for testing the scanner.
 * Copy the JSON strings below and paste them into any QR code generator.
 */

export const testQRCodes = [
  // Test QR Code 1 - John Doe
  {
    attendeeId: 'att_001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    ticketId: 'tick_001',
    eventId: '1',
  },

  // Test QR Code 2 - Jane Smith
  {
    attendeeId: 'att_002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    ticketId: 'tick_002',
    eventId: '1',
  },

  // Test QR Code 3 - Bob Johnson
  {
    attendeeId: 'att_003',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    ticketId: 'tick_003',
    eventId: '1',
  },
];

// Ready-to-use QR code strings
export const qrStrings = [
  JSON.stringify(testQRCodes[0]),
  JSON.stringify(testQRCodes[1]),
  JSON.stringify(testQRCodes[2]),
];

console.log('=== QR CODE TEST DATA ===');
console.log('Copy these strings to generate QR codes for testing:');
console.log('');

qrStrings.forEach((str, index) => {
  console.log(`Test QR Code ${index + 1}:`);
  console.log(str);
  console.log('');
});
