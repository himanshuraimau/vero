import PagerView from 'react-native-pager-view';
import { StyleSheet, View } from 'react-native';

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
  return (
    <PagerView
      style={styles.pager}
      initialPage={initialPage}
      orientation="vertical"
      onPageSelected={(e) => onPageSelected?.(e.nativeEvent.position)}>
      {children.map((child, i) => (
        <View key={i} style={styles.page} collapsable={false}>
          {child}
        </View>
      ))}
    </PagerView>
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
