import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Colors } from '@/constants/theme';
import {
  createQuestions,
  deleteQuestion,
  deleteTopic,
  getQuestionsByTopic,
  getTopic,
  updateTopic,
  updateTopicProgress,
  type Question,
  type Topic,
} from '@/app/db/queries';
import { formatRawText, type FormatProgress } from '@/app/lib/format-service';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState<FormatProgress>({ status: 'idle' });
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [t, qs] = await Promise.all([getTopic(id), getQuestionsByTopic(id)]);
      setTopic(t ?? null);
      setQuestions(qs ?? []);
    } catch (err) {
      console.error('[Topic] loadData failed', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConvert = async () => {
    const text = rawText.trim();
    if (!text) {
      Alert.alert('Empty input', 'Paste some text to convert.');
      return;
    }
    if (!id) return;

    setConverting(true);
    setProgress({ status: 'processing', message: 'Converting...' });
    try {
      await updateTopicProgress(id, 0);
    } catch (e) {
      console.warn('[Topic] updateTopicProgress(0) failed', e);
    }

    try {
      const items = await formatRawText(text, (p) => setProgress(p));
      if (items.length > 0) {
        await createQuestions(id, items);
        await updateTopicProgress(id, 100);
        await loadData();
      }
      setRawText('');
      setProgress({ status: 'done', message: `Added ${items.length} Q&A pairs` });
    } catch (err) {
      console.error('[Topic] handleConvert failed', err);
      setProgress({
        status: 'error',
        message: err instanceof Error ? err.message : 'Conversion failed',
      });
      Alert.alert('Conversion failed', String(err));
    } finally {
      setConverting(false);
    }
  };

  const handleStartReading = () => {
    if (questions.length === 0) return;
    router.push(`/reader/${id}`);
  };

  const handleDeleteTopic = () => {
    if (!id) return;
    Alert.alert(
      'Delete topic',
      'Delete this topic and all its questions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTopic(id);
              router.replace('/');
            } catch (err) {
              console.error('[Topic] deleteTopic failed', err);
              Alert.alert('Error', 'Could not delete topic.');
            }
          },
        },
      ]
    );
  };

  const openEditNameModal = () => {
    setEditNameValue(topic?.name ?? '');
    setEditNameModalVisible(true);
  };

  const handleSaveTopicName = async () => {
    const name = editNameValue.trim() || topic?.name || 'Untitled topic';
    setEditNameModalVisible(false);
    if (!id) return;
    try {
      await updateTopic(id, name);
      setTopic((prev) => (prev ? { ...prev, name } : null));
    } catch (err) {
      console.error('[Topic] updateTopic failed', err);
      Alert.alert('Error', 'Could not update topic name.');
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    Alert.alert(
      'Delete question',
      'Remove this Q&A from the topic?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuestion(questionId);
              await loadData();
            } catch (err) {
              console.error('[Topic] deleteQuestion failed', err);
              Alert.alert('Error', 'Could not delete question.');
            }
          },
        },
      ]
    );
  };

  if (loading || !topic) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const hasQuestions = questions.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="NavArrowLeft" size={24} color={Colors.dark.primaryText} />
        </Pressable>
        <Pressable style={styles.titleRow} onPress={openEditNameModal}>
          <Text style={styles.title} numberOfLines={1}>
            {topic.name}
          </Text>
          <Icon name="Edit" size={18} color={Colors.dark.secondaryText} />
        </Pressable>
        <Pressable onPress={handleDeleteTopic} style={styles.deleteHeaderBtn}>
          <Icon name="Trash" size={22} color={Colors.dark.secondaryText} />
        </Pressable>
      </View>

      <Modal
        visible={editNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNameModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditNameModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit topic name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Topic name"
              placeholderTextColor={Colors.dark.secondaryText}
              value={editNameValue}
              onChangeText={setEditNameValue}
              autoFocus
              onSubmitEditing={handleSaveTopicName}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setEditNameModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleSaveTopicName}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paste raw text</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Paste your notes, articles, or any text..."
            placeholderTextColor={Colors.dark.secondaryText}
            value={rawText}
            onChangeText={setRawText}
            multiline
            editable={!converting}
          />
          <Pressable
            onPress={handleConvert}
            disabled={converting}
            style={[styles.convertButton, converting && styles.buttonDisabled]}>
            {converting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="Edit" size={20} color="#fff" />
                <Text style={styles.convertText}>Convert to Q&A</Text>
              </>
            )}
          </Pressable>
          {progress.status !== 'idle' && (
            <Text
              style={[
                styles.progressText,
                progress.status === 'error' && styles.progressError,
              ]}>
              {progress.message}
            </Text>
          )}
        </View>

        {hasQuestions && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
              <Pressable onPress={handleStartReading} style={styles.readButton}>
                <Icon name="Book" size={18} color="#fff" />
                <Text style={styles.readText}>Start Reading</Text>
              </Pressable>
            </View>

            <FlatList
              data={questions}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.questionItem}>
                  <Text style={styles.questionPreview} numberOfLines={2}>
                    {item.question}
                  </Text>
                  <Pressable
                    onPress={() => handleDeleteQuestion(item.id)}
                    style={styles.deleteQuestionBtn}
                    hitSlop={8}>
                    <Icon name="Trash" size={18} color={Colors.dark.secondaryText} />
                  </Pressable>
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.primaryText,
  },
  deleteHeaderBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark.primaryText,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    color: Colors.dark.primaryText,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.accent,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  convertText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressText: {
    fontSize: 14,
    color: Colors.dark.secondaryText,
    marginTop: 8,
  },
  progressError: {
    color: '#ef4444',
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.dark.accent,
    borderRadius: 10,
  },
  readText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    marginBottom: 8,
  },
  questionPreview: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.primaryText,
  },
  deleteQuestionBtn: {
    padding: 4,
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
  modalSave: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
