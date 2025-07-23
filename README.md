# KCC Events Mobile Scanner

A React Native Expo mobile application for scanning QR codes at event entrances.

## Features

- **Event Management**: Select and manage events for check-ins
- **QR Code Scanning**: Scan attendee QR codes for event check-ins
- **Real-time Statistics**: View check-in rates and attendee counts
- **Offline Support**: Works offline with local data storage
- **Modern UI**: Clean, professional interface with React Native styling

## Screenshots Based UI

The app UI is based on the KCC Events dashboard design, featuring:

- Event selection and management
- Real-time check-in statistics
- QR code scanner with overlay
- Attendee management
- Settings and configuration

## QR Code Format

The app expects QR codes to contain JSON data in the following format:

```json
{
  "attendeeId": "att_12345",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "ticketId": "tick_67890",
  "eventId": "event_001"
}
```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npx expo start
   ```

3. Scan the QR code with Expo Go app on your mobile device

## Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **AsyncStorage**: Local data persistence
- **Expo Camera/BarCodeScanner**: QR code scanning
- **React Navigation**: Screen navigation
- **Expo Vector Icons**: Icons throughout the app

## Project Structure

```
src/
  screens/
    HomeScreen.tsx      # Event selection and overview
    ScannerScreen.tsx   # QR code scanning interface
    EventDetailScreen.tsx # Event details and check-in history
    SettingsScreen.tsx  # App settings and configuration
```

## Features in Detail

### Home Screen

- Event selection
- Check-in statistics
- Quick access to scanner
- Event overview cards

### Scanner Screen

- Camera-based QR code scanning
- Attendee verification
- Success/error feedback
- Flash toggle and controls

### Event Detail Screen

- Real-time check-in list
- Event statistics
- Export capabilities
- Refresh functionality

### Settings Screen

- Scanner preferences
- Data management
- App information
- User profile

## Development

The app is built with React Native and Expo, making it easy to develop and deploy across iOS and Android platforms.

### Key Dependencies

- `expo-camera` / `expo-barcode-scanner` - QR code scanning
- `@react-navigation/native` - Navigation
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-safe-area-context` - Safe area handling

## License

© 2025 KCC App. All rights reserved.
