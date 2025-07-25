import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  eventsApi,
  attendeesApi,
  statsApi,
  entrancesApi,
} from '../services/api';

interface Attendee {
  id: number;
  name: string;
  email: string;
  registrationDate: string;
  checkInTime?: string;
  isCheckedIn: boolean;
  eventId: number;
}

interface Entrance {
  id: number;
  name: string;
  maxCapacity: number;
  eventId: number;
  createdAt: string;
  updatedAt: string;
}

interface EventStats {
  totalRegistered: number;
  totalCheckedIn: number;
  checkInRate: number;
}

export default function EventDetailScreen({ route, navigation }: any) {
  const { event } = route.params;
  const { accessToken } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [eventStats, setEventStats] = useState<EventStats>({
    totalRegistered: 0,
    totalCheckedIn: 0,
    checkInRate: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEntranceModal, setShowEntranceModal] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    if (!accessToken) {
      console.error('No access token available');
      Alert.alert('Authentication Error', 'Please login again to continue.');
      navigation.navigate('Login');
      return;
    }

    try {
      setLoading(true);

      // Try to fetch data with fallback for individual API calls
      let attendeesData = [];
      let statsData = { totalRegistered: 0, totalCheckedIn: 0, checkInRate: 0 };
      let entrancesData = [];

      try {
        // Try parallel fetch first
        const [attendeesResponse, statsResponse, entrancesResponse] =
          await Promise.all([
            attendeesApi.getByEvent(event.id, accessToken),
            statsApi.getEventStats(event.id, accessToken),
            entrancesApi.getByEvent(event.id, accessToken),
          ]);

        attendeesData = attendeesResponse;
        statsData = statsResponse;
        entrancesData = entrancesResponse;
      } catch (parallelError: any) {
        console.warn(
          'Parallel fetch failed, trying individual calls:',
          parallelError.message
        );

        // Try individual calls to identify which one is failing
        try {
          attendeesData = await attendeesApi.getByEvent(event.id, accessToken);
        } catch (attendeesError: any) {
          console.error('Attendees API failed:', attendeesError.message);
          attendeesData = [];
        }

        try {
          statsData = await statsApi.getEventStats(event.id, accessToken);
        } catch (statsError: any) {
          console.error('Stats API failed:', statsError.message);
          statsData = { totalRegistered: 0, totalCheckedIn: 0, checkInRate: 0 };
        }

        try {
          entrancesData = await entrancesApi.getByEvent(event.id, accessToken);
        } catch (entrancesError: any) {
          console.error('Entrances API failed:', entrancesError.message);
          entrancesData = [];
        }
      }

      // Calculate capacity percentage instead of check-in rate against registered attendees
      const capacityPercentage =
        event.attendeeLimit > 0
          ? (statsData.totalCheckedIn / event.attendeeLimit) * 100
          : 0;

      setAttendees(attendeesData);
      setEventStats({
        ...statsData,
        checkInRate: capacityPercentage,
      });
      setEntrances(entrancesData);
    } catch (error: any) {
      console.error('Error fetching event data:', error);

      if (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('401')
      ) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to load event data: ${error.message || 'Please try again.'}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEventData().finally(() => {
      setRefreshing(false);
    });
  };

  const startScanning = () => {
    if (entrances.length === 0) {
      Alert.alert(
        'No Entrances Available',
        'No entrances have been configured for this event. Please add entrances first.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (entrances.length === 1) {
      // If only one entrance, go directly to scanner
      navigation.navigate('Scanner', {
        entrance: entrances[0],
        event: event,
      });
    } else {
      // If multiple entrances, show selection modal
      setShowEntranceModal(true);
    }
  };

  const selectEntrance = (entrance: Entrance) => {
    setShowEntranceModal(false);
    navigation.navigate('Scanner', {
      entrance: entrance,
      event: event,
    });
  };

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
          <Text style={styles.eventSubtitle}>Event Details & Attendees</Text>
          {event.description && (
            <Text style={styles.eventDescription}>{event.description}</Text>
          )}
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading event data...</Text>
          </View>
        )}

        {/* Stats Cards */}
        {!loading && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people-outline" size={24} color="#2563EB" />
              </View>
              <Text style={styles.statNumber}>
                {eventStats.totalRegistered}
              </Text>
              <Text style={styles.statLabel}>Total Attendees</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: '#DCFCE7' },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#16A34A"
                />
              </View>
              <Text style={styles.statNumber}>{eventStats.totalCheckedIn}</Text>
              <Text style={styles.statLabel}>Checked In</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: '#FEF3C7' },
                ]}
              >
                <Ionicons name="analytics-outline" size={24} color="#D97706" />
              </View>
              <Text style={styles.statNumber}>
                {Math.round(eventStats.checkInRate)}%
              </Text>
              <Text style={styles.statLabel}>Capacity Filled</Text>
            </View>
          </View>
        )}

        {/* Event Details */}
        {!loading && (
          <View style={styles.eventDetailsContainer}>
            <Text style={styles.sectionTitle}>Event Information</Text>
            <View style={styles.eventDetailsCard}>
              <View style={styles.eventDetailRow}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.eventDetailLabel}>Capacity:</Text>
                <Text style={styles.eventDetailValue}>
                  {event.attendeeLimit}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {!loading && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                entrances.length === 0 && styles.disabledButton,
              ]}
              onPress={startScanning}
              disabled={entrances.length === 0}
            >
              <Ionicons name="qr-code-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>
                {entrances.length === 0
                  ? 'No Entrances'
                  : entrances.length === 1
                  ? 'Start Scanning'
                  : 'Select Entrance'}
              </Text>
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
        )}

        {/* Attendees List */}
        {!loading && (
          <View style={styles.attendeesContainer}>
            <Text style={styles.sectionTitle}>
              Attendees ({eventStats.totalRegistered})
            </Text>

            {attendees.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No attendees yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Attendees will appear here when they register
                </Text>
              </View>
            ) : (
              attendees.map((attendee) => (
                <View key={attendee.id} style={styles.attendeeCard}>
                  <View style={styles.attendeeInfo}>
                    <View style={styles.attendeeHeader}>
                      <Text style={styles.attendeeName}>{attendee.name}</Text>
                      {attendee.isCheckedIn && (
                        <View style={styles.checkedInBadge}>
                          <Ionicons name="checkmark" size={12} color="white" />
                          <Text style={styles.checkedInText}>Checked In</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.attendeeEmail}>{attendee.email}</Text>
                    <View style={styles.attendeeDetails}>
                      <Text style={styles.attendeeDetailText}>
                        Registered:{' '}
                        {new Date(
                          attendee.registrationDate
                        ).toLocaleDateString()}
                      </Text>
                      {attendee.checkInTime && (
                        <Text style={styles.attendeeDetailText}>
                          Checked in:{' '}
                          {new Date(attendee.checkInTime).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Entrances List */}
        {!loading && (
          <View style={styles.entrancesContainer}>
            <Text style={styles.sectionTitle}>
              Entrances ({entrances.length})
            </Text>

            {entrances.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="enter-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>
                  No entrances configured
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Entrances will appear here when they are created
                </Text>
              </View>
            ) : (
              entrances.map((entrance) => (
                <View key={entrance.id} style={styles.entranceCard}>
                  <View style={styles.entranceInfo}>
                    <View style={styles.entranceHeader}>
                      <Text style={styles.entranceName}>{entrance.name}</Text>
                      <View style={styles.capacityBadge}>
                        <Ionicons name="people" size={12} color="#2563EB" />
                        <Text style={styles.capacityText}>
                          Max: {entrance.maxCapacity}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.entranceDetails}>
                      <Text style={styles.entranceDetailText}>
                        Created:{' '}
                        {new Date(entrance.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={styles.entranceDetailText}>
                        ID: {entrance.id}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Entrance Selection Modal */}
      <Modal
        visible={showEntranceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEntranceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Entrance</Text>
              <TouchableOpacity
                onPress={() => setShowEntranceModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose an entrance to start scanning for check-ins
            </Text>

            <ScrollView style={styles.entranceList}>
              {entrances.map((entrance) => (
                <TouchableOpacity
                  key={entrance.id}
                  style={styles.entranceOption}
                  onPress={() => selectEntrance(entrance)}
                >
                  <View style={styles.entranceOptionContent}>
                    <View style={styles.entranceOptionHeader}>
                      <Text style={styles.entranceOptionName}>
                        {entrance.name}
                      </Text>
                      <View style={styles.entranceOptionCapacity}>
                        <Ionicons name="people" size={16} color="#2563EB" />
                        <Text style={styles.entranceOptionCapacityText}>
                          {entrance.maxCapacity}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.entranceOptionId}>
                      Entrance ID: {entrance.id}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEntranceModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginBottom: 24,
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
    marginBottom: 8,
  },
  eventDescription: {
    color: '#E0E7FF',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
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
    backgroundColor: '#EFF6FF',
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
  eventDetailsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  eventDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  eventDetailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
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
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryActionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  secondaryActionButtonText: {
    color: '#2563EB',
  },
  attendeesContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  entrancesContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  attendeeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entranceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attendeeInfo: {
    flex: 1,
  },
  entranceInfo: {
    flex: 1,
  },
  attendeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  entranceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  checkedInText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  capacityText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  attendeeDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  entranceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  attendeeDetailText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  entranceDetailText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  entranceList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  entranceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  entranceOptionContent: {
    flex: 1,
  },
  entranceOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entranceOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  entranceOptionCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  entranceOptionCapacityText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  entranceOptionId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
