import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CheckInData {
  id: string;
  name: string;
  email: string;
  checkInTime: string;
  ticketId: string;
  entranceId?: string;
  entranceName?: string;
}

interface Entrance {
  id: string;
  name: string;
  maxCapacity: string;
  isActive: boolean;
}

export default function EventDetailScreen({ route, navigation }: any) {
  const { event } = route.params;
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [filteredCheckIns, setFilteredCheckIns] = useState<CheckInData[]>([]);
  const [selectedEntrance, setSelectedEntrance] = useState<Entrance | null>(
    null
  );
  const [showEntranceSelector, setShowEntranceSelector] = useState(false);
  const [entrances] = useState<Entrance[]>([
    {
      id: '5',
      name: 'Filini',
      maxCapacity: 'No limit',
      isActive: true,
    },
    {
      id: '6',
      name: 'Main Hall Entrance',
      maxCapacity: '500',
      isActive: true,
    },
    {
      id: '7',
      name: 'VIP Entrance',
      maxCapacity: '50',
      isActive: true,
    },
    {
      id: '8',
      name: 'Staff Entrance',
      maxCapacity: '100',
      isActive: false,
    },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCheckIns();
  }, []);

  useEffect(() => {
    filterCheckInsByEntrance();
  }, [checkIns, selectedEntrance]);

  const loadCheckIns = async () => {
    try {
      // Load all check-ins from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const checkInKeys = keys.filter((key) => key.startsWith('checkin_'));

      if (checkInKeys.length > 0) {
        const checkInData = await AsyncStorage.multiGet(checkInKeys);
        const parsedCheckIns = checkInData
          .map(([key, value]) => (value ? JSON.parse(value) : null))
          .filter((item) => item && item.eventId === event.id);

        setCheckIns(parsedCheckIns);
      }
    } catch (error) {
      console.error('Error loading check-ins:', error);
    }
  };

  const filterCheckInsByEntrance = () => {
    if (!selectedEntrance) {
      setFilteredCheckIns(checkIns);
    } else {
      const filtered = checkIns.filter(
        (checkIn) => checkIn.entranceId === selectedEntrance.id
      );
      setFilteredCheckIns(filtered);
    }
  };

  const selectEntrance = async (entrance: Entrance | null) => {
    setSelectedEntrance(entrance);
    if (entrance) {
      // Save to AsyncStorage to sync with other screens
      try {
        await AsyncStorage.setItem(
          'selectedEntrance',
          JSON.stringify(entrance)
        );
      } catch (error) {
        console.error('Error saving selected entrance:', error);
      }
    }
  };

  const clearEntrance = async () => {
    try {
      await AsyncStorage.removeItem('selectedEntrance');
      setSelectedEntrance(null);
      Alert.alert(
        'Entrance Cleared',
        'No entrance is currently selected for filtering.'
      );
    } catch (error) {
      console.error('Error clearing selected entrance:', error);
    }
  };

  const startScanning = () => {
    if (!selectedEntrance) {
      setShowEntranceSelector(true);
      return;
    }
    navigation.navigate('Scanner');
  };

  const handleEntranceSelection = async (entrance: Entrance) => {
    await selectEntrance(entrance);
    setShowEntranceSelector(false);
    // Save the current event to AsyncStorage as well
    try {
      await AsyncStorage.setItem('selectedEvent', JSON.stringify(event));
    } catch (error) {
      console.error('Error saving selected event:', error);
    }
    navigation.navigate('Scanner');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCheckIns().finally(() => setRefreshing(false));
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const checkInRate =
    event.registered > 0
      ? Math.round((checkIns.length / event.registered) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Event Header */}
        <View style={styles.header}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <Text style={styles.eventSubtitle}>Event Details & Check-ins</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{event.registered}</Text>
            <Text style={styles.statLabel}>Total Attendees</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#16A34A"
              />
            </View>
            <Text style={styles.statNumber}>{checkIns.length}</Text>
            <Text style={styles.statLabel}>Checked In</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}
            >
              <Ionicons name="analytics-outline" size={24} color="#D97706" />
            </View>
            <Text style={styles.statNumber}>{checkInRate}%</Text>
            <Text style={styles.statLabel}>Check-in Rate</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={startScanning}>
            <Ionicons name="qr-code-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Start Scanning</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh-outline" size={20} color="#2563EB" />
            <Text
              style={[
                styles.actionButtonText,
                styles.secondaryActionButtonText,
              ]}
            >
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        {/* Entrance Selector Modal */}
        {showEntranceSelector && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Entrance</Text>
                <TouchableOpacity
                  onPress={() => setShowEntranceSelector(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Choose an entrance to start scanning
              </Text>

              <ScrollView style={styles.entranceList}>
                {entrances
                  .filter((entrance) => entrance.isActive)
                  .map((entrance) => (
                    <TouchableOpacity
                      key={entrance.id}
                      style={styles.entranceOption}
                      onPress={() => handleEntranceSelection(entrance)}
                    >
                      <View style={styles.entranceOptionContent}>
                        <View style={styles.entranceInfo}>
                          <Text style={styles.entranceName}>
                            {entrance.name}
                          </Text>
                          <Text style={styles.entranceCapacity}>
                            Capacity: {entrance.maxCapacity}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#6B7280"
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Entrance Filter */}
        <View style={styles.entranceFilterContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filter by Entrance</Text>
            {selectedEntrance && (
              <TouchableOpacity
                onPress={clearEntrance}
                style={styles.clearFilterButton}
              >
                <Text style={styles.clearFilterText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.entranceFilterOptions}>
            <TouchableOpacity
              style={[
                styles.entranceFilterOption,
                !selectedEntrance && styles.entranceFilterOptionActive,
              ]}
              onPress={() => selectEntrance(null)}
            >
              <Text
                style={[
                  styles.entranceFilterOptionText,
                  !selectedEntrance && styles.entranceFilterOptionTextActive,
                ]}
              >
                All Entrances
              </Text>
            </TouchableOpacity>

            {entrances
              .filter((entrance) => entrance.isActive)
              .map((entrance) => (
                <TouchableOpacity
                  key={entrance.id}
                  style={[
                    styles.entranceFilterOption,
                    selectedEntrance?.id === entrance.id &&
                      styles.entranceFilterOptionActive,
                  ]}
                  onPress={() => selectEntrance(entrance)}
                >
                  <Text
                    style={[
                      styles.entranceFilterOptionText,
                      selectedEntrance?.id === entrance.id &&
                        styles.entranceFilterOptionTextActive,
                    ]}
                  >
                    {entrance.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Recent Check-ins */}
        <View style={styles.checkInsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            {filteredCheckIns.length > 0 && (
              <Text style={styles.sectionSubtitle}>
                {filteredCheckIns.length}
                {selectedEntrance
                  ? ` at ${selectedEntrance.name}`
                  : ` of ${event.registered} attendees`}
              </Text>
            )}
          </View>

          {filteredCheckIns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>
                {checkIns.length === 0
                  ? 'No check-ins yet'
                  : 'No check-ins for this entrance'}
              </Text>
              <Text style={styles.emptyStateText}>
                {checkIns.length === 0
                  ? 'Start scanning QR codes to see attendee check-ins here'
                  : selectedEntrance
                  ? `No attendees have checked in at ${selectedEntrance.name} yet`
                  : 'Try selecting a different entrance filter'}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={startScanning}
              >
                <Text style={styles.emptyStateButtonText}>Start Scanning</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.checkInsList}>
              {filteredCheckIns.map((checkIn, index) => (
                <View key={checkIn.id} style={styles.checkInItem}>
                  <View style={styles.checkInIcon}>
                    <Ionicons
                      name="person-circle-outline"
                      size={40}
                      color="#6B7280"
                    />
                  </View>

                  <View style={styles.checkInInfo}>
                    <Text style={styles.checkInName}>{checkIn.name}</Text>
                    <Text style={styles.checkInEmail}>{checkIn.email}</Text>
                    <Text style={styles.checkInTicket}>
                      Ticket: {checkIn.ticketId}
                    </Text>
                    {checkIn.entranceName && (
                      <Text style={styles.checkInEntrance}>
                        Entrance: {checkIn.entranceName}
                      </Text>
                    )}
                  </View>

                  <View style={styles.checkInTime}>
                    <Text style={styles.timeText}>
                      {formatTime(checkIn.checkInTime)}
                    </Text>
                    <Text style={styles.dateText}>
                      {formatDate(checkIn.checkInTime)}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Event Info */}
        <View style={styles.eventInfoContainer}>
          <Text style={styles.sectionTitle}>Event Information</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Event ID</Text>
              <Text style={styles.infoValue}>{event.id}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>
                {event.attendeeLimit
                  ? `${event.attendeeLimit} people`
                  : 'Unlimited'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Registration Status</Text>
              <Text style={styles.infoValue}>Open</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Check-in Status</Text>
              <Text style={[styles.infoValue, { color: '#16A34A' }]}>
                Active
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1D4ED8',
    padding: 20,
    paddingBottom: 30,
  },
  eventTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventSubtitle: {
    color: '#BFDBFE',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActionButtonText: {
    color: '#2563EB',
  },
  checkInsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  checkInsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkInIcon: {
    marginRight: 12,
  },
  checkInInfo: {
    flex: 1,
  },
  checkInName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  checkInEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  checkInTicket: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  checkInTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#16A34A',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  eventInfoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  infoGrid: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  checkInEntrance: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  entranceList: {
    maxHeight: 300,
  },
  entranceOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  entranceOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  entranceInfo: {
    flex: 1,
  },
  entranceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  entranceCapacity: {
    fontSize: 14,
    color: '#6B7280',
  },
  entranceFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearFilterText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  entranceFilterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  entranceFilterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  entranceFilterOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  entranceFilterOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  entranceFilterOptionTextActive: {
    color: 'white',
  },
});
