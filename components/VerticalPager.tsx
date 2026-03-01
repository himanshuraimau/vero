import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

export type VerticalPagerProps = {
  children: React.ReactNode[];
  initialPage?: number;
  onPageSelected?: (index: number) => void;
};

export function VerticalPager({
  children,
  initialPage = 0,
  onPageSelected,
}: VerticalPagerProps) {
  const { height } = useWindowDimensions();
  const pageHeight = height || 600;
  return (
    <ScrollView
      style={styles.pager}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const offset = e.nativeEvent.contentOffset.y;
        const index = Math.round(offset / pageHeight);
        onPageSelected?.(index);
      }}
      contentOffset={{ x: 0, y: initialPage * pageHeight }}>
      {children.map((child, i) => (
        <View key={i} style={[styles.page, { minHeight: pageHeight }]}>
          {child}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
