import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Colors } from '@/constants/theme';
import { createTopic, deleteTopic, getTopics, type Topic } from '@/app/db/queries';

export default function HomeScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getTopics();
      setTopics(list);
    } catch (err) {
      console.error('[Home] loadTopics failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const openCreateModal = () => {
    setNewTopicName('');
    setCreateModalVisible(true);
  };

  const handleCreateTopic = async () => {
    const name = newTopicName.trim() || 'Untitled topic';
    setCreateModalVisible(false);
    setNewTopicName('');
    try {
      const topic = await createTopic(name);
      setTopics((prev) => [topic, ...prev]);
      router.push(`/topic/${topic.id}`);
    } catch (err) {
      console.error('[Home] createTopic failed', err);
      Alert.alert('Error', 'Could not create topic.');
    }
  };

  const handleDeleteTopic = (topicId: string, topicName: string) => {
    Alert.alert(
      'Delete topic',
      `Delete "${topicName}" and all its questions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTopic(topicId);
              await loadTopics();
            } catch (err) {
              console.error('[Home] deleteTopic failed', err);
              Alert.alert('Error', 'Could not delete topic.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Topics</Text>
        <Pressable onPress={openCreateModal} style={styles.addButton}>
          <Icon name="Plus" size={24} color={Colors.dark.accent} />
          <Text style={styles.addText}>Create Topic</Text>
        </Pressable>
      </View>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCreateModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New topic</Text>
            <Text style={styles.modalLabel}>Topic name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. React Hooks, History Chapter 3"
              placeholderTextColor={Colors.dark.secondaryText}
              value={newTopicName}
              onChangeText={setNewTopicName}
              autoFocus
              onSubmitEditing={handleCreateTopic}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalCreate} onPress={handleCreateTopic}>
                <Text style={styles.modalCreateText}>Create</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="Book" size={64} color={Colors.dark.secondaryText} />
            <Text style={styles.emptyText}>No topics yet</Text>
            <Text style={styles.emptySubtext}>Create a topic to get started</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.topicCard}
            onPress={() => router.push(`/topic/${item.id}`)}
            onLongPress={() => handleDeleteTopic(item.id, item.name)}>
            <Icon name="Book" size={24} color={Colors.dark.accent} />
            <Text style={styles.topicName}>{item.name}</Text>
            <Icon name="NavArrowRight" size={20} color={Colors.dark.secondaryText} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.primaryText,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addText: {
    fontSize: 16,
    color: Colors.dark.accent,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  topicName: {
    flex: 1,
    fontSize: 17,
    color: Colors.dark.primaryText,
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.dark.secondaryText,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: Colors.dark.secondaryText,
    marginTop: 4,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.primaryText,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 15,
    color: Colors.dark.secondaryText,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.dark.primaryText,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.dark.secondaryText,
  },
  modalCreate: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
