// Ported from openFacilityDetail() in Web's NearbyClinicPage.jsx.
// Fetches the full facility record and merges it over the list-derived facility.
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { Globe, MapPin, Navigation, Phone, Share2, Stethoscope, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Badge, Button, LoadingState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useToast } from "@/src/hooks/useToast";
import { medicalFacilitiesApi } from "@/src/services/facilityService";
import { NormalizedFacility } from "@/src/types/facility";
import { getObjectData, mergeFacilityDetail } from "@/src/utils/facilityNormalize";
import { ReviewsSection } from "@/src/components/reviews";
import { RatingChangeHandler } from "@/src/hooks/useFacilityReviews";
import { FacilityRating } from "@/src/components/reviews/FacilityRating";
import { normalizeFacilityRating } from "@/src/utils/facilityRating";

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
  const { showToast } = useToast();
  const [detail, setDetail] = useState<NormalizedFacility | null>(facility);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const ratingRevision = useRef(0);
  const handleRatingChange = useCallback<RatingChangeHandler>((facilityId, summary) => {
    ratingRevision.current += 1;
    setDetail((current) => current?.facilityId === facilityId ? { ...current, ...summary } : current);
    onRatingChange?.(facilityId, summary);
  }, [onRatingChange]);

  useEffect(() => {
    if (!visible || !facility) return;
    let active = true;
    const initialRatingRevision = ratingRevision.current;
    setActiveTab("overview");
    setDetail(facility);
    setError("");

    setLoading(true);

    medicalFacilitiesApi.get(facility.facilityId).then((response) => {
      if (!active) return;
      const merged = mergeFacilityDetail(facility, getObjectData(response));
      // A slower initial detail request must not undo a later review edit.
      const ratingIsCurrent = initialRatingRevision === ratingRevision.current;
      setDetail((current) => ({ ...facility, ...merged, ...(!ratingIsCurrent && current ? normalizeFacilityRating(current) : {}) } as NormalizedFacility));
      if (ratingIsCurrent) onRatingChange?.(facility.facilityId, normalizeFacilityRating(merged));
    }).catch((reason) => {
      if (!active) return;
      setError((reason as Error)?.message || "Không tải được thông tin chi tiết cơ sở y tế.");
    }).finally(() => {
      if (!active) return;
      setLoading(false);
    });
    return () => { active = false; };
  }, [visible, facility, onRatingChange]);

  if (!facility) return null;
  const current = detail ?? facility;

  function callFacility() {
    if (!current.phone) return;
    Linking.openURL(`tel:${current.phone.replace(/\s+/g, "")}`);
  }

  function openDirections() {
    if (current.latitude == null || current.longitude == null) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${current.latitude},${current.longitude}`;
    Linking.openURL(url);
  }

  async function shareFacility() {
    try {
      await Share.share({ message: `${current.facilityName} — ${current.address}` });
    } catch {
      showToast({ type: "error", message: "Không thể chia sẻ lúc này. Vui lòng thử lại." });
    }
  }

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

              {loading ? <LoadingState title="Đang tải thông tin chi tiết..." /> : null}
              {error ? (
                <AppText variant="caption" color={colors.danger}>
                  {error}
                </AppText>
              ) : null}

              <View style={styles.actions}>
                <Button variant="secondary" onPress={openDirections} disabled={current.latitude == null}>
                  <View style={styles.actionInline}>
                    <Navigation size={16} color={colors.ink} />
                    <AppText variant="bodyStrong">Chỉ đường</AppText>
                  </View>
                </Button>
                <Button variant="secondary" onPress={callFacility} disabled={!current.phone}>
                  <View style={styles.actionInline}>
                    <Phone size={16} color={colors.ink} />
                    <AppText variant="bodyStrong">Gọi</AppText>
                  </View>
                </Button>
                <Button variant="secondary" onPress={shareFacility}>
                  <View style={styles.actionInline}>
                    <Share2 size={16} color={colors.ink} />
                    <AppText variant="bodyStrong">Chia sẻ</AppText>
                  </View>
                </Button>
              </View>
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
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
