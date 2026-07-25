import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { FlagBadge } from '../components/FlagBadge';
import { useAppStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'PriorityList'>;

export function PriorityListScreen({ navigation }: Props) {
  const { clients, isSyncing } = useAppStore();

  // TODO: load clients from SQLite on mount; sort by flag severity desc
  const prioritisedClients = [...clients].sort((a) => (a.active ? -1 : 1));

  return (
    <View style={styles.container}>
      {isSyncing && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.syncText}>Syncing…</Text>
        </View>
      )}
      <FlatList
        data={prioritisedClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Client', { clientId: item.id })}
            accessibilityRole="button"
            accessibilityLabel={`Open record for ${item.name}`}
          >
            <View style={styles.cardRow}>
              <Text style={styles.clientName}>{item.name}</Text>
              <Text style={styles.clientType}>{item.type === 'pregnant' ? '🤰' : '👶'}</Text>
            </View>
            {/* TODO: render FlagBadge for latest flag severity */}
            <FlagBadge severity="watch" label="Low diet diversity" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No clients registered. Tap + to add a client.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  syncBanner: {
    backgroundColor: '#1a7c4e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  syncText: { color: '#fff', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientName: { fontSize: 17, fontWeight: '600', color: '#111' },
  clientType: { fontSize: 20 },
  empty: { textAlign: 'center', marginTop: 48, color: '#888', fontSize: 15 },
});
