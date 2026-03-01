import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestionCard } from '@/components/QuestionCard';
import { VerticalPager } from '@/components/VerticalPager';
import { Icon } from '@/components/ui/icon';
import { Colors } from '@/constants/theme';
import { getQuestionsByTopic, getTopic } from '@/app/db/queries';
import type { Question, Topic } from '@/app/db/schema';

export default function ReaderScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

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

  if (!topic || questions.length === 0) {
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
          {currentPage + 1} / {questions.length}
        </Text>
      </View>

      <VerticalPager
        initialPage={0}
        onPageSelected={setCurrentPage}>
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            id={q.id}
            question={q.question}
            answer={q.answer}
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
});
