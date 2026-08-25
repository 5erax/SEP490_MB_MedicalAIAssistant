import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, HeartPulse, Plus, Route, Sparkles } from "lucide-react-native";

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

const IN_PROGRESS_REQUEST_STATUSES = new Set<RecoveryPlanRequest["status"]>(["waitingForDoctor", "assigned", "inReview", "needMoreInformation"]);
const CURRENT_PLAN_STATUSES = new Set<RecoveryPlan["status"]>(["active", "readyToStart"]);
const PHASE_COLORS = ["#0f8b8d", "#2e7d32", "#7c3aed", "#d97706", "#be123c"];

function sameDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function diffCalendarDays(start: Date, current: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const currentUtc = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  return Math.floor((currentUtc - startUtc) / 86400000) + 1;
}

function buildMonthDays(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function getPhaseIndexForDay(plan: RecoveryPlan, dayNumber: number) {
  const index = (plan.phases ?? []).findIndex((phase) => {
    const start = phase.startDay ?? 1;
    const end = phase.endDay ?? start;
    return dayNumber >= start && dayNumber <= end;
  });
  return index >= 0 ? index : 0;
}

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

function CollapsibleSectionHeader({
  title,
  subtitle,
  count,
  expanded,
  icon: Icon,
  onToggle,
}: {
  title: string;
  subtitle: string;
  count: number;
  expanded: boolean;
  icon: typeof ClipboardList;
  onToggle: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.dropdownHeader, pressed && styles.dropdownHeaderPressed]}>
      <View style={styles.dropdownIcon}>
        <Icon size={19} color={palette.primaryDark} />
      </View>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.dropdownTitleRow}>
          <AppText variant="h3" color={palette.ink} style={styles.dropdownTitle} numberOfLines={1}>
            {title}
          </AppText>
          <View style={styles.countPill}>
            <AppText variant="caption" color={palette.primaryDark}>
              {count}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color={palette.faint} numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <View style={styles.dropdownChevron}>{expanded ? <ChevronUp size={18} color={palette.primaryDark} /> : <ChevronDown size={18} color={palette.primaryDark} />}</View>
    </Pressable>
  );
}

function RecoveryTimelineCard({
  plan,
  expanded,
  onToggle,
  onOpenPlan,
}: {
  plan: RecoveryPlan | null;
  expanded: boolean;
  onToggle: () => void;
  onOpenPlan: (plan: RecoveryPlan) => void;
}) {
  if (!plan) return null;

  const duration = Math.max(1, Number(plan.durationDays || 1));
  const hasCalendar = Boolean(plan.startDate);
  const startDate = hasCalendar ? new Date(plan.startDate as string) : null;
  const monthDays = startDate ? buildMonthDays(startDate) : [];
  const monthLabel = startDate ? new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(startDate) : "";
  const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <View style={styles.timelineCard}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.timelineHeader, pressed && styles.dropdownHeaderPressed]}>
        <View style={styles.timelineIcon}>
          <Route size={19} color={palette.white} />
        </View>
        <View style={styles.timelineTitleWrap}>
          <AppText variant="h3" color={palette.ink} numberOfLines={1}>
            Lộ trình hồi phục
          </AppText>
        </View>
        <View style={styles.timelineOpenButton}>{expanded ? <ChevronUp size={18} color={palette.primaryDark} /> : <ChevronDown size={18} color={palette.primaryDark} />}</View>
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.timelineSummary}>
            <AppText variant="caption" color={palette.primaryDark}>
              Lộ trình
            </AppText>
            <AppText variant="h3" color={palette.ink} numberOfLines={2}>
              {plan.planName}
            </AppText>
            <AppText variant="caption" color={palette.muted}>
              {hasCalendar ? "Kế hoạch ở ngày nào thì ô ngày đó được tô màu." : "Bắt đầu kế hoạch để mở lịch theo từng ngày."}
            </AppText>
          </View>

          {hasCalendar && startDate ? (
            <View style={styles.calendarPanel}>
              <View style={styles.calendarBar}>
                <CalendarDays size={17} color={palette.white} />
                <AppText variant="bodyStrong" color={palette.white} style={styles.calendarMonth}>
                  {monthLabel}
                </AppText>
              </View>
              <View style={styles.weekdayRow}>
                {weekdays.map((weekday) => (
                  <AppText key={weekday} variant="caption" color={palette.muted} style={styles.weekdayCell}>
                    {weekday}
                  </AppText>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {monthDays.map((date) => {
                  const dayNumber = diffCalendarDays(startDate, date);
                  const inPlan = dayNumber >= 1 && dayNumber <= duration;
                  const phaseIndex = inPlan ? getPhaseIndexForDay(plan, dayNumber) : -1;
                  const color = inPlan ? PHASE_COLORS[phaseIndex % PHASE_COLORS.length] : "transparent";
                  const inMonth = date.getMonth() === startDate.getMonth();
                  const today = sameDate(date, new Date());

                  return (
                    <Pressable
                      key={date.toISOString()}
                      accessibilityRole="button"
                      onPress={() => onOpenPlan(plan)}
                      style={[
                        styles.calendarDay,
                        inPlan && styles.calendarPlanDay,
                        inPlan && { backgroundColor: color, borderColor: color },
                        today && styles.calendarToday,
                      ]}
                    >
                      <AppText variant="caption" color={inPlan ? palette.white : inMonth ? palette.ink : palette.faint}>
                        {date.getDate()}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => onOpenPlan(plan)} style={styles.timelineStartHint}>
              <CalendarDays size={18} color={palette.primaryDark} />
              <AppText variant="bodyStrong" color={palette.primaryDark}>
                Xem chi tiết để bắt đầu kế hoạch
              </AppText>
            </Pressable>
          )}

          {(plan.phases ?? []).length > 0 ? (
            <View style={styles.timelineLegend}>
              {(plan.phases ?? []).map((phase, index) => (
                <View key={phase.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: PHASE_COLORS[index % PHASE_COLORS.length] }]} />
                  <AppText variant="caption" color={palette.muted} numberOfLines={1} style={styles.legendText}>
                    Ngày {phase.startDay ?? 1}-{phase.endDay ?? phase.startDay ?? 1}: {phase.phaseName}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
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
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const [plansExpanded, setPlansExpanded] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  const requestCreationDisabled =
    recovery.quotaState === "loading" ||
    recovery.quotaState === "error" ||
    recovery.requestsState === "loading" ||
    recovery.plansState === "loading" ||
    !recovery.quota ||
    Number(recovery.quota.remainingCount) <= 0;
  const activePlans = recovery.plans.filter((plan) => CURRENT_PLAN_STATUSES.has(plan.status)).length;
  const waitingRequests = recovery.requests.filter((request) => IN_PROGRESS_REQUEST_STATUSES.has(request.status)).length;
  const latestPlan = recovery.plans[0];
  const primaryRequest = recovery.requests.find((request) => IN_PROGRESS_REQUEST_STATUSES.has(request.status)) ?? null;
  const primaryPlan = recovery.plans.find((plan) => CURRENT_PLAN_STATUSES.has(plan.status)) ?? null;
  const archivedRequests = primaryRequest ? recovery.requests.filter((request) => request.id !== primaryRequest.id) : recovery.requests;
  const archivedPlans = primaryPlan ? recovery.plans.filter((plan) => plan.id !== primaryPlan.id) : recovery.plans;
  const requestsCount = Math.max(0, (recovery.requestsInfo.totalCount || recovery.requests.length) - (primaryRequest ? 1 : 0));
  const plansCount = Math.max(0, (recovery.plansInfo.totalCount || recovery.plans.length) - (primaryPlan ? 1 : 0));
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

  function handleCancelPlan(planId: string) {
    Alert.alert("Hủy kế hoạch phục hồi?", "Kế hoạch hiện tại sẽ ngừng theo dõi sau khi hủy.", [
      { text: "Đóng", style: "cancel" },
      {
        text: "Hủy kế hoạch",
        style: "destructive",
        onPress: async () => {
          const result = await recovery.cancelPlan(planId);
          if (result === "success") {
            showToast({ type: "success", message: "Đã hủy kế hoạch phục hồi." });
          } else {
            showToast({ type: "error", message: result.message });
          }
        },
      },
    ]);
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
          {primaryRequest ? (
            <View style={styles.pinnedBlock}>
              <View style={styles.pinnedHeader}>
                <Sparkles size={14} color={palette.white} />
                <AppText variant="caption" color={palette.white}>
                  Yêu cầu đang xử lý
                </AppText>
              </View>
              <RequestCard request={primaryRequest} highlighted onPress={() => openRequest(primaryRequest)} />
            </View>
          ) : null}
          <CollapsibleSectionHeader
            title="Yêu cầu của bạn"
            subtitle={requestsExpanded ? "Đang hiển thị các yêu cầu cũ" : primaryRequest ? "Chạm để xem các yêu cầu cũ" : "Chạm để xem tiến độ bác sĩ tiếp nhận"}
            count={requestsCount}
            expanded={requestsExpanded}
            icon={ClipboardList}
            onToggle={() => setRequestsExpanded((current) => !current)}
          />
          {requestsExpanded ? (
            <>
              {recovery.requestsState === "loading" && recovery.requests.length === 0 ? (
                <SkeletonGroup lines={3} />
              ) : recovery.requestsState === "error" ? (
                <EmptyState title="Không tải được danh sách yêu cầu" description={recovery.requestsError} />
              ) : archivedRequests.length === 0 ? (
                <EmptyState
                  title={primaryRequest ? "Chưa có yêu cầu cũ" : "Chưa có yêu cầu nào"}
                  description={primaryRequest ? "Yêu cầu đang xử lý đã được ghim phía trên." : "Gửi yêu cầu đầu tiên để bác sĩ lập kế hoạch phục hồi cho bạn."}
                />
              ) : (
                <View style={styles.list}>
                  {archivedRequests.map((request) => (
                    <RequestCard key={request.id} request={request} onPress={() => openRequest(request)} />
                  ))}
                </View>
              )}
              <Pagination page={recovery.requestsPage} totalPages={recovery.requestsInfo.totalPages} onChange={recovery.setRequestsPage} />
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          {primaryPlan ? (
            <View style={styles.pinnedBlock}>
              <View style={styles.pinnedHeader}>
                <Sparkles size={14} color={palette.white} />
                <AppText variant="caption" color={palette.white}>
                  Kế hoạch đang thực hiện
                </AppText>
              </View>
              <PlanCard plan={primaryPlan} highlighted onPress={() => openPlan(primaryPlan)} />
            </View>
          ) : null}
          <CollapsibleSectionHeader
            title="Kế hoạch đã nhận"
            subtitle={plansExpanded ? "Đang hiển thị kế hoạch cũ" : primaryPlan ? "Chạm để xem các kế hoạch cũ" : "Chạm để xem lộ trình phục hồi"}
            count={plansCount}
            expanded={plansExpanded}
            icon={Route}
            onToggle={() => setPlansExpanded((current) => !current)}
          />
          {plansExpanded ? (
            <>
              {recovery.plansState === "loading" && recovery.plans.length === 0 ? (
                <SkeletonGroup lines={3} />
              ) : recovery.plansState === "error" ? (
                <EmptyState title="Không tải được danh sách kế hoạch" description={recovery.plansError} />
              ) : archivedPlans.length === 0 ? (
                <EmptyState
                  title={primaryPlan ? "Chưa có kế hoạch cũ" : "Chưa có kế hoạch nào"}
                  description={primaryPlan ? "Kế hoạch đang thực hiện đã được ghim phía trên." : "Khi yêu cầu được hoàn tất, kế hoạch sẽ xuất hiện tại đây để bạn xem và bắt đầu."}
                />
              ) : (
                <View style={styles.list}>
                  {archivedPlans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} onPress={() => openPlan(plan)} />
                  ))}
                </View>
              )}
              <Pagination page={recovery.plansPage} totalPages={recovery.plansInfo.totalPages} onChange={recovery.setPlansPage} />
            </>
          ) : null}
        </View>

        <RecoveryTimelineCard plan={primaryPlan} expanded={timelineExpanded} onToggle={() => setTimelineExpanded((current) => !current)} onOpenPlan={openPlan} />

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
        cancelling={Boolean(recovery.cancellingPlanId)}
        onClose={() => {
          setPlanDetailVisible(false);
          recovery.clearSelectedPlan();
        }}
        onStart={handleStartPlan}
        onCancel={handleCancelPlan}
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
    gap: spacing.sm,
  },
  pinnedBlock: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
    borderRadius: radius.xl,
    backgroundColor: "rgba(232,246,244,0.48)",
    padding: spacing.sm,
  },
  pinnedHeader: {
    alignSelf: "flex-start",
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.md,
  },
  dropdownHeader: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.88)",
    padding: spacing.md,
  },
  dropdownHeaderPressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  dropdownIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: palette.mint,
  },
  sectionTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dropdownTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dropdownTitle: {
    flexShrink: 1,
  },
  countPill: {
    minWidth: 28,
    minHeight: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.sm,
  },
  dropdownChevron: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  timelineCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: "rgba(8,127,140,0.28)",
    borderTopColor: palette.primary,
    borderRadius: radius.xl,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  timelineIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: palette.primary,
  },
  timelineTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  timelineOpenButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: palette.mint,
  },
  timelineSummary: {
    gap: spacing.xs,
  },
  calendarPanel: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.24)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(232,246,244,0.58)",
  },
  calendarBar: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.md,
  },
  calendarMonth: {
    textTransform: "capitalize",
  },
  weekdayRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  calendarDay: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  calendarPlanDay: {
    borderRadius: radius.sm,
  },
  calendarToday: {
    borderColor: palette.primaryDark,
    borderWidth: 1.5,
  },
  timelineStartHint: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.22)",
    borderRadius: radius.md,
    backgroundColor: palette.mint,
    paddingHorizontal: spacing.md,
  },
  timelineLegend: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: spacing.md,
  },
  legendItem: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  legendText: {
    flex: 1,
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
