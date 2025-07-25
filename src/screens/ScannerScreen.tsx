import React, { useState, useEffect, useRef } from 'react';
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
import {
  CameraView,
  BarcodeScanningResult,
  CameraType,
  useCameraPermissions,
} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { attendeesApi } from '../services/api';

interface AttendeeData {
  id: string;
  name: string;
  email: string;
  ticketId: string;
  eventId: string;
  isCheckedIn: boolean;
  checkInTime?: string;
}

export default function ScannerScreen({ navigation, route }: any) {
  const { accessToken } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedEntrance, setSelectedEntrance] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<AttendeeData | null>(null);
  const [isError, setIsError] = useState(false);
  const [previousEntrance, setPreviousEntrance] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanCooldown, setScanCooldown] = useState(false);
  const scanningRef = useRef(false);

  useEffect(() => {
    // Check if event and entrance are passed through route params first
    const { event, entrance } = route.params || {};

    if (event && entrance) {
      setSelectedEvent(event);
      setSelectedEntrance(entrance);
    } else {
      // Fallback to AsyncStorage if not passed through route params
      loadSelectedEvent();
      loadSelectedEntrance();
    }
  }, [route.params]);

  const loadSelectedEvent = async () => {
    // Skip if event is already loaded from route params
    if (selectedEvent) return;

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
    // Skip if entrance is already loaded from route params
    if (selectedEntrance) return;

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
    // Immediate ref-based check to prevent rapid multiple scans
    if (scanningRef.current) {
      return;
    }

    // Prevent duplicate scans of the same QR code
    if (
      scanned ||
      processing ||
      data === lastScannedCode ||
      showResult ||
      scanCooldown
    ) {
      return;
    }

    // Set ref immediately to block subsequent scans
    scanningRef.current = true;

    setScanned(true);
    setProcessing(true);
    setLastScannedCode(data);
    setScanCooldown(true);
    Vibration.vibrate(100);

    // Clear cooldown after 1 second to prevent rapid multiple scans
    setTimeout(() => {
      setScanCooldown(false);
    }, 1000);

    try {
      // The QR code data should contain the badgeId
      let badgeId: string;

      try {
        // Try to parse as JSON first (in case it's a JSON object with badgeId)
        const qrData = JSON.parse(data);
        badgeId = qrData.badgeId || qrData.id || data;
      } catch {
        // If not JSON, treat the entire data as badgeId
        badgeId = data.trim();
      }

      if (!badgeId) {
        throw new Error('Invalid QR code: No badge ID found');
      }

      // Perform check-in with the real API
      await performCheckIn(badgeId);
    } catch (error: any) {
      console.error('QR code scan error:', error);
      setIsError(true);
      setScanResult(null);
      setShowResult(true);
    } finally {
      // Always reset the scanning ref when done
      scanningRef.current = false;
    }
  };

  const performCheckIn = async (badgeId: string) => {
    if (!accessToken || !selectedEvent || !selectedEntrance) {
      Alert.alert('Error', 'Missing authentication or event/entrance data');
      setScanned(false);
      return;
    }

    try {
      // Call the real API to check in the attendee
      const response = await attendeesApi.checkIn(
        badgeId,
        selectedEntrance.name,
        selectedEvent.id,
        accessToken
      );

      // Handle successful check-in response
      const attendeeData: AttendeeData = {
        id: badgeId,
        name: response.name || response.attendeeName || 'Unknown',
        email: response.email || response.attendeeEmail || '',
        ticketId: badgeId,
        eventId: selectedEvent.id.toString(),
        isCheckedIn: false, // This is a NEW check-in, not previously checked in
        checkInTime: response.checkInTime || new Date().toISOString(),
      };

      // Save check-in data locally for offline reference
      const checkInData = {
        ...attendeeData,
        entranceId: selectedEntrance?.id,
        entranceName: selectedEntrance?.name,
        checkedInAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `checkin_${badgeId}`,
        JSON.stringify(checkInData)
      );

      // Show success modal
      setPreviousEntrance(null);
      setScanResult(attendeeData);
      setIsError(false);
      setShowResult(true);

      // Success haptic feedback
      Vibration.vibrate([100, 50, 100]);
    } catch (error: any) {
      console.error('Check-in API error:', error);

      // Handle specific API errors
      if (
        error.message?.includes('already checked in') ||
        error.message?.includes('duplicate')
      ) {
        // Handle already checked in case
        const attendeeData: AttendeeData = {
          id: badgeId,
          name: error.attendeeName || 'Unknown',
          email: error.attendeeEmail || '',
          ticketId: badgeId,
          eventId: selectedEvent.id.toString(),
          isCheckedIn: true,
          checkInTime: error.checkInTime || new Date().toISOString(),
        };

        setPreviousEntrance(error.previousEntrance || 'Unknown entrance');
        setScanResult(attendeeData);
        setIsError(false);
        setShowResult(true);

        // Single vibration for already checked in
        Vibration.vibrate(200);
      } else {
        // Handle other errors (not found, network errors, etc.)
        setIsError(true);
        setScanResult(null);
        setShowResult(true);
      }
    } finally {
      setProcessing(false);
    }
  };

  const closeResultModal = () => {
    setShowResult(false);
    setScanResult(null);
    setIsError(false);
    setScanned(false);
    setProcessing(false);
    setPreviousEntrance(null);
    setScanCooldown(false);
    // Clear last scanned code to allow scanning again
    setLastScannedCode(null);
    // Reset scanning ref
    scanningRef.current = false;
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const getHeaderBackgroundStyle = (event: any) => {
    const checkedInCount = event.checkedInCount || 0;
    const capacity = event.attendeeLimit || selectedEntrance?.maxCapacity || 0;

    if (capacity === 0) {
      return { backgroundColor: '#1D4ED8' }; // Default blue if no capacity data
    }

    const capacityRate = (checkedInCount / capacity) * 100;

    if (capacityRate >= 90) {
      return { backgroundColor: '#DC2626' };
    } else if (capacityRate >= 70) {
      return { backgroundColor: '#EA580C' };
    } else {
      return { backgroundColor: '#16A34A' };
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
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
        <View
          style={[styles.eventHeader, getHeaderBackgroundStyle(selectedEvent)]}
        >
          <Text style={styles.eventName}>{selectedEvent.name}</Text>
          <Text style={styles.eventStats}>
            {selectedEvent.registeredCount || 0} registered •{' '}
            {selectedEvent.checkedInCount || 0} checked in
          </Text>
          <View style={styles.entranceInfo}>
            <Ionicons name="location-outline" size={16} color="#FDE68A" />
            <Text style={styles.entranceName}>{selectedEntrance.name}</Text>
            <Text style={styles.entranceCapacity}>
              • Capacity:{' '}
              {selectedEvent.attendeeLimit || selectedEntrance.maxCapacity || 0}
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
          onBarcodeScanned={
            scanned || processing ? undefined : handleBarCodeScanned
          }
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
            {processing
              ? 'Processing QR code...'
              : 'Position the QR code within the frame to scan'}
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
            onPress={() => {
              setScanned(false);
              setProcessing(false);
              setLastScannedCode(null);
              setScanCooldown(false);
              scanningRef.current = false;
            }}
            disabled={!scanned && !processing}
          >
            <Ionicons name="refresh-outline" size={24} color="white" />
            <Text style={styles.controlButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                <Text style={styles.modalTitle}>Check-in Failed</Text>
                <Text style={styles.modalMessage}>
                  Unable to check in this attendee. The badge ID may be invalid
                  or the attendee may not be registered for this event.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.errorButton]}
                    onPress={closeResultModal}
                  >
                    <Text style={styles.modalButtonText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
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
                    Tap "Scan Again" to continue scanning
                  </Text>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.checkInButton]}
                      onPress={closeResultModal}
                    >
                      <Text style={styles.modalButtonText}>Scan Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => navigation.goBack()}
                    >
                      <Text style={styles.cancelButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
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
    marginBottom: 16,
  },
  alreadyCheckedInText: {
    color: '#F59E0B',
  },
});
