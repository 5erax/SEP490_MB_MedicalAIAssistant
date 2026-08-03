import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { FacilityTypeKey } from "@/src/types/facility";
import { TYPE_LABELS } from "@/src/utils/facilityNormalize";

type FacilityFiltersProps = {
  searchText: string;
  onChangeSearchText: (value: string) => void;
  selectedType: FacilityTypeKey | "all";
  onChangeType: (type: FacilityTypeKey | "all") => void;
  availableTypes: FacilityTypeKey[];
};

export function FacilityFilters({ searchText, onChangeSearchText, selectedType, onChangeType, availableTypes }: FacilityFiltersProps) {
  const typeOptions: { key: FacilityTypeKey | "all"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    ...availableTypes.map((key) => ({ key, label: TYPE_LABELS[key] })),
  ];

  return (
    <View style={styles.group}>
      <TextField
        label="Tìm kiếm"
        value={searchText}
        onChangeText={onChangeSearchText}
        placeholder="Tên cơ sở, địa chỉ, chuyên khoa..."
        returnKeyType="search"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {typeOptions.map((option) => {
          const selected = selectedType === option.key;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChangeType(option.key)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <AppText variant="caption" color={selected ? colors.white : colors.muted}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.md,
  },
  chipRow: {
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
});
