// Ported from openFacilityDetail() in Web's NearbyClinicPage.jsx — fetches
// the full facility record + active doctors at that facility in parallel,
// merges the fresh detail over the list-derived facility. The Doctors tab's
// full browsing UI is Module 6 — this sheet only shows a count teaser.
import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { Globe, MapPin, Navigation, Phone, Share2, Stethoscope, X } from "lucide-react-native";

import { AppText, Badge, Button, LoadingState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useToast } from "@/src/hooks/useToast";
import { doctorManagementApi } from "@/src/services/doctorService";
import { medicalFacilitiesApi } from "@/src/services/facilityService";
import { NormalizedFacility } from "@/src/types/facility";
import { getArrayData, getObjectData, mergeFacilityDetail } from "@/src/utils/facilityNormalize";
import { ReviewsSection } from "@/src/components/reviews";

type DetailTab = "overview" | "reviews";

type FacilityDetailSheetProps = {
  facility: NormalizedFacility | null;
  visible: boolean;
  onClose: () => void;
};

export function FacilityDetailSheet({ facility, visible, onClose }: FacilityDetailSheetProps) {
  const { showToast } = useToast();
  const [detail, setDetail] = useState<NormalizedFacility | null>(facility);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doctorCount, setDoctorCount] = useState<number | null>(null);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  useEffect(() => {
    if (!visible || !facility) return;
    setActiveTab("overview");
    setDetail(facility);
    setError("");
    setDoctorCount(null);

    setLoading(true);
    setDoctorsLoading(true);

    Promise.allSettled([
      medicalFacilitiesApi.get(facility.facilityId),
      doctorManagementApi.list({ facilityId: facility.facilityId, pageNumber: 1, pageSize: 12, isActive: true }),
    ]).then(([facilityResult, doctorResult]) => {
      if (facilityResult.status === "fulfilled") {
        const merged = mergeFacilityDetail(facility, getObjectData(facilityResult.value));
        setDetail({ ...facility, ...merged } as NormalizedFacility);
      } else {
        setError((facilityResult.reason as Error)?.message || "Không tải được thông tin chi tiết cơ sở y tế.");
      }
      setLoading(false);

      if (doctorResult.status === "fulfilled") {
        setDoctorCount(getArrayData(doctorResult.value).length);
      }
      setDoctorsLoading(false);
    });
  }, [visible, facility]);

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
      <View style={styles.root}>
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
                {tab === "overview" ? "Tổng quan" : "Đánh giá"}
              </AppText>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === "overview" ? (
            <>
              <Badge tone="info">{current.facilityTypeLabel}</Badge>

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

              <View style={styles.doctorsTeaser}>
                <AppText variant="bodyStrong">Bác sĩ tại cơ sở</AppText>
                <AppText color={colors.muted}>
                  {doctorsLoading ? "Đang tải danh sách bác sĩ..." : doctorCount === null ? "Chưa có dữ liệu." : `${doctorCount} bác sĩ đang hoạt động.`}
                </AppText>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => showToast({ type: "info", message: "Danh sách bác sĩ chi tiết sẽ có ở bản cập nhật tiếp theo." })}
                >
                  Xem danh sách bác sĩ
                </Button>
              </View>

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
            <ReviewsSection facilityId={current.facilityId} />
          )}
        </ScrollView>
      </View>
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
    paddingTop: spacing.lg,
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
    borderBottomColor: colors.limeDark,
  },
  content: {
    padding: spacing.lg,
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
  doctorsTeaser: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.lg,
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
