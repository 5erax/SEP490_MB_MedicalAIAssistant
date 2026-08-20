// Ported from Web's RecoveryPlanPage.jsx — redesigned as a single scrolling
// native screen (quota card, CTA, requests list, plans list) instead of
// Web's desktop split-panel layout, with detail/create each in their own
// full-screen sheet. Realtime SignalR sync is intentionally not ported —
// pull-to-refresh + a manual reload cover the same need without adding a
// native SignalR dependency; see docs/mobile-progress.md.
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";

import { AppText, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
import { useRecoveryPlan, useToast } from "@/src/hooks";
import { RecoveryPlan, RecoveryPlanRequest } from "@/src/types/recoveryPlan";
import { CreateRequestSheet } from "./CreateRequestSheet";
import { PlanCard } from "./PlanCard";
import { PlanDetailSheet } from "./PlanDetailSheet";
import { QuotaCard } from "./QuotaCard";
import { RequestCard } from "./RequestCard";
import { RequestDetailSheet } from "./RequestDetailSheet";

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
        <ChevronLeft size={16} color={colors.ink} />
      </Pressable>
      <AppText variant="caption" color={colors.subtle}>
        Trang {page}/{totalPages}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trang sau"
        disabled={page >= totalPages}
        onPress={() => onChange(Math.min(totalPages, page + 1))}
        style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
      >
        <ChevronRight size={16} color={colors.ink} />
      </Pressable>
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
    !recovery.quota ||
    Number(recovery.quota.remainingCount) <= 0;

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

  async function handleCancelPlan(planId: string, reason: string) {
    const result = await recovery.cancelPlan(planId, reason);
    showToast({ type: result.status === "success" ? "success" : "error", message: result.status === "success" ? "Đã hủy kế hoạch phục hồi." : result.message });
    return result.status;
  }

  async function handlePlanFeedback(planId: string, rating: number, note: string) {
    const result = await recovery.submitPlanFeedback(planId, rating, note);
    showToast({ type: result.status === "success" ? "success" : "error", message: result.status === "success" ? "Cảm ơn bạn đã gửi đánh giá." : result.message });
    return result.status;
  }

  async function handleRefresh() {
    setRefreshing(true);
    recovery.reloadAll();
    setRefreshing(false);
  }

  return (
    <Screen padded={false} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <AppText variant="eyebrow" color={colors.teal}>
            Theo dõi sau khám
          </AppText>
          <AppText variant="h1">Kế hoạch phục hồi</AppText>
          <AppText color={colors.muted}>Gửi yêu cầu để bác sĩ lên kế hoạch phục hồi cá nhân dựa trên tình trạng của bạn.</AppText>
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
          <Plus size={18} color={colors.white} />
          <AppText variant="bodyStrong" color={colors.white}>
            Yêu cầu kế hoạch mới
          </AppText>
        </Pressable>

        <View style={styles.section}>
          <AppText variant="h3">Yêu cầu của bạn</AppText>
          {recovery.requestsState === "loading" && recovery.requests.length === 0 ? (
            <SkeletonGroup lines={3} />
          ) : recovery.requestsState === "error" ? (
            <EmptyState title="Không tải được danh sách yêu cầu" description={recovery.requestsError} />
          ) : recovery.requests.length === 0 ? (
            <EmptyState title="Chưa có yêu cầu nào" description="Gửi yêu cầu đầu tiên để bắt đầu theo dõi kế hoạch phục hồi." />
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
          <AppText variant="h3">Kế hoạch đã nhận</AppText>
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

        <AppText variant="caption" color={colors.subtle}>
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
        updating={recovery.updatingPlan}
        onClose={() => {
          setPlanDetailVisible(false);
          recovery.clearSelectedPlan();
        }}
        onStart={handleStartPlan}
        onCancel={handleCancelPlan}
        onFeedback={handlePlanFeedback}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  header: {
    gap: spacing.sm,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.teal,
    paddingVertical: spacing.md,
    ...shadows.soft,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  pageButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
});
