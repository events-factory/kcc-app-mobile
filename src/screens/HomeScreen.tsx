import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Event {
  id: string;
  name: string;
  attendeeLimit: number;
  registered: number;
  checkedIn: number;
  checkInRate: number;
}

interface Entrance {
  id: string;
  name: string;
  maxCapacity: string;
  isActive: boolean;
}

export default function HomeScreen({ navigation }: any) {
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      name: 'KCC Annual Conference 2025',
      attendeeLimit: 300,
      registered: 85,
      checkedIn: 0,
      checkInRate: 0,
    },
    {
      id: '2',
      name: 'KCC Developer Workshop',
      attendeeLimit: 150,
      registered: 76,
      checkedIn: 0,
      checkInRate: 0,
    },
  ]);

  const [entrances, setEntrances] = useState<Entrance[]>([
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

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEntrance, setSelectedEntrance] = useState<Entrance | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSelectedEvent();
    loadSelectedEntrance();
  }, []);

  const loadSelectedEvent = async () => {
    try {
      const eventData = await AsyncStorage.getItem('selectedEvent');
      if (eventData) {
        setSelectedEvent(JSON.parse(eventData));
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
      }
    } catch (error) {
      console.error('Error loading selected entrance:', error);
    }
  };

  const selectEvent = async (event: Event) => {
    try {
      await AsyncStorage.setItem('selectedEvent', JSON.stringify(event));
      setSelectedEvent(event);
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
      await AsyncStorage.removeItem('selectedEntrance');
      setSelectedEvent(null);
      setSelectedEntrance(null);
      Alert.alert(
        'Selections Cleared',
        'No event or entrance is currently active for scanning.'
      );
    } catch (error) {
      console.error('Error removing selections:', error);
    }
  };

  const selectEntrance = async (entrance: Entrance) => {
    try {
      await AsyncStorage.setItem('selectedEntrance', JSON.stringify(entrance));
      setSelectedEntrance(entrance);
      Alert.alert(
        'Entrance Selected',
        `${entrance.name} is now active for scanning.`
      );
    } catch (error) {
      console.error('Error saving selected entrance:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const startScanning = () => {
    if (!selectedEvent) {
      Alert.alert(
        'No Event Selected',
        'Please select an event before scanning.'
      );
      return;
    }
    if (!selectedEntrance) {
      Alert.alert(
        'No Entrance Selected',
        'Please select an entrance before scanning.'
      );
      return;
    }
    navigation.navigate('Scanner');
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
                Signed in as: admin@kccevents.com
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

        {/* Active Event Card */}
        {selectedEvent && (
          <View style={styles.activeEventCard}>
            <View style={styles.activeEventHeader}>
              <Ionicons name="radio-button-on" size={16} color="#10B981" />
              <Text style={styles.activeEventLabel}>Active Event</Text>
            </View>
            <Text style={styles.activeEventTitle}>{selectedEvent.name}</Text>
            <Text style={styles.activeEventStats}>
              {selectedEvent.registered} registered • {selectedEvent.checkedIn}{' '}
              checked in
            </Text>
          </View>
        )}

        {/* Active Entrance Card */}
        {selectedEntrance && (
          <View style={styles.activeEntranceCard}>
            <View style={styles.activeEntranceHeader}>
              <Ionicons name="radio-button-on" size={16} color="#F59E0B" />
              <Text style={styles.activeEntranceLabel}>Active Entrance</Text>
            </View>
            <Text style={styles.activeEntranceTitle}>
              {selectedEntrance.name}
            </Text>
            <Text style={styles.activeEntranceStats}>
              Capacity: {selectedEntrance.maxCapacity} • Status:{' '}
              {selectedEntrance.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        )}

        {/* Clear Selection Button */}
        {(selectedEvent || selectedEntrance) && (
          <View style={styles.scanButtonContainer}>
            <TouchableOpacity
              onPress={deselectEvent}
              style={styles.clearSelectionButtonMain}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.clearSelectionTextMain}>
                Clear All Selections
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Start Scanning Button */}
        {selectedEvent && selectedEntrance && (
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

          {events.map((event) => (
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
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>

              <View style={styles.eventStats}>
                <View style={styles.eventStatsLeft}>
                  <View style={styles.statRow}>
                    <Ionicons name="people-outline" size={16} color="#6B7280" />
                    <Text style={styles.statText}>
                      Total Attendees: {event.registered}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Ionicons
                      name="person-add-outline"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.statText}>
                      Checked In: {event.checkedIn}
                    </Text>
                  </View>
                </View>

                <View style={styles.checkInRate}>
                  <Text style={styles.checkInRateNumber}>
                    {event.checkInRate}%
                  </Text>
                  <Text style={styles.checkInRateLabel}>Check-in Rate</Text>
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
          ))}
        </View>

        {/* Entrances List */}
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Entrance Management</Text>

          {entrances.map((entrance) => (
            <TouchableOpacity
              key={entrance.id}
              onPress={() => selectEntrance(entrance)}
              style={[
                styles.eventCard,
                selectedEntrance?.id === entrance.id &&
                  styles.selectedEntranceCard,
              ]}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{entrance.name}</Text>
                {selectedEntrance?.id === entrance.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                )}
              </View>

              <View style={styles.eventStats}>
                <View style={styles.eventStatsLeft}>
                  <View style={styles.statRow}>
                    <Ionicons name="resize-outline" size={16} color="#6B7280" />
                    <Text style={styles.statText}>
                      Max Capacity: {entrance.maxCapacity}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Ionicons
                      name={
                        entrance.isActive
                          ? 'checkmark-circle-outline'
                          : 'close-circle-outline'
                      }
                      size={16}
                      color={entrance.isActive ? '#10B981' : '#EF4444'}
                    />
                    <Text style={styles.statText}>
                      Status: {entrance.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.checkInRate}>
                  <Text style={styles.checkInRateNumber}>ID</Text>
                  <Text style={styles.checkInRateLabel}>{entrance.id}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
});
