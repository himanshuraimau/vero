import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestionCard } from '@/components/QuestionCard';
import { VerticalPager } from '@/components/VerticalPager';
import { Icon } from '@/components/ui/icon';
import { Colors } from '@/constants/theme';
import { getQuestionsByTopic, getTopic, setQuestionRead } from '@/app/db/queries';
import type { Question, Topic } from '@/app/db/schema';

export default function ReaderScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const loadData = useCallback(async () => {
    if (!topicId) return;
    const [t, qs] = await Promise.all([
      getTopic(topicId),
      getQuestionsByTopic(topicId),
    ]);
    setTopic(t ?? null);
    setQuestions(qs);
  }, [topicId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleRead = async (id: string, next: boolean) => {
    try {
      await setQuestionRead(id, next);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, is_read: next ? 1 : 0 } : q))
      );
    } catch (err) {
      console.error('[Reader] setQuestionRead failed', err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const read = !!q.is_read;
    if (filter === 'read') return read;
    if (filter === 'unread') return !read;
    return true;
  });

  const total = filteredQuestions.length;

  useEffect(() => {
    if (currentPage >= total) {
      setCurrentPage(0);
    }
  }, [total, currentPage]);

  if (!topic || filteredQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="NavArrowLeft" size={24} color={Colors.dark.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="NavArrowLeft" size={24} color={Colors.dark.primaryText} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {topic.name}
        </Text>
        <Text style={styles.pageIndicator}>
          {total === 0 ? '0 / 0' : `${currentPage + 1} / ${total}`}
        </Text>
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

      <VerticalPager
        initialPage={0}
        onPageSelected={setCurrentPage}>
        {filteredQuestions.map((q) => (
          <QuestionCard
            key={q.id}
            id={q.id}
            question={q.question}
            answer={q.answer}
            isRead={!!q.is_read}
            onToggleRead={(next) => handleToggleRead(q.id, next)}
          />
        ))}
      </VerticalPager>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.primaryText,
  },
  pageIndicator: {
    fontSize: 15,
    color: Colors.dark.secondaryText,
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
});
