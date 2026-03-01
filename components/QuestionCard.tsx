import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AnswerMarkdown } from '@/components/AnswerMarkdown';
import { Colors } from '@/constants/theme';

const TRUNCATE_LENGTH = 500;

export type QuestionCardProps = {
  id: string;
  question: string;
  answer: string;
  onReadMore?: () => void;
};

export function QuestionCard({ id, question, answer, onReadMore }: QuestionCardProps) {
  const router = useRouter();
  const isLong = answer.length > TRUNCATE_LENGTH;
  const displayAnswer = isLong ? answer.slice(0, TRUNCATE_LENGTH) + '...' : answer;

  const openDetail = () => {
    onReadMore?.();
    router.push(`/detail/${id}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.divider} />
      <AnswerMarkdown>{displayAnswer}</AnswerMarkdown>
      <Pressable onPress={openDetail} style={styles.detailLink}>
        <Text style={styles.detailLinkText}>
          {isLong ? 'Read More' : 'View in detail'}
        </Text>
        <Icon name="NavArrowRight" size={16} color={Colors.dark.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
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
  answer: {
    fontSize: 17,
    color: Colors.dark.secondaryText,
    lineHeight: 26,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  detailLinkText: {
    fontSize: 15,
    color: Colors.dark.accent,
    fontWeight: '500',
  },
});
