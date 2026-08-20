import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { ClipboardList, LogOut, RefreshCw, ShieldCheck, Stethoscope } from "lucide-react-native";

import { ApiMessage, AppText, Badge, Button, Card, EmptyState, LoadingState, Screen, TextField } from "@/src/components/ui";
import { useLogout } from "@/src/hooks/useLogout";
import { doctorRecoveryService } from "@/src/services/doctorRecoveryService";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { DoctorClinicalContext, DoctorRecoveryRequest, RecoveryFeedbackAnalytics } from "@/src/types/doctorRecovery";
import { getDoctorRecoveryErrorMessage, getDoctorRequestActions, normalizeRecoveryStatus } from "@/src/utils/doctorRecovery";
import { DoctorPlanEditor } from "./DoctorPlanEditor";

type WorkspaceTab = "open" | "mine";

const diseaseLabels: Record<string, string> = {
  "0": "Hô hấp",
  "1": "Cơ xương khớp",
  "2": "Bệnh truyền nhiễm",
  respiratory: "Hô hấp",
  musculoskeletal: "Cơ xương khớp",
  infectiousdisease: "Bệnh truyền nhiễm",
};

const statusLabels: Record<string, string> = {
  "0": "Chờ bác sĩ",
  "1": "Đã nhận",
  "2": "Đang xem xét",
  "3": "Chờ bổ sung",
  "4": "Đã xuất bản",
  "5": "Đã từ chối",
  "6": "Đã hủy",
  "7": "Đã hết hạn",
  waitingfordoctor: "Chờ bác sĩ",
  assigned: "Đã nhận",
  inreview: "Đang xem xét",
  needmoreinformation: "Chờ bổ sung",
  published: "Đã xuất bản",
  rejected: "Đã từ chối",
  cancelled: "Đã hủy",
  expired: "Đã hết hạn",
};

function enumKey(value: string | number | null | undefined) {
  return normalizeRecoveryStatus(value);
}

function diseaseLabel(value: string | number) {
  return diseaseLabels[enumKey(value)] ?? "Chưa phân loại";
}

function statusLabel(value: string | number) {
  return statusLabels[enumKey(value)] ?? "Chưa cập nhật";
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa cập nhật" : date.toLocaleString("vi-VN");
}

export function DoctorRecoveryWorkspace() {
  const { logout, loggingOut } = useLogout();
  const [tab, setTab] = useState<WorkspaceTab>("open");
  const [items, setItems] = useState<DoctorRecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [selected, setSelected] = useState<DoctorRecoveryRequest | null>(null);
  const [context, setContext] = useState<DoctorClinicalContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [planRequest, setPlanRequest] = useState<DoctorRecoveryRequest | null>(null);
  const [analytics, setAnalytics] = useState<RecoveryFeedbackAnalytics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = tab === "open"
        ? await doctorRecoveryService.listOpen()
        : await doctorRecoveryService.listMine();
      setItems(Array.isArray(response.data?.items) ? response.data.items : []);
    } catch (requestError) {
      setItems([]);
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách yêu cầu.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    doctorRecoveryService.feedbackAnalytics()
      .then((response) => setAnalytics(response.data ?? null))
      .catch(() => setAnalytics(null));
  }, []);

  async function openRequest(request: DoctorRecoveryRequest) {
    setSelected(request);
    setContext(null);
    if (tab !== "mine") return;
    setContextLoading(true);
    try {
      const [detailResponse, contextResponse] = await Promise.all([
        doctorRecoveryService.get(request.id),
        doctorRecoveryService.getClinicalContext(request.id),
      ]);
      if (detailResponse.data) setSelected(detailResponse.data);
      setContext(contextResponse.data ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải hồ sơ lâm sàng.");
    } finally {
      setContextLoading(false);
    }
  }

  async function mutate(request: DoctorRecoveryRequest, action: "accept" | "review" | "release" | "reject", rejection?: { code: string; reason: string }) {
    setWorkingId(request.id);
    setError("");
    try {
      if (action === "accept") await doctorRecoveryService.accept(request.id);
      if (action === "review") await doctorRecoveryService.startReview(request.id);
      if (action === "release") await doctorRecoveryService.release(request.id);
      if (action === "reject" && rejection) await doctorRecoveryService.reject(request.id, rejection.code, rejection.reason);
      setSelected(null);
      setContext(null);
      await load();
    } catch (requestError) {
      setError(getDoctorRecoveryErrorMessage(requestError));
      if ((requestError as { status?: number })?.status === 409) await load();
    } finally {
      setWorkingId("");
    }
  }

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="eyebrow" color={colors.teal}>Không gian bác sĩ</AppText>
          <AppText variant="h1">Kế hoạch phục hồi</AppText>
          <AppText color={colors.muted}>Nhận và xem xét yêu cầu theo đúng phạm vi được backend phân quyền.</AppText>
        </View>
        <Button variant="secondary" size="sm" disabled={loggingOut} onPress={logout} leftIcon={<LogOut size={16} color={colors.ink} />}>
          Đăng xuất
        </Button>
      </View>

      <Card variant="soft" style={styles.safetyCard}>
        <ShieldCheck size={20} color={colors.teal} />
        <AppText variant="caption" color={colors.muted} style={styles.flexText}>
          Chỉ mở dữ liệu lâm sàng của yêu cầu bạn đã nhận. Không sao chép hoặc chia sẻ thông tin người bệnh ngoài mục đích lập kế hoạch.
        </AppText>
      </Card>

      {analytics ? (
        <Card style={styles.requestCard}>
          <View style={styles.cardTop}>
            <View><AppText variant="eyebrow" color={colors.teal}>Phản hồi kế hoạch</AppText><AppText variant="h3">{Number(analytics.averageRating ?? 0).toFixed(1)}/5</AppText></View>
            <Badge tone="info">{Number(analytics.totalFeedbacks ?? 0)} phản hồi</Badge>
          </View>
          <AppText color={colors.muted}>{Number(analytics.completedPlans ?? 0)} kế hoạch đã hoàn thành · Tỷ lệ phản hồi {Math.round(Number(analytics.feedbackRate ?? 0) * (Number(analytics.feedbackRate ?? 0) <= 1 ? 100 : 1))}%</AppText>
        </Card>
      ) : null}

      <View style={styles.tabs}>
        {(["open", "mine"] as const).map((value) => {
          const active = tab === value;
          return (
            <Pressable key={value} onPress={() => setTab(value)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.tab, active && styles.tabActive]}>
              <AppText variant="bodyStrong" color={active ? colors.white : colors.muted}>
                {value === "open" ? "Hàng đợi chung" : "Yêu cầu của tôi"}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.toolbar}>
        <AppText variant="h3">{tab === "open" ? "Yêu cầu đang chờ" : "Đang phụ trách"}</AppText>
        <Button variant="secondary" size="sm" disabled={loading} onPress={load} leftIcon={<RefreshCw size={16} color={colors.ink} />}>
          Tải lại
        </Button>
      </View>

      <ApiMessage type="error" message={error} />
      {loading ? <LoadingState title="Đang tải yêu cầu..." /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title={tab === "open" ? "Chưa có yêu cầu đang chờ" : "Bạn chưa nhận yêu cầu nào"} description="Danh sách sẽ cập nhật khi backend có dữ liệu phù hợp." />
      ) : null}
      {!loading ? (
        <View style={styles.list}>
          {items.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <View style={styles.cardTop}>
                <Badge tone="info">{diseaseLabel(request.diseaseGroup)}</Badge>
                <Badge tone={tab === "open" ? "warning" : "neutral"}>{statusLabel(request.status)}</Badge>
              </View>
              <View style={styles.cardMeta}>
                <ClipboardList size={18} color={colors.teal} />
                <AppText variant="caption" color={colors.muted}>Gửi lúc {formatDate(request.requestedAt)}</AppText>
              </View>
              {request.requestNote ? <AppText numberOfLines={3}>{request.requestNote}</AppText> : null}
              <Button variant="secondary" fullWidth onPress={() => openRequest(request)}>Xem chi tiết</Button>
              {tab === "open" ? (
                <Button fullWidth disabled={workingId === request.id} onPress={() => mutate(request, "accept")}>
                  {workingId === request.id ? "Đang nhận..." : "Nhận yêu cầu"}
                </Button>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      <RequestDetailModal
        request={selected}
        context={context}
        loading={contextLoading}
        working={Boolean(selected && workingId === selected.id)}
        openQueue={tab === "open"}
        onClose={() => { setSelected(null); setContext(null); }}
        onAccept={(request) => mutate(request, "accept")}
        onStartReview={(request) => mutate(request, "review")}
        onRelease={(request) => mutate(request, "release")}
        onReject={(request, rejection) => mutate(request, "reject", rejection)}
        onOpenPlan={setPlanRequest}
      />
      {planRequest ? (
        <DoctorPlanEditor
          requestId={planRequest.id}
          initialPlanId={planRequest.recoveryPlanId}
          onClose={() => setPlanRequest(null)}
          onChanged={() => void load()}
        />
      ) : null}
    </Screen>
  );
}

function RequestDetailModal({ request, context, loading, working, openQueue, onClose, onAccept, onStartReview, onRelease, onReject, onOpenPlan }: {
  request: DoctorRecoveryRequest | null;
  context: DoctorClinicalContext | null;
  loading: boolean;
  working: boolean;
  openQueue: boolean;
  onClose: () => void;
  onAccept: (request: DoctorRecoveryRequest) => void;
  onStartReview: (request: DoctorRecoveryRequest) => void;
  onRelease: (request: DoctorRecoveryRequest) => void;
  onReject: (request: DoctorRecoveryRequest, rejection: { code: string; reason: string }) => void;
  onOpenPlan: (request: DoctorRecoveryRequest) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [rejectionCode, setRejectionCode] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  if (!request) return null;
  const activeRequest = request;
  const status = enumKey(request.status);
  const actions = getDoctorRequestActions(status, Boolean(request.recoveryPlanId));
  const canStartReview = actions.includes("startReview");
  const canRelease = actions.includes("release");
  const canManagePlan = actions.includes("openPlan");

  function submitReject() {
    if (!rejectionCode.trim() || !rejectionReason.trim()) {
      Alert.alert("Thiếu lý do", "Nhập mã lý do và giải thích trước khi từ chối yêu cầu.");
      return;
    }
    onReject(activeRequest, { code: rejectionCode.trim(), reason: rejectionReason.trim() });
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen scroll contentContainerStyle={styles.modalContent}>
        <View style={styles.toolbar}>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow" color={colors.teal}>Chi tiết yêu cầu</AppText>
            <AppText variant="h2">{diseaseLabel(request.diseaseGroup)}</AppText>
          </View>
          <Button variant="secondary" size="sm" onPress={onClose}>Đóng</Button>
        </View>
        <Card style={styles.requestCard}>
          <Badge tone="neutral">{statusLabel(request.status)}</Badge>
          <AppText variant="caption" color={colors.muted}>Gửi lúc {formatDate(request.requestedAt)}</AppText>
          <AppText>{request.requestNote || "Người bệnh không nhập ghi chú bổ sung."}</AppText>
        </Card>

        {loading ? <LoadingState title="Đang tải hồ sơ lâm sàng được cấp quyền..." /> : null}
        {context ? <ClinicalContextView context={context} /> : null}

        {openQueue ? <Button disabled={working} onPress={() => onAccept(request)}>Nhận yêu cầu</Button> : null}
        {!openQueue && canStartReview ? <Button disabled={working} onPress={() => onStartReview(request)}>Bắt đầu xem xét</Button> : null}
        {!openQueue && canManagePlan ? <Button disabled={working} onPress={() => onOpenPlan(request)}>{request.recoveryPlanId ? "Mở kế hoạch phục hồi" : "Tạo kế hoạch phục hồi"}</Button> : null}
        {!openQueue && canRelease ? <Button variant="secondary" disabled={working} onPress={() => onRelease(request)}>Trả lại hàng đợi</Button> : null}
        {!openQueue && canRelease ? <Button variant="danger" disabled={working} onPress={() => setShowReject((value) => !value)}>Từ chối yêu cầu</Button> : null}
        {showReject ? (
          <Card style={styles.requestCard}>
            <AppText variant="bodyStrong">Lý do từ chối</AppText>
            <TextField label="Mã lý do" value={rejectionCode} onChangeText={setRejectionCode} maxLength={100} editable={!working} />
            <TextField label="Giải thích" value={rejectionReason} onChangeText={setRejectionReason} maxLength={2000} multiline editable={!working} />
            <Button variant="danger" disabled={working || !rejectionCode.trim() || !rejectionReason.trim()} onPress={submitReject}>Xác nhận từ chối</Button>
          </Card>
        ) : null}
      </Screen>
    </Modal>
  );
}

function ClinicalContextView({ context }: { context: DoctorClinicalContext }) {
  const profile = context.patientProfile;
  return (
    <View style={styles.list}>
      <View style={styles.sectionTitle}><Stethoscope size={19} color={colors.teal} /><AppText variant="h3">Bối cảnh lâm sàng</AppText></View>
      <Card style={styles.requestCard}>
        <AppText variant="bodyStrong">Chỉ số cơ bản</AppText>
        <AppText color={colors.muted}>Chiều cao: {profile?.height ?? "—"} cm · Cân nặng: {profile?.weight ?? "—"} kg · BMI: {profile?.bmi ?? "—"}</AppText>
        <AppText color={colors.muted}>Dị ứng: {profile?.allergyNote || "Chưa ghi nhận"}</AppText>
      </Card>
      <Card style={styles.requestCard}>
        <AppText variant="bodyStrong">Bệnh mạn tính</AppText>
        {(context.chronicDiseases ?? []).length ? context.chronicDiseases?.map((item, index) => <AppText key={`${item.diseaseName}-${index}`} color={colors.muted}>• {item.diseaseName}{item.note ? ` — ${item.note}` : ""}</AppText>) : <AppText color={colors.muted}>Chưa ghi nhận</AppText>}
      </Card>
      <Card style={styles.requestCard}>
        <AppText variant="bodyStrong">Thuốc đang dùng</AppText>
        {(context.userMedications ?? []).length ? context.userMedications?.map((item) => <AppText key={item.userMedicationId} color={colors.muted}>• {item.medicineName}{item.dosageInstruction ? ` — ${item.dosageInstruction}` : ""}</AppText>) : <AppText color={colors.muted}>Chưa ghi nhận</AppText>}
      </Card>
      <Card style={styles.requestCard}>
        <AppText variant="bodyStrong">Kết quả xét nghiệm chính</AppText>
        {(context.primaryLabTest?.results ?? []).length ? context.primaryLabTest?.results?.map((item) => <AppText key={item.indicatorId} color={colors.muted}>• {item.symbol}: {item.userValue ?? "—"} {item.unit ?? ""} {item.status ? `(${item.status})` : ""}</AppText>) : <AppText color={colors.muted}>Chưa có dữ liệu</AppText>}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.lg, paddingBottom: spacing["4xl"] },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  safetyCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  flexText: { flex: 1 },
  tabs: { flexDirection: "row", borderRadius: radius.md, backgroundColor: colors.paperSoft, padding: spacing.xs },
  tab: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.teal },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  list: { gap: spacing.md },
  requestCard: { gap: spacing.md },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  modalContent: { gap: spacing.lg, paddingBottom: spacing["4xl"] },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
