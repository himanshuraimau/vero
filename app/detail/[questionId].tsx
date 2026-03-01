import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { AnswerMarkdown } from '@/components/AnswerMarkdown';
import { Colors } from '@/constants/theme';
import { getQuestion } from '@/app/db/queries';
import type { Question } from '@/app/db/schema';

export default function DetailScreen() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);

  const loadData = useCallback(async () => {
    if (!questionId) return;
    const q = await getQuestion(questionId);
    setQuestion(q ?? null);
  }, [questionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!question) {
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
        <Text style={styles.headerTitle}>Full Answer</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{question.question}</Text>
        <View style={styles.divider} />
        <AnswerMarkdown>{question.answer}</AnswerMarkdown>
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.primaryText,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  question: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.dark.primaryText,
    lineHeight: 30,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.divider,
    marginBottom: 20,
  },
});
