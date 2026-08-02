import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius } from "@/src/theme/tokens";

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = "100%", height = 16, radius: cornerRadius = radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: cornerRadius, backgroundColor: colors.line, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonGroup({ lines = 3, style }: { lines?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.group, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height={14} width={index === lines - 1 ? "60%" : "100%"} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
});
