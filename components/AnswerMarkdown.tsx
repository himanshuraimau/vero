import React from 'react';
import Markdown from 'react-native-markdown-display';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

type AnswerMarkdownProps = {
  children: string;
};

export function AnswerMarkdown({ children }: AnswerMarkdownProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? Colors.dark : Colors.light;

  const markdownStyles = {
    body: {},
    paragraph: {
      marginTop: 8,
      marginBottom: 8,
      color: c.secondaryText,
      fontSize: 17,
      lineHeight: 26,
    },
    text: {
      color: c.secondaryText,
      fontSize: 17,
      lineHeight: 26,
    },
    code_inline: {
      backgroundColor: isDark ? '#292524' : '#f5f5f4',
      borderWidth: 1,
      borderColor: isDark ? '#44403c' : '#e7e5e4',
      color: c.primaryText,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 15,
    },
    code_block: {
      backgroundColor: isDark ? '#292524' : '#f5f5f4',
      borderWidth: 1,
      borderColor: isDark ? '#44403c' : '#e7e5e4',
      color: c.primaryText,
      padding: 14,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 14,
      lineHeight: 22,
      marginVertical: 12,
    },
    fence: {
      backgroundColor: isDark ? '#292524' : '#f5f5f4',
      borderWidth: 1,
      borderColor: isDark ? '#44403c' : '#e7e5e4',
      color: c.primaryText,
      padding: 14,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 14,
      lineHeight: 22,
      marginVertical: 12,
    },
    strong: {
      color: c.primaryText,
      fontWeight: '600',
    },
    link: {
      color: c.accent,
    },
    blockquote: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      borderLeftColor: c.accent,
      borderLeftWidth: 4,
      paddingLeft: 12,
      marginVertical: 8,
    },
  };

  return <Markdown style={markdownStyles}>{children || ''}</Markdown>;
}
