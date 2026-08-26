import { ReactNode, RefObject } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/src/theme/tokens";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollRef?: RefObject<ScrollView | null>;
};

export function Screen({ children, scroll = false, padded = true, style, contentContainerStyle, scrollRef }: ScreenProps) {
  const contentStyle = [padded && styles.padded, contentContainerStyle];

  return (
    <SafeAreaView style={[styles.root, style]}>
      {scroll ? (
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={contentStyle}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  padded: {
    padding: spacing.lg,
  },
});
