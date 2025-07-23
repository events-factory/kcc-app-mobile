import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AttendeeData {
  id: string;
  name: string;
  email: string;
  ticketId: string;
  eventId: string;
  isCheckedIn: boolean;
  checkInTime?: string;
}

export default function ScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedEntrance, setSelectedEntrance] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<AttendeeData | null>(null);
  const [isError, setIsError] = useState(false);
  const [previousEntrance, setPreviousEntrance] = useState<string | null>(null);

  useEffect(() => {
    loadSelectedEvent();
    loadSelectedEntrance();
  }, []);

  const loadSelectedEvent = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      if (eventData) {
        setSelectedEvent(JSON.parse(eventData));
      } else {
        Alert.alert('No Event Selected', 'Please select an event first.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error loading selected event:', error);
    }
  };

  const loadSelectedEntrance = async () => {
    try {
      const entranceData = await AsyncStorage.getItem('selectedEntrance');
      if (entranceData) {
        setSelectedEntrance(JSON.parse(entranceData));
      } else {
        Alert.alert(
          'No Entrance Selected',
          'Please select an entrance first.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error loading selected entrance:', error);
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    Vibration.vibrate(100);

    try {
      // Parse QR code data - expecting JSON format
      const qrData = JSON.parse(data);

      // Simulate checking if attendee is registered for this event
      const mockAttendee: AttendeeData = {
        id:
          qrData.attendeeId || 'att_' + Math.random().toString(36).substr(2, 9),
        name: qrData.name || 'John Doe',
        email: qrData.email || 'john.doe@example.com',
        ticketId:
          qrData.ticketId || 'tick_' + Math.random().toString(36).substr(2, 9),
        eventId: selectedEvent?.id || '1',
        isCheckedIn: false,
        checkInTime: new Date().toISOString(),
      };

      // Automatically check in the attendee
      await performCheckIn(mockAttendee);
    } catch (error) {
      // Handle invalid QR code
      setIsError(true);
      setScanResult(null);
      setShowResult(true);
    }
  };

  const performCheckIn = async (attendee: AttendeeData) => {
    try {
      // Check if attendee is already checked in
      const existingCheckIn = await AsyncStorage.getItem(
        `checkin_${attendee.id}`
      );

      if (existingCheckIn) {
        // Attendee already checked in
        const existingData = JSON.parse(existingCheckIn);
        setPreviousEntrance(existingData.entranceName || 'Unknown entrance');
        setScanResult({
          ...attendee,
          isCheckedIn: true,
          checkInTime: existingData.checkInTime,
        });
        setIsError(false);
        setShowResult(true);

        // Auto-close the modal after 3 seconds
        setTimeout(() => {
          setShowResult(false);
          setScanResult(null);
          setScanned(false);
        }, 3000);

        // Single vibration for already checked in
        Vibration.vibrate(200);

        console.log(
          `⚠️ Already checked in: ${attendee.name} at ${
            existingData.entranceName || 'Unknown entrance'
          }`
        );
        return;
      }

      // Save check-in data locally
      const checkInData = {
        ...attendee,
        isCheckedIn: true,
        checkInTime: new Date().toISOString(),
        entranceId: selectedEntrance?.id,
        entranceName: selectedEntrance?.name,
      };

      await AsyncStorage.setItem(
        `checkin_${attendee.id}`,
        JSON.stringify(checkInData)
      );

      // Show success modal with attendee info
      setPreviousEntrance(null); // Clear previous entrance for new check-ins
      setScanResult(attendee);
      setIsError(false);
      setShowResult(true);

      // Auto-close the modal after 3 seconds and continue scanning
      setTimeout(() => {
        setShowResult(false);
        setScanResult(null);
        setScanned(false);
      }, 3000);

      // Provide haptic feedback for successful check-in
      Vibration.vibrate([100, 50, 100]);

      console.log(
        `✅ Check-in successful: ${attendee.name} at ${selectedEntrance?.name}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check in attendee. Please try again.');
      setScanned(false);
    }
  };

  const checkInAttendee = async () => {
    if (!scanResult) return;

    try {
      // Here you would normally make an API call to check in the attendee
      // For now, we'll simulate a successful check-in

      // Save check-in data locally
      const checkInData = {
        ...scanResult,
        isCheckedIn: true,
        checkInTime: new Date().toISOString(),
        entranceId: selectedEntrance?.id,
        entranceName: selectedEntrance?.name,
      };

      await AsyncStorage.setItem(
        `checkin_${scanResult.id}`,
        JSON.stringify(checkInData)
      );

      Alert.alert(
        'Check-in Successful!',
        `${scanResult.name} has been checked in to ${selectedEvent?.name} via ${selectedEntrance?.name} entrance`,
        [{ text: 'OK', onPress: closeResultModal }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check in attendee. Please try again.');
    }
  };

  const closeResultModal = () => {
    setShowResult(false);
    setScanResult(null);
    setIsError(false);
    setScanned(false);
    setPreviousEntrance(null);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#6B7280" />
          <Text style={styles.message}>
            Camera permission is required to scan QR codes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Event & Entrance Info Header */}
      {selectedEvent && selectedEntrance && (
        <View style={styles.eventHeader}>
          <Text style={styles.eventName}>{selectedEvent.name}</Text>
          <Text style={styles.eventStats}>
            {selectedEvent.registered} registered • {selectedEvent.checkedIn}{' '}
            checked in
          </Text>
          <View style={styles.entranceInfo}>
            <Ionicons name="location-outline" size={16} color="#FDE68A" />
            <Text style={styles.entranceName}>{selectedEntrance.name}</Text>
            <Text style={styles.entranceCapacity}>
              • Capacity: {selectedEntrance.maxCapacity}
            </Text>
          </View>
        </View>
      )}

      {/* Scanner View */}
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          enableTorch={flashOn}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Position the QR code within the frame to scan
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons
              name={flashOn ? 'flash' : 'flash-outline'}
              size={24}
              color="white"
            />
            <Text style={styles.controlButtonText}>Flash</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setScanned(false)}
            disabled={!scanned}
          >
            <Ionicons name="refresh-outline" size={24} color="white" />
            <Text style={styles.controlButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Result Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showResult}
        onRequestClose={closeResultModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isError ? (
              <>
                <Ionicons name="close-circle" size={64} color="#EF4444" />
                <Text style={styles.modalTitle}>Invalid QR Code</Text>
                <Text style={styles.modalMessage}>
                  This QR code is not valid for the selected event.
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.errorButton]}
                  onPress={closeResultModal}
                >
                  <Text style={styles.modalButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              scanResult && (
                <>
                  <Ionicons
                    name={
                      scanResult.isCheckedIn ? 'warning' : 'checkmark-circle'
                    }
                    size={64}
                    color={scanResult.isCheckedIn ? '#F59E0B' : '#10B981'}
                  />
                  <Text style={styles.modalTitle}>
                    {scanResult.isCheckedIn
                      ? 'Already Checked In'
                      : 'Check-in Successful!'}
                  </Text>
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeName}>{scanResult.name}</Text>
                    <Text style={styles.attendeeEmail}>{scanResult.email}</Text>
                    <Text style={styles.ticketId}>
                      Ticket: {scanResult.ticketId}
                    </Text>
                    <Text
                      style={[
                        styles.checkInConfirmation,
                        scanResult.isCheckedIn && styles.alreadyCheckedInText,
                      ]}
                    >
                      {scanResult.isCheckedIn
                        ? `⚠️ Previously checked in${
                            previousEntrance ? ` at ${previousEntrance}` : ''
                          }${
                            scanResult.checkInTime
                              ? ` on ${new Date(
                                  scanResult.checkInTime
                                ).toLocaleTimeString()}`
                              : ''
                          }`
                        : `✅ Checked in at ${selectedEntrance?.name}`}
                    </Text>
                  </View>

                  <Text style={styles.autoCloseMessage}>
                    Continuing scan automatically...
                  </Text>
                </>
              )
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  eventHeader: {
    backgroundColor: '#1D4ED8',
    padding: 16,
  },
  eventName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventStats: {
    color: '#BFDBFE',
    fontSize: 14,
    marginTop: 4,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10B981',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10B981',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10B981',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10B981',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    minWidth: 80,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  attendeeInfo: {
    alignItems: 'center',
    marginVertical: 16,
  },
  attendeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  ticketId: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  checkInButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  entranceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  entranceName: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  entranceCapacity: {
    color: '#BFDBFE',
    fontSize: 12,
  },
  checkInConfirmation: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  autoCloseMessage: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  alreadyCheckedInText: {
    color: '#F59E0B',
  },
});
