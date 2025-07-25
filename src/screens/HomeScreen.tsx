import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { eventsApi, entrancesApi } from '../services/api';

interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  attendeeLimit: number;
  registeredCount?: number;
  checkedInCount?: number;
  checkInRate?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Entrance {
  id: number;
  name: string;
  maxCapacity: number;
  eventId: number;
  createdAt: string;
  updatedAt: string;
}

export default function HomeScreen({ navigation }: any) {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEntranceModal, setShowEntranceModal] = useState(false);

  useEffect(() => {
    loadSelectedEvent();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    if (!accessToken) {
      console.error('No access token available in HomeScreen');
      return;
    }

    try {
      setLoading(true);

      const eventsData = await eventsApi.getAll(accessToken);

      // Calculate check-in rates for each event (against max capacity)
      const eventsWithRates = eventsData.map((event: Event) => {
        const attendeeLimit = event.attendeeLimit || 0;
        const checkedInCount = event.checkedInCount || 0;
        const checkInRate =
          attendeeLimit > 0
            ? Math.round((checkedInCount / attendeeLimit) * 100)
            : 0;

        return {
          ...event,
          checkInRate,
        };
      });

      setEvents(eventsWithRates);
    } catch (error: any) {
      console.error('HomeScreen: Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedEvent = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      if (eventData) {
        const event = JSON.parse(eventData);

        // Recalculate check-in rate in case it wasn't calculated before (against max capacity)
        const attendeeLimit = event.attendeeLimit || 0;
        const checkedInCount = event.checkedInCount || 0;
        const checkInRate =
          attendeeLimit > 0
            ? Math.round((checkedInCount / attendeeLimit) * 100)
            : 0;

        const selectedEventWithRate = {
          ...event,
          checkInRate,
        };

        setSelectedEvent(selectedEventWithRate);

        // Fetch entrances for the selected event
        await fetchEntrances(selectedEventWithRate);
      }
    } catch (error) {
      console.error('Error loading selected event:', error);
    }
  };

  const fetchEntrances = async (event: Event) => {
    if (!accessToken || !event) {
      return;
    }

    try {
      const entrancesData = await entrancesApi.getByEvent(
        Number(event.id),
        accessToken
      );
      setEntrances(entrancesData);
    } catch (error: any) {
      console.error('Error fetching entrances:', error);
      // Don't show alert for entrance errors, just set empty array
      setEntrances([]);
    }
  };

  const selectEvent = async (event: Event) => {
    try {
      // Ensure the event has the correct check-in rate calculated (against max capacity)
      const attendeeLimit = event.attendeeLimit || 0;
      const checkedInCount = event.checkedInCount || 0;
      const checkInRate =
        attendeeLimit > 0
          ? Math.round((checkedInCount / attendeeLimit) * 100)
          : 0;

      const eventWithRate = {
        ...event,
        checkInRate,
      };

      await AsyncStorage.setItem(
        'selectedEvent',
        JSON.stringify(eventWithRate)
      );
      setSelectedEvent(eventWithRate);

      // Fetch entrances for the newly selected event
      await fetchEntrances(eventWithRate);

      Alert.alert(
        'Event Selected',
        `${event.name} is now active for scanning.`
      );
    } catch (error) {
      console.error('Error saving selected event:', error);
    }
  };

  const deselectEvent = async () => {
    try {
      await AsyncStorage.removeItem('selectedEvent');
      setSelectedEvent(null);
      setEntrances([]); // Clear entrances when deselecting event
      Alert.alert(
        'Selection Cleared',
        'No event is currently active for scanning.'
      );
    } catch (error) {
      console.error('Error removing selection:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents().finally(() => {
      setRefreshing(false);
    });
  };

  const startScanning = () => {
    if (!selectedEvent) {
      Alert.alert(
        'No Event Selected',
        'Please select an event before scanning.'
      );
      return;
    }

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
        event: selectedEvent,
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
      event: selectedEvent,
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>KCC Events</Text>
              <Text style={styles.headerSubtitle}>
                Signed in as: {user?.email || 'user@example.com'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        )}

        {/* Active Event Card */}
        {selectedEvent && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('EventDetail', { event: selectedEvent })
            }
            style={styles.activeEventCard}
          >
            <View style={styles.activeEventHeader}>
              <Ionicons name="radio-button-on" size={16} color="#10B981" />
              <Text style={styles.activeEventLabel}>Active Event</Text>
            </View>
            <Text style={styles.activeEventTitle}>{selectedEvent.name}</Text>
            <Text style={styles.activeEventStats}>
              {selectedEvent.checkedInCount || 0} of{' '}
              {selectedEvent.attendeeLimit || 0} capacity •{' '}
              {selectedEvent.registeredCount || 0} registered •{' '}
              {selectedEvent.checkInRate || 0}% filled
            </Text>
          </TouchableOpacity>
        )}

        {/* Clear Selection Button */}
        {selectedEvent && (
          <View style={styles.scanButtonContainer}>
            <TouchableOpacity
              onPress={deselectEvent}
              style={styles.clearSelectionButtonMain}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.clearSelectionTextMain}>Clear Selection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Start Scanning Button */}
        {selectedEvent && (
          <View style={styles.scanButtonContainer}>
            <TouchableOpacity onPress={startScanning} style={styles.scanButton}>
              <Ionicons name="qr-code-outline" size={20} color="white" />
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Events List */}
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Events</Text>

          {events.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No events available</Text>
              <Text style={styles.emptyStateSubtext}>
                Events will appear here when they are created
              </Text>
            </View>
          ) : (
            events.map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => selectEvent(event)}
                style={[
                  styles.eventCard,
                  selectedEvent?.id === event.id && styles.selectedEventCard,
                ]}
              >
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.name}</Text>
                  {selectedEvent?.id === event.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#10B981"
                    />
                  )}
                </View>

                {event.description && (
                  <Text style={styles.eventDescription}>
                    {event.description}
                  </Text>
                )}

                <View style={styles.eventStats}>
                  <View style={styles.eventStatsLeft}>
                    <View style={styles.statRow}>
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.statText}>
                        Total Attendees: {event.registeredCount || 0}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Ionicons
                        name="person-add-outline"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.statText}>
                        Checked In: {event.checkedInCount || 0}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.statText}>
                        Date: {new Date(event.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.checkInRate}>
                    <Text style={styles.checkInRateNumber}>
                      {event.checkInRate || 0}%
                    </Text>
                    <Text style={styles.checkInRateLabel}>Capacity Filled</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('EventDetail', { event })}
                  style={styles.viewDetailsButton}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#2563EB" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#BFDBFE',
    fontSize: 14,
  },
  settingsButton: {
    padding: 8,
  },
  activeEventCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeEventLabel: {
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
  },
  activeEventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  activeEventStats: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  eventsContainer: {
    marginHorizontal: 16,
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  eventCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  selectedEventCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventStatsLeft: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  checkInRate: {
    alignItems: 'center',
  },
  checkInRateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  checkInRateLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewDetailsButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: '#2563EB',
    fontWeight: '500',
    marginRight: 4,
  },
  activeEntranceCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  activeEntranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeEntranceLabel: {
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 8,
  },
  activeEntranceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  activeEntranceStats: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16,
  },
  scanButtonContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  selectedEntranceCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  clearSelectionButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSelectionText: {
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 4,
  },
  clearSelectionButtonMain: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearSelectionTextMain: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
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
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
    width: '90%',
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
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  entranceList: {
    maxHeight: 300,
  },
  entranceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
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
    marginBottom: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entranceOptionCapacityText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  entranceOptionId: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});
