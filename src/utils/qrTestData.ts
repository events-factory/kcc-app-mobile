/**
 * Sample QR Code Data Generator
 *
 * This file contains sample data that can be converted to QR codes
 * for testing the mobile scanner app.
 *
 * To generate QR codes, you can use online QR code generators with this JSON data.
 */

// Sample attendee data for QR code generation
export const sampleAttendees = [
  {
    attendeeId: 'att_001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    ticketId: 'tick_001',
    eventId: '1',
  },
  {
    attendeeId: 'att_002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    ticketId: 'tick_002',
    eventId: '1',
  },
  {
    attendeeId: 'att_003',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    ticketId: 'tick_003',
    eventId: '1',
  },
  {
    attendeeId: 'att_004',
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    ticketId: 'tick_004',
    eventId: '2',
  },
  {
    attendeeId: 'att_005',
    name: 'Charlie Wilson',
    email: 'charlie.wilson@example.com',
    ticketId: 'tick_005',
    eventId: '2',
  },
];

// Function to generate QR code data string
export const generateQRData = (attendee: (typeof sampleAttendees)[0]) => {
  return JSON.stringify(attendee);
};

// Sample QR code data strings (copy these to QR code generators)
export const qrCodeStrings = sampleAttendees.map((attendee) => ({
  name: attendee.name,
  data: generateQRData(attendee),
}));

// Instructions for testing:
console.log('To test the scanner app:');
console.log('1. Copy one of the JSON strings below');
console.log(
  '2. Go to any online QR code generator (e.g., qr-code-generator.com)'
);
console.log('3. Paste the JSON string and generate a QR code');
console.log('4. Use the mobile app to scan the generated QR code');
console.log('\nSample QR Code Data:\n');

qrCodeStrings.forEach((item, index) => {
  console.log(`${index + 1}. ${item.name}:`);
  console.log(item.data);
  console.log('');
});
