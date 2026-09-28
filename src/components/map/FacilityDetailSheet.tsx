import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Globe, MapPin, Phone, Stethoscope, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { NormalizedFacility } from "@/src/types/facility";
import { ReviewsSection } from "@/src/components/reviews";
import { RatingChangeHandler } from "@/src/hooks/useFacilityReviews";
import { FacilityRating } from "@/src/components/reviews/FacilityRating";

type DetailTab = "overview" | "reviews";

const TAB_LABELS: Record<DetailTab, string> = {
  overview: "Tổng quan",
  reviews: "Đánh giá",
};

type FacilityDetailSheetProps = {
  facility: NormalizedFacility | null;
  visible: boolean;
  onClose: () => void;
  onRatingChange?: RatingChangeHandler;
};

export function FacilityDetailSheet({ facility, visible, onClose, onRatingChange }: FacilityDetailSheetProps) {
  const [detail, setDetail] = useState<NormalizedFacility | null>(facility);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const handleRatingChange = useCallback<RatingChangeHandler>((facilityId, summary) => {
    setDetail((current) => {
      if (current?.facilityId !== facilityId) return current;
      if (current.averageRating === summary.averageRating && current.reviewCount === summary.reviewCount) return current;
      return { ...current, ...summary };
    });
    onRatingChange?.(facilityId, summary);
  }, [onRatingChange]);

  useEffect(() => {
    if (!visible || !facility) return;
    setActiveTab("overview");
    setDetail(facility);
  }, [visible, facility]);

  if (!facility) return null;
  const current = detail ?? facility;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <AppText variant="h3" style={styles.headerTitle} numberOfLines={2}>
            {current.facilityName}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.tabBar}>
          {(["overview", "reviews"] as DetailTab[]).map((tab) => (
            <Pressable
              key={tab}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === tab }}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            >
              <AppText variant="bodyStrong" color={activeTab === tab ? colors.ink : colors.subtle}>
                {TAB_LABELS[tab]}
              </AppText>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === "overview" ? (
            <>
              <Badge tone="info">{current.facilityTypeLabel}</Badge>
              <Pressable accessibilityRole="button" accessibilityLabel="Xem đánh giá của cơ sở" onPress={() => setActiveTab("reviews")}>
                <FacilityRating averageRating={current.averageRating} reviewCount={current.reviewCount} />
              </Pressable>

              <View style={styles.infoRow}>
                <MapPin size={16} color={colors.subtle} />
                <AppText color={colors.muted} style={styles.infoText}>
                  {current.address}
                </AppText>
              </View>
              {current.phone ? (
                <View style={styles.infoRow}>
                  <Phone size={16} color={colors.subtle} />
                  <AppText color={colors.muted}>{current.phone}</AppText>
                </View>
              ) : null}
              {current.website ? (
                <View style={styles.infoRow}>
                  <Globe size={16} color={colors.subtle} />
                  <AppText color={colors.muted} style={styles.infoText} numberOfLines={1}>
                    {current.website}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <Stethoscope size={16} color={colors.subtle} />
                <AppText color={colors.muted} style={styles.infoText}>
                  {current.departments.join(", ")}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.subtle}>
                Giờ mở cửa: {current.openingHours}
              </AppText>
            </>
          ) : (
            <ReviewsSection key={current.facilityId} facilityId={current.facilityId} onRatingChange={handleRatingChange} />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: colors.teal,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing["4xl"],
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
  },
});
