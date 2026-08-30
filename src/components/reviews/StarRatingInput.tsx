import { Pressable, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { colors } from "@/src/theme/tokens";
import { getStarFill } from "@/src/utils/facilityRating";

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
    <View style={styles.row} accessible accessibilityLabel={`${Number.isFinite(value) ? value.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) : 0} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <View key={star} style={{ width: size, height: size }}>
          <Star size={size} color={colors.amber} fill="transparent" />
          <View style={{ position: "absolute", left: 0, top: 0, width: size * getStarFill(value, star), height: size, overflow: "hidden" }}>
            <Star size={size} color={colors.amber} fill={colors.amber} />
          </View>
        </View>
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
