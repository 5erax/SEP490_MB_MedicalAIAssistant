import { Pressable, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { colors } from "@/src/theme/tokens";

const RATING_LABELS = ["", "Rất tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"];

export { RATING_LABELS };

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
};

export function StarRatingInput({ value, onChange, size = 28 }: StarRatingInputProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={RATING_LABELS[star]}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(star);
          }}
          hitSlop={4}
        >
          <Star size={size} color={colors.amber} fill={star <= value ? colors.amber : "transparent"} />
        </Pressable>
      ))}
    </View>
  );
}

export function StarRatingDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} color={colors.amber} fill={star <= Math.round(value) ? colors.amber : "transparent"} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
  },
});
