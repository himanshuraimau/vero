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
import {
  deleteUserOpenAIKey,
  getUserOpenAIKey,
  setUserOpenAIKey,
} from '@/app/lib/user-settings';
import {
  createTopic,
  deleteTopic,
  getTopics,
  setTopicRead,
  type Topic,
} from '@/app/db/queries';

export default function HomeScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

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

  const openSettingsModal = useCallback(async () => {
    setSettingsVisible(true);
    setSettingsLoading(true);
    try {
      const existing = await getUserOpenAIKey();
      setApiKeyInput(existing ?? '');
    } catch (err) {
      console.error('[Home] load user settings failed', err);
      Alert.alert('Error', 'Could not load settings.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const handleSaveApiKey = useCallback(async () => {
    const value = apiKeyInput.trim();
    if (!value) {
      Alert.alert('Invalid key', 'Enter a valid OpenAI API key or use Clear to remove it.');
      return;
    }
    try {
      await setUserOpenAIKey(value);
      Alert.alert('Saved', 'API key saved on this device.');
      setSettingsVisible(false);
    } catch (err) {
      console.error('[Home] save user API key failed', err);
      Alert.alert('Error', 'Could not save API key.');
    }
  }, [apiKeyInput]);

  const handleClearApiKey = useCallback(async () => {
    try {
      await deleteUserOpenAIKey();
      setApiKeyInput('');
      Alert.alert('Removed', 'API key removed from this device.');
    } catch (err) {
      console.error('[Home] delete user API key failed', err);
      Alert.alert('Error', 'Could not remove API key.');
    }
  }, []);

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
      const message =
        __DEV__ && err instanceof Error ? `${err.message}` : 'Could not create topic.';
      Alert.alert('Error', message);
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

  const handleToggleTopicRead = async (topicId: string, current?: number) => {
    const next = !current;
    try {
      await setTopicRead(topicId, next);
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, is_read: next ? 1 : 0 } : t))
      );
    } catch (err) {
      console.error('[Home] setTopicRead failed', err);
    }
  };

  const filteredTopics = topics.filter((t) => {
    const read = !!t.is_read;
    if (filter === 'read') return read;
    if (filter === 'unread') return !read;
    return true;
  });

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
        <View style={styles.headerActions}>
          <Pressable
            onPress={openSettingsModal}
            style={styles.iconButton}
            hitSlop={10}>
            <Icon name="Settings" size={22} color={Colors.dark.secondaryText} />
          </Pressable>
          <Pressable onPress={openCreateModal} style={styles.addButton}>
            <Icon name="Plus" size={24} color={Colors.dark.accent} />
            <Text style={styles.addText}>Create Topic</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[
            styles.filterChip,
            filter === 'all' && styles.filterChipActive,
          ]}>
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}>
            All
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('unread')}
          style={[
            styles.filterChip,
            filter === 'unread' && styles.filterChipActive,
          ]}>
          <Text
            style={[
              styles.filterText,
              filter === 'unread' && styles.filterTextActive,
            ]}>
            Unread
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('read')}
          style={[
            styles.filterChip,
            filter === 'read' && styles.filterChipActive,
          ]}>
          <Text
            style={[
              styles.filterText,
              filter === 'read' && styles.filterTextActive,
            ]}>
            Read
          </Text>
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

      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSettingsVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Settings</Text>
            <Text style={styles.modalLabel}>OpenAI API key</Text>
            {settingsLoading ? (
              <View style={styles.settingsLoadingRow}>
                <ActivityIndicator size="small" color={Colors.dark.accent} />
                <Text style={styles.settingsLoadingText}>Loading…</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="sk-..."
                  placeholderTextColor={Colors.dark.secondaryText}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.settingsHint}>
                  Stored only on this device and used to generate questions. Do not use a key you
                  cannot rotate.
                </Text>
              </>
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={handleClearApiKey}>
                <Text style={styles.modalCancelText}>Clear</Text>
              </Pressable>
              <Pressable style={styles.modalCreate} onPress={handleSaveApiKey}>
                <Text style={styles.modalCreateText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={filteredTopics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="Book" size={64} color={Colors.dark.secondaryText} />
            <Text style={styles.emptyText}>No topics yet</Text>
            <Text style={styles.emptySubtext}>Create a topic to get started</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isRead = !!item.is_read;
          return (
            <Pressable
              style={styles.topicCard}
              onPress={() => router.push(`/topic/${item.id}`)}
              onLongPress={() => handleDeleteTopic(item.id, item.name)}>
              <Icon name="Book" size={24} color={Colors.dark.accent} />
              <Text style={styles.topicName}>{item.name}</Text>
              <Pressable
                onPress={() => handleToggleTopicRead(item.id, item.is_read)}
                hitSlop={8}
                style={styles.topicReadToggle}>
                <Icon
                  name={isRead ? 'CheckCircle' : 'Circle'}
                  size={20}
                  color={isRead ? Colors.dark.accent : Colors.dark.secondaryText}
                />
              </Pressable>
              <Icon name="NavArrowRight" size={20} color={Colors.dark.secondaryText} />
            </Pressable>
          );
        }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.primaryText,
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  filterText: {
    fontSize: 13,
    color: Colors.dark.secondaryText,
  },
  filterTextActive: {
    color: '#fff',
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
  topicReadToggle: {
    paddingHorizontal: 4,
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
  settingsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  settingsLoadingText: {
    fontSize: 14,
    color: Colors.dark.secondaryText,
  },
  settingsHint: {
    fontSize: 13,
    color: Colors.dark.secondaryText,
    marginBottom: 12,
  },
});
