import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight, ClipboardList, HeartPulse, Plus, Route, Sparkles } from "lucide-react-native";

import { AppText, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useRecoveryPlan, useToast } from "@/src/hooks";
import { RecoveryPlan, RecoveryPlanRequest } from "@/src/types/recoveryPlan";
import { CreateRequestSheet } from "./CreateRequestSheet";
import { PlanCard } from "./PlanCard";
import { PlanDetailSheet } from "./PlanDetailSheet";
import { QuotaCard } from "./QuotaCard";
import { RequestCard } from "./RequestCard";
import { RequestDetailSheet } from "./RequestDetailSheet";

const palette = {
  bg: colors.bg,
  surface: colors.paper,
  ink: colors.ink,
  muted: colors.muted,
  faint: colors.subtle,
  line: colors.line,
  primary: colors.teal,
  primaryDark: colors.limeDark,
  mint: colors.mint,
  white: colors.white,
  heroBg: colors.limeDark,
  heroOverlay: "rgba(255,255,255,0.16)",
  success: "#15803d",
  successBg: "#dcfce7",
  warning: colors.warning,
  warningBg: colors.warningBg,
};

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <View style={styles.pagination}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trang trước"
        disabled={page <= 1}
        onPress={() => onChange(Math.max(1, page - 1))}
        style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
      >
        <ChevronLeft size={16} color={palette.ink} />
      </Pressable>
      <AppText variant="caption" color={palette.muted}>
        Trang {page}/{totalPages}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trang sau"
        disabled={page >= totalPages}
        onPress={() => onChange(Math.min(totalPages, page + 1))}
        style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
      >
        <ChevronRight size={16} color={palette.ink} />
      </Pressable>
    </View>
  );
}

function SnapshotTile({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONE_STYLES;
  icon: typeof ClipboardList;
}) {
  const toneStyle = TONE_STYLES[tone];
  return (
    <View style={styles.snapshotTile}>
      <View style={[styles.snapshotChip, toneStyle.chip]}>
        <Icon size={16} color={toneStyle.icon} />
      </View>
      <AppText variant="h3" color={palette.ink}>
        {value}
      </AppText>
      <AppText variant="caption" color={palette.muted} style={styles.snapshotLabel}>
        {label}
      </AppText>
    </View>
  );
}

export function RecoveryPlanScreen() {
  const { showToast } = useToast();
  const recovery = useRecoveryPlan();
  const [createVisible, setCreateVisible] = useState(false);
  const [requestDetailVisible, setRequestDetailVisible] = useState(false);
  const [planDetailVisible, setPlanDetailVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const requestCreationDisabled =
    recovery.quotaState === "loading" ||
    recovery.quotaState === "error" ||
    recovery.requestsState === "loading" ||
    recovery.plansState === "loading" ||
    !recovery.quota ||
    Number(recovery.quota.remainingCount) <= 0;
  const activePlans = recovery.plans.filter((plan) => plan.status === "active" || plan.status === "readyToStart").length;
  const waitingRequests = recovery.requests.filter((request) =>
    ["waitingForDoctor", "assigned", "inReview", "needMoreInformation"].includes(request.status),
  ).length;
  const latestPlan = recovery.plans[0];
  const createBlocker =
    waitingRequests > 0
      ? {
          title: "Bạn đã có yêu cầu đang xử lý",
          description: "Bác sĩ đang tiếp nhận thông tin hiện tại. Hãy theo dõi yêu cầu này trước khi tạo yêu cầu phục hồi mới.",
          primaryLabel: "Xem yêu cầu hiện tại",
          stats: [
            { label: "Yêu cầu đang xử lý", value: waitingRequests },
            { label: "Kế hoạch đang mở", value: activePlans },
          ],
        }
      : activePlans > 0
        ? {
            title: "Bạn đang có kế hoạch phục hồi",
            description: "Mỗi lần chỉ theo dõi một kế hoạch để bác sĩ và hệ thống không bị trùng lộ trình chăm sóc.",
            primaryLabel: "Xem kế hoạch hiện tại",
            stats: [
              { label: "Kế hoạch đang mở", value: activePlans },
              { label: "Yêu cầu đang xử lý", value: waitingRequests },
            ],
          }
        : null;

  async function handleCreateSubmit() {
    const result = await recovery.submitCreateRequest();
    if (result === "success") {
      setCreateVisible(false);
      showToast({ type: "success", message: "Đã gửi yêu cầu kế hoạch phục hồi." });
    }
  }

  function openRequest(request: RecoveryPlanRequest) {
    recovery.selectRequest(request);
    setRequestDetailVisible(true);
  }

  function openPlan(plan: RecoveryPlan) {
    recovery.selectPlan(plan);
    setPlanDetailVisible(true);
  }

  async function handleCancel(requestId: string) {
    const result = await recovery.cancelRequest(requestId);
    if (result === "success") {
      showToast({ type: "success", message: "Đã hủy yêu cầu." });
      setRequestDetailVisible(false);
      recovery.clearSelectedRequest();
    } else {
      showToast({ type: "error", message: result.message });
    }
  }

  async function handleProvideInformation(requestId: string, text: string) {
    const result = await recovery.submitMoreInformation(requestId, text);
    if (result.status === "success") {
      showToast({ type: "success", message: "Đã gửi thông tin bổ sung." });
    } else {
      showToast({ type: "error", message: result.message ?? "Không thể gửi thông tin bổ sung." });
    }
  }

  async function handleStartPlan(planId: string) {
    const result = await recovery.startPlan(planId);
    if (result === "success") {
      showToast({ type: "success", message: "Đã bắt đầu kế hoạch phục hồi." });
    } else {
      showToast({ type: "error", message: result.message });
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    recovery.reloadAll();
    setRefreshing(false);
  }

  return (
    <Screen padded={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <HeartPulse size={24} color={palette.white} />
            </View>
            <View style={styles.heroPill}>
              <Sparkles size={13} color={palette.white} />
              <AppText variant="caption" color={palette.white}>
                Theo dõi sau khám
              </AppText>
            </View>
          </View>
          <AppText variant="h1" color={palette.white} style={styles.heroTitle}>
            Kế hoạch phục hồi
          </AppText>
          <AppText color="rgba(255,255,255,0.86)" style={styles.heroCopy}>
            Gửi tình trạng của bạn, theo dõi bác sĩ xử lý, rồi bắt đầu kế hoạch ăn uống - nghỉ ngơi phù hợp.
          </AppText>
          <View style={styles.snapshotRow}>
            <SnapshotTile label="Yêu cầu đang xử lý" value={waitingRequests} tone="warning" icon={ClipboardList} />
            <SnapshotTile label="Kế hoạch sẵn sàng" value={activePlans} tone="success" icon={Route} />
            <SnapshotTile label="Tổng kế hoạch" value={recovery.plans.length} tone="info" icon={HeartPulse} />
          </View>
          {latestPlan ? (
            <View style={styles.latestStrip}>
              <Route size={16} color={palette.white} />
              <AppText variant="caption" color={palette.white} style={styles.latestText} numberOfLines={1}>
                Gần nhất: {latestPlan.planName}
              </AppText>
            </View>
          ) : null}
        </View>

        <QuotaCard
          state={recovery.quotaState}
          quota={recovery.quota}
          message={recovery.quotaMessage}
          needsSubscription={recovery.quotaNeedsSubscription}
          onRetry={recovery.reloadQuota}
        />

        <Pressable
          accessibilityRole="button"
          disabled={requestCreationDisabled}
          onPress={() => setCreateVisible(true)}
          style={[styles.createButton, requestCreationDisabled && styles.createButtonDisabled]}
        >
          <Plus size={18} color={palette.white} />
          <AppText variant="bodyStrong" color={palette.white}>
            Yêu cầu kế hoạch mới
          </AppText>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ClipboardList size={20} color={palette.primaryDark} />
            <View style={styles.sectionTitleWrap}>
              <AppText variant="h3" color={palette.ink}>
                Yêu cầu của bạn
              </AppText>
              <AppText variant="caption" color={palette.faint}>
                Theo dõi tiến độ bác sĩ tiếp nhận
              </AppText>
            </View>
          </View>
          {recovery.requestsState === "loading" && recovery.requests.length === 0 ? (
            <SkeletonGroup lines={3} />
          ) : recovery.requestsState === "error" ? (
            <EmptyState title="Không tải được danh sách yêu cầu" description={recovery.requestsError} />
          ) : recovery.requests.length === 0 ? (
            <EmptyState title="Chưa có yêu cầu nào" description="Gửi yêu cầu đầu tiên để bác sĩ lập kế hoạch phục hồi cho bạn." />
          ) : (
            <View style={styles.list}>
              {recovery.requests.map((request) => (
                <RequestCard key={request.id} request={request} onPress={() => openRequest(request)} />
              ))}
            </View>
          )}
          <Pagination page={recovery.requestsPage} totalPages={recovery.requestsInfo.totalPages} onChange={recovery.setRequestsPage} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Route size={20} color={palette.primaryDark} />
            <View style={styles.sectionTitleWrap}>
              <AppText variant="h3" color={palette.ink}>
                Kế hoạch đã nhận
              </AppText>
              <AppText variant="caption" color={palette.faint}>
                Xem lộ trình phục hồi và bắt đầu khi sẵn sàng
              </AppText>
            </View>
          </View>
          {recovery.plansState === "loading" && recovery.plans.length === 0 ? (
            <SkeletonGroup lines={3} />
          ) : recovery.plansState === "error" ? (
            <EmptyState title="Không tải được danh sách kế hoạch" description={recovery.plansError} />
          ) : recovery.plans.length === 0 ? (
            <EmptyState title="Chưa có kế hoạch nào" description="Khi yêu cầu được hoàn tất, kế hoạch sẽ xuất hiện tại đây để bạn xem và bắt đầu." />
          ) : (
            <View style={styles.list}>
              {recovery.plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onPress={() => openPlan(plan)} />
              ))}
            </View>
          )}
          <Pagination page={recovery.plansPage} totalPages={recovery.plansInfo.totalPages} onChange={recovery.setPlansPage} />
        </View>

        <AppText variant="caption" color={palette.faint} style={styles.disclaimer}>
          Thông tin hỗ trợ, không thay thế chăm sóc y tế. Trong tình huống khẩn cấp, hãy tìm trợ giúp y tế ngay.
        </AppText>
      </ScrollView>

      <CreateRequestSheet
        visible={createVisible}
        form={recovery.createForm}
        errors={recovery.createErrors}
        submitting={recovery.creating}
        submitError={recovery.createError}
        needsSubscription={recovery.createNeedsSubscription}
        profileReadinessIssues={recovery.profileReadinessIssues}
        labSessions={recovery.labSessions}
        labSessionsState={recovery.labSessionsState}
        labSessionsError={recovery.labSessionsError}
        prescriptionFile={recovery.prescriptionFile}
        prescriptionUploading={recovery.prescriptionUploading}
        prescriptionUploadError={recovery.prescriptionUploadError}
        blocker={createBlocker}
        onPickPrescription={recovery.setPrescriptionFile}
        onRemovePrescription={recovery.clearPrescription}
        onClose={() => {
          setCreateVisible(false);
          recovery.resetCreateForm();
        }}
        onChange={recovery.updateCreateField}
        onSubmit={handleCreateSubmit}
      />

      <RequestDetailSheet
        visible={requestDetailVisible}
        request={recovery.selectedRequest}
        state={recovery.requestDetailState}
        cancelling={Boolean(recovery.cancellingId)}
        providingInfo={recovery.providingInfo}
        onClose={() => {
          setRequestDetailVisible(false);
          recovery.clearSelectedRequest();
        }}
        onCancel={handleCancel}
        onProvideInformation={handleProvideInformation}
      />

      <PlanDetailSheet
        visible={planDetailVisible}
        plan={recovery.selectedPlan}
        state={recovery.planDetailState}
        starting={Boolean(recovery.startingId)}
        onClose={() => {
          setPlanDetailVisible(false);
          recovery.clearSelectedPlan();
        }}
        onStart={handleStartPlan}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  hero: {
    gap: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: palette.heroBg,
    padding: spacing.xl,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 4,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: palette.heroOverlay,
  },
  heroPill: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: palette.heroOverlay,
    paddingHorizontal: spacing.md,
  },
  heroTitle: {
    maxWidth: 300,
  },
  heroCopy: {
    maxWidth: 330,
  },
  snapshotRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  snapshotTile: {
    flex: 1,
    minHeight: 96,
    justifyContent: "space-between",
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    padding: spacing.md,
  },
  snapshotChip: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  chipWarning: {
    backgroundColor: palette.warningBg,
  },
  chipSuccess: {
    backgroundColor: palette.successBg,
  },
  chipInfo: {
    backgroundColor: palette.mint,
  },
  snapshotLabel: {
    minHeight: 34,
  },
  latestStrip: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.heroOverlay,
    paddingHorizontal: spacing.md,
  },
  latestText: {
    flex: 1,
  },
  createButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 3,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  list: {
    gap: spacing.sm,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  pageButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  disclaimer: {
    paddingHorizontal: spacing.xs,
  },
});

const TONE_STYLES = {
  warning: { chip: styles.chipWarning, icon: palette.warning },
  success: { chip: styles.chipSuccess, icon: palette.success },
  info: { chip: styles.chipInfo, icon: palette.primaryDark },
} as const;
