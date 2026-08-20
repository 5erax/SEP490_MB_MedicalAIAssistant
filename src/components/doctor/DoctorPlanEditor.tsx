import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, View } from "react-native";
import { ChevronRight, Plus, Send, Trash2 } from "lucide-react-native";

import { ApiMessage, AppText, Badge, Button, Card, EmptyState, LoadingState, Screen, TextField } from "@/src/components/ui";
import { doctorRecoveryService } from "@/src/services/doctorRecoveryService";
import { colors, spacing } from "@/src/theme/tokens";
import {
  RecoveryPlan,
  RecoveryPlanDraftPayload,
  RecoveryPlanFood,
  RecoveryPlanFoodPayload,
  RecoveryPlanNutrient,
  RecoveryPlanNutrientPayload,
  RecoveryPlanPhase,
  RecoveryPlanPhasePayload,
} from "@/src/types/doctorRecovery";

type EditorProps = {
  requestId: string;
  initialPlanId?: string | null;
  onClose: () => void;
  onChanged: () => void;
};

type PlanForm = { planName: string; summary: string; durationDays: string; recheckInstruction: string };
type PhaseForm = { phaseName: string; startDay: string; endDay: string; sleepAndRestHoursPerDay: string; instruction: string; sortOrder: string };
type NutrientForm = { nutrientName: string; amountPerDay: string; unit: string; instruction: string; sortOrder: string };
type FoodForm = { foodName: string; suggestedServing: string; note: string; sortOrder: string };

const emptyPlan: PlanForm = { planName: "", summary: "", durationDays: "", recheckInstruction: "" };
const emptyPhase: PhaseForm = { phaseName: "", startDay: "", endDay: "", sleepAndRestHoursPerDay: "", instruction: "", sortOrder: "0" };
const emptyNutrient: NutrientForm = { nutrientName: "", amountPerDay: "", unit: "", instruction: "", sortOrder: "0" };
const emptyFood: FoodForm = { foodName: "", suggestedServing: "", note: "", sortOrder: "0" };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function statusKey(value: string | number) {
  return String(value).toLowerCase();
}

function planToForm(plan: RecoveryPlan): PlanForm {
  return {
    planName: plan.planName ?? "",
    summary: plan.summary ?? "",
    durationDays: String(plan.durationDays ?? ""),
    recheckInstruction: plan.recheckInstruction ?? "",
  };
}

function validatePositive(value: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function toPlanPayload(form: PlanForm): RecoveryPlanDraftPayload | null {
  const durationDays = validatePositive(form.durationDays);
  if (!form.planName.trim() || durationDays === null) return null;
  return { planName: form.planName.trim(), summary: form.summary.trim() || null, durationDays, recheckInstruction: form.recheckInstruction.trim() || null };
}

export function DoctorPlanEditor({ requestId, initialPlanId, onClose, onChanged }: EditorProps) {
  const [planId, setPlanId] = useState(initialPlanId ?? "");
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyPlan);
  const [loading, setLoading] = useState(Boolean(initialPlanId));
  const [saving, setSaving] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(!initialPlanId);
  const [error, setError] = useState("");
  const [phaseEditor, setPhaseEditor] = useState<RecoveryPlanPhase | "new" | null>(null);

  const loadPlan = useCallback(async (targetId = planId) => {
    if (!targetId) return;
    setLoading(true);
    setError("");
    try {
      const response = await doctorRecoveryService.getPlan(targetId);
      const next = response.data?.plan ?? null;
      setPlan(next);
      if (next) setForm(planToForm(next));
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tải kế hoạch phục hồi."));
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { if (planId) void loadPlan(planId); }, [loadPlan, planId]);

  async function saveMetadata() {
    const payload = toPlanPayload(form);
    if (!payload) {
      setError("Tên kế hoạch và số ngày thực hiện lớn hơn 0 là bắt buộc.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (planId) {
        await doctorRecoveryService.updatePlan(planId, payload);
        await loadPlan(planId);
      } else {
        const response = await doctorRecoveryService.createPlan(requestId, payload);
        const createdId = response.data?.id;
        if (!createdId) throw new Error("Backend không trả mã kế hoạch vừa tạo.");
        setPlanId(createdId);
      }
      setEditingMetadata(false);
      onChanged();
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể lưu kế hoạch."));
    } finally {
      setSaving(false);
    }
  }

  function confirmPublish() {
    if (!planId) return;
    Alert.alert(
      "Xuất bản kế hoạch?",
      "Kế hoạch sẽ được gửi cho người bệnh theo state machine của backend. Hãy kiểm tra đầy đủ nội dung trước khi tiếp tục.",
      [
        { text: "Quay lại", style: "cancel" },
        { text: "Xuất bản", onPress: () => void publishPlan() },
      ],
    );
  }

  async function publishPlan() {
    setSaving(true);
    setError("");
    try {
      await doctorRecoveryService.publish(planId);
      await loadPlan(planId);
      onChanged();
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể xuất bản. Hãy kiểm tra trạng thái và nội dung kế hoạch."));
    } finally {
      setSaving(false);
    }
  }

  function confirmDeletePlan() {
    if (!planId) return;
    Alert.alert("Xóa bản nháp?", "Toàn bộ giai đoạn, mục dinh dưỡng và nguồn thực phẩm trong bản nháp này sẽ bị xóa.", [
      { text: "Giữ bản nháp", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => { setSaving(true); setError(""); try { await doctorRecoveryService.deletePlan(planId); onChanged(); onClose(); } catch (requestError) { setError(errorMessage(requestError, "Không thể xóa bản nháp.")); } finally { setSaving(false); } } },
    ]);
  }

  const isDraft = plan ? ["draft", "0"].includes(statusKey(plan.status)) : true;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <Screen scroll contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.flex}><AppText variant="eyebrow" color={colors.teal}>Biên tập kế hoạch</AppText><AppText variant="h2">Kế hoạch phục hồi</AppText></View>
          <Button variant="secondary" size="sm" disabled={saving} onPress={onClose}>Đóng</Button>
        </View>
        <ApiMessage type="error" message={error} />
        {loading ? <LoadingState title="Đang tải kế hoạch..." /> : null}

        {!loading && editingMetadata ? (
          <PlanMetadataForm form={form} setForm={setForm} saving={saving} hasPlan={Boolean(planId)} onCancel={() => planId ? setEditingMetadata(false) : onClose()} onSave={saveMetadata} />
        ) : null}

        {!loading && plan && !editingMetadata ? (
          <>
            <Card style={styles.card}>
              <View style={styles.rowBetween}><AppText variant="h3">{plan.planName}</AppText><Badge tone={isDraft ? "warning" : "success"}>{isDraft ? "Bản nháp" : "Đã xuất bản"}</Badge></View>
              <AppText color={colors.muted}>{plan.summary || "Chưa có tóm tắt."}</AppText>
              <AppText variant="caption" color={colors.muted}>{plan.durationDays} ngày · Tái khám: {plan.recheckInstruction || "Chưa có hướng dẫn"}</AppText>
              {isDraft ? <Button variant="secondary" onPress={() => setEditingMetadata(true)}>Sửa thông tin chung</Button> : null}
            </Card>

            <View style={styles.rowBetween}><AppText variant="h3">Các giai đoạn</AppText>{isDraft ? <Button size="sm" onPress={() => setPhaseEditor("new")} leftIcon={<Plus size={16} color={colors.white} />}>Thêm</Button> : null}</View>
            {plan.phases?.length ? plan.phases.map((phase) => (
              <Card key={phase.id} style={styles.card}>
                <View style={styles.rowBetween}><View style={styles.flex}><AppText variant="bodyStrong">{phase.phaseName}</AppText><AppText variant="caption" color={colors.muted}>Ngày {phase.startDay}–{phase.endDay} · {phase.nutrientTargets?.length ?? 0} mục dinh dưỡng</AppText></View><ChevronRight size={20} color={colors.teal} /></View>
                <Button variant="secondary" onPress={() => setPhaseEditor(phase)}>{isDraft ? "Mở và chỉnh sửa" : "Xem chi tiết"}</Button>
              </Card>
            )) : <EmptyState title="Chưa có giai đoạn" description="Thêm ít nhất một giai đoạn trước khi xuất bản." />}

            {isDraft ? <><Button variant="dark" fullWidth disabled={saving} onPress={confirmPublish} leftIcon={<Send size={17} color={colors.white} />}>Xuất bản kế hoạch</Button><Button variant="danger" fullWidth disabled={saving} onPress={confirmDeletePlan} leftIcon={<Trash2 size={17} color={colors.white} />}>Xóa bản nháp</Button></> : <ApiMessage type="info" message="Kế hoạch đã rời trạng thái nháp. Nội dung chỉ đọc trên mobile và mọi trạng thái tiếp theo do backend kiểm soát." />}
          </>
        ) : null}

        <PhaseEditor
          planId={planId}
          phase={phaseEditor}
          readOnly={!isDraft}
          onClose={() => setPhaseEditor(null)}
          onSaved={async () => { setPhaseEditor(null); await loadPlan(planId); onChanged(); }}
        />
      </Screen>
    </Modal>
  );
}

function PlanMetadataForm({ form, setForm, saving, hasPlan, onCancel, onSave }: { form: PlanForm; setForm: (value: PlanForm) => void; saving: boolean; hasPlan: boolean; onCancel: () => void; onSave: () => void }) {
  return <Card style={styles.card}>
    <AppText variant="h3">{hasPlan ? "Sửa thông tin chung" : "Tạo bản nháp"}</AppText>
    <TextField label="Tên kế hoạch" value={form.planName} onChangeText={(value) => setForm({ ...form, planName: value })} editable={!saving} />
    <TextField label="Tóm tắt" value={form.summary} onChangeText={(value) => setForm({ ...form, summary: value })} multiline editable={!saving} />
    <TextField label="Số ngày" value={form.durationDays} onChangeText={(value) => setForm({ ...form, durationDays: value })} keyboardType="number-pad" editable={!saving} />
    <TextField label="Hướng dẫn tái khám" value={form.recheckInstruction} onChangeText={(value) => setForm({ ...form, recheckInstruction: value })} multiline editable={!saving} />
    <View style={styles.actions}><Button variant="secondary" disabled={saving} onPress={onCancel}>Hủy</Button><Button disabled={saving} onPress={onSave}>{saving ? "Đang lưu..." : "Lưu"}</Button></View>
  </Card>;
}

function PhaseEditor({ planId, phase, readOnly, onClose, onSaved }: { planId: string; phase: RecoveryPlanPhase | "new" | null; readOnly: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const existing = phase && phase !== "new" ? phase : null;
  const [form, setForm] = useState<PhaseForm>(emptyPhase);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nutrient, setNutrient] = useState<RecoveryPlanNutrient | "new" | null>(null);
  useEffect(() => { setForm(existing ? { phaseName: existing.phaseName, startDay: String(existing.startDay), endDay: String(existing.endDay), sleepAndRestHoursPerDay: existing.sleepAndRestHoursPerDay == null ? "" : String(existing.sleepAndRestHoursPerDay), instruction: existing.instruction ?? "", sortOrder: String(existing.sortOrder) } : emptyPhase); setError(""); }, [phase, existing]);
  if (!phase) return null;

  async function save() {
    const startDay = validatePositive(form.startDay); const endDay = validatePositive(form.endDay); const rest = form.sleepAndRestHoursPerDay ? Number(form.sleepAndRestHoursPerDay) : null;
    if (!form.phaseName.trim() || startDay === null || endDay === null || endDay < startDay || (rest !== null && (!Number.isFinite(rest) || rest < 0 || rest > 24))) { setError("Kiểm tra tên, khoảng ngày và số giờ nghỉ từ 0 đến 24."); return; }
    const payload: RecoveryPlanPhasePayload = { phaseName: form.phaseName.trim(), startDay, endDay, sleepAndRestHoursPerDay: rest, instruction: form.instruction.trim() || null, sortOrder: Number(form.sortOrder) || 0 };
    setSaving(true); setError("");
    try { if (existing) await doctorRecoveryService.updatePhase(planId, existing.id, payload); else await doctorRecoveryService.createPhase(planId, payload); await onSaved(); }
    catch (requestError) { setError(errorMessage(requestError, "Không thể lưu giai đoạn.")); }
    finally { setSaving(false); }
  }

  function remove() { if (!existing) return; Alert.alert("Xóa giai đoạn?", "Các mục dinh dưỡng và thực phẩm bên trong cũng có thể bị ảnh hưởng.", [{ text: "Hủy", style: "cancel" }, { text: "Xóa", style: "destructive", onPress: async () => { setSaving(true); try { await doctorRecoveryService.deletePhase(planId, existing.id); await onSaved(); } catch (requestError) { setError(errorMessage(requestError, "Không thể xóa giai đoạn.")); } finally { setSaving(false); } } }]); }

  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><Screen scroll contentContainerStyle={styles.content}>
    <View style={styles.header}><AppText variant="h2">{existing ? existing.phaseName : "Giai đoạn mới"}</AppText><Button variant="secondary" size="sm" onPress={onClose}>Đóng</Button></View><ApiMessage type="error" message={error} />
    {!readOnly ? <Card style={styles.card}><TextField label="Tên giai đoạn" value={form.phaseName} onChangeText={(value) => setForm({ ...form, phaseName: value })} /><View style={styles.actions}><View style={styles.flex}><TextField label="Ngày bắt đầu" value={form.startDay} onChangeText={(value) => setForm({ ...form, startDay: value })} keyboardType="number-pad" /></View><View style={styles.flex}><TextField label="Ngày kết thúc" value={form.endDay} onChangeText={(value) => setForm({ ...form, endDay: value })} keyboardType="number-pad" /></View></View><TextField label="Giờ ngủ và nghỉ mỗi ngày" value={form.sleepAndRestHoursPerDay} onChangeText={(value) => setForm({ ...form, sleepAndRestHoursPerDay: value })} keyboardType="decimal-pad" /><TextField label="Hướng dẫn" value={form.instruction} onChangeText={(value) => setForm({ ...form, instruction: value })} multiline /><TextField label="Thứ tự" value={form.sortOrder} onChangeText={(value) => setForm({ ...form, sortOrder: value })} keyboardType="number-pad" /><Button disabled={saving} onPress={save}>{saving ? "Đang lưu..." : "Lưu giai đoạn"}</Button>{existing ? <Button variant="danger" disabled={saving} onPress={remove} leftIcon={<Trash2 size={16} color={colors.white} />}>Xóa giai đoạn</Button> : null}</Card> : null}
    {existing ? <><View style={styles.rowBetween}><AppText variant="h3">Mục dinh dưỡng</AppText>{!readOnly ? <Button size="sm" onPress={() => setNutrient("new")}>Thêm</Button> : null}</View>{existing.nutrientTargets?.length ? existing.nutrientTargets.map((item) => <Card key={item.id} style={styles.card}><AppText variant="bodyStrong">{item.nutrientName}</AppText><AppText color={colors.muted}>{item.amountPerDay} {item.unit}/ngày · {item.foodSources?.length ?? 0} thực phẩm</AppText><Button variant="secondary" onPress={() => setNutrient(item)}>{readOnly ? "Xem" : "Chỉnh sửa"}</Button></Card>) : <EmptyState title="Chưa có mục dinh dưỡng" />}</> : null}
    <NutrientEditor planId={planId} phase={existing} nutrient={nutrient} readOnly={readOnly} onClose={() => setNutrient(null)} onSaved={onSaved} />
  </Screen></Modal>;
}

function NutrientEditor({ planId, phase, nutrient, readOnly, onClose, onSaved }: { planId: string; phase: RecoveryPlanPhase | null; nutrient: RecoveryPlanNutrient | "new" | null; readOnly: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const existing = nutrient && nutrient !== "new" ? nutrient : null;
  const [form, setForm] = useState<NutrientForm>(emptyNutrient); const [food, setFood] = useState<RecoveryPlanFood | "new" | null>(null); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { setForm(existing ? { nutrientName: existing.nutrientName, amountPerDay: String(existing.amountPerDay), unit: existing.unit, instruction: existing.instruction ?? "", sortOrder: String(existing.sortOrder) } : emptyNutrient); setError(""); }, [nutrient, existing]);
  if (!nutrient || !phase) return null;
  const activePhase = phase;
  async function save() { const amount = validatePositive(form.amountPerDay); if (!form.nutrientName.trim() || !form.unit.trim() || amount === null) { setError("Tên dưỡng chất, lượng mỗi ngày và đơn vị là bắt buộc."); return; } const payload: RecoveryPlanNutrientPayload = { nutrientName: form.nutrientName.trim(), amountPerDay: amount, unit: form.unit.trim(), instruction: form.instruction.trim() || null, sortOrder: Number(form.sortOrder) || 0 }; setSaving(true); try { if (existing) await doctorRecoveryService.updateNutrient(planId, activePhase.id, existing.id, payload); else await doctorRecoveryService.createNutrient(planId, activePhase.id, payload); await onSaved(); onClose(); } catch (requestError) { setError(errorMessage(requestError, "Không thể lưu mục dinh dưỡng.")); } finally { setSaving(false); } }
  function remove() { if (!existing) return; Alert.alert("Xóa mục dinh dưỡng?", "Các nguồn thực phẩm bên trong cũng có thể bị xóa.", [{ text: "Hủy", style: "cancel" }, { text: "Xóa", style: "destructive", onPress: async () => { setSaving(true); try { await doctorRecoveryService.deleteNutrient(planId, activePhase.id, existing.id); await onSaved(); onClose(); } catch (requestError) { setError(errorMessage(requestError, "Không thể xóa mục dinh dưỡng.")); } finally { setSaving(false); } } }]); }
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><Screen scroll contentContainerStyle={styles.content}><View style={styles.header}><AppText variant="h2">{existing ? existing.nutrientName : "Mục dinh dưỡng mới"}</AppText><Button variant="secondary" size="sm" onPress={onClose}>Đóng</Button></View><ApiMessage type="error" message={error} />{!readOnly ? <Card style={styles.card}><TextField label="Tên dưỡng chất" value={form.nutrientName} onChangeText={(value) => setForm({ ...form, nutrientName: value })} /><TextField label="Lượng mỗi ngày" value={form.amountPerDay} onChangeText={(value) => setForm({ ...form, amountPerDay: value })} keyboardType="decimal-pad" /><TextField label="Đơn vị" value={form.unit} onChangeText={(value) => setForm({ ...form, unit: value })} /><TextField label="Hướng dẫn" value={form.instruction} onChangeText={(value) => setForm({ ...form, instruction: value })} multiline /><TextField label="Thứ tự" value={form.sortOrder} onChangeText={(value) => setForm({ ...form, sortOrder: value })} keyboardType="number-pad" /><Button disabled={saving} onPress={save}>{saving ? "Đang lưu..." : "Lưu mục dinh dưỡng"}</Button>{existing ? <Button variant="danger" disabled={saving} onPress={remove}>Xóa mục dinh dưỡng</Button> : null}</Card> : null}{existing ? <><View style={styles.rowBetween}><AppText variant="h3">Nguồn thực phẩm</AppText>{!readOnly ? <Button size="sm" onPress={() => setFood("new")}>Thêm</Button> : null}</View>{existing.foodSources?.length ? existing.foodSources.map((item) => <Card key={item.id} style={styles.card}><AppText variant="bodyStrong">{item.foodName}</AppText><AppText color={colors.muted}>{item.suggestedServing || "Chưa ghi khẩu phần"}</AppText><Button variant="secondary" onPress={() => setFood(item)}>{readOnly ? "Xem" : "Chỉnh sửa"}</Button></Card>) : <EmptyState title="Chưa có nguồn thực phẩm" />}</> : null}<FoodEditor planId={planId} phaseId={activePhase.id} nutrient={existing} food={food} readOnly={readOnly} onClose={() => setFood(null)} onSaved={onSaved} /></Screen></Modal>;
}

function FoodEditor({ planId, phaseId, nutrient, food, readOnly, onClose, onSaved }: { planId: string; phaseId: string; nutrient: RecoveryPlanNutrient | null; food: RecoveryPlanFood | "new" | null; readOnly: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const existing = food && food !== "new" ? food : null; const [form, setForm] = useState<FoodForm>(emptyFood); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { setForm(existing ? { foodName: existing.foodName, suggestedServing: existing.suggestedServing ?? "", note: existing.note ?? "", sortOrder: String(existing.sortOrder) } : emptyFood); setError(""); }, [food, existing]);
  if (!food || !nutrient) return null;
  const activeNutrient = nutrient;
  async function save() { if (!form.foodName.trim()) { setError("Tên thực phẩm là bắt buộc."); return; } const payload: RecoveryPlanFoodPayload = { foodName: form.foodName.trim(), suggestedServing: form.suggestedServing.trim() || null, note: form.note.trim() || null, sortOrder: Number(form.sortOrder) || 0 }; setSaving(true); try { if (existing) await doctorRecoveryService.updateFood(planId, phaseId, activeNutrient.id, existing.id, payload); else await doctorRecoveryService.createFood(planId, phaseId, activeNutrient.id, payload); await onSaved(); onClose(); } catch (requestError) { setError(errorMessage(requestError, "Không thể lưu nguồn thực phẩm.")); } finally { setSaving(false); } }
  function remove() { if (!existing) return; Alert.alert("Xóa nguồn thực phẩm?", "Thao tác này không thể hoàn tác.", [{ text: "Hủy", style: "cancel" }, { text: "Xóa", style: "destructive", onPress: async () => { setSaving(true); try { await doctorRecoveryService.deleteFood(planId, phaseId, activeNutrient.id, existing.id); await onSaved(); onClose(); } catch (requestError) { setError(errorMessage(requestError, "Không thể xóa nguồn thực phẩm.")); } finally { setSaving(false); } } }]); }
  return <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}><Screen scroll contentContainerStyle={styles.content}><View style={styles.header}><AppText variant="h2">{existing ? existing.foodName : "Nguồn thực phẩm mới"}</AppText><Button variant="secondary" size="sm" onPress={onClose}>Đóng</Button></View><ApiMessage type="error" message={error} />{readOnly && existing ? <Card style={styles.card}><AppText>{existing.suggestedServing || "Chưa ghi khẩu phần"}</AppText><AppText color={colors.muted}>{existing.note || "Chưa có ghi chú"}</AppText></Card> : <Card style={styles.card}><TextField label="Tên thực phẩm" value={form.foodName} onChangeText={(value) => setForm({ ...form, foodName: value })} /><TextField label="Khẩu phần gợi ý" value={form.suggestedServing} onChangeText={(value) => setForm({ ...form, suggestedServing: value })} /><TextField label="Ghi chú" value={form.note} onChangeText={(value) => setForm({ ...form, note: value })} multiline /><TextField label="Thứ tự" value={form.sortOrder} onChangeText={(value) => setForm({ ...form, sortOrder: value })} keyboardType="number-pad" /><Button disabled={saving} onPress={save}>{saving ? "Đang lưu..." : "Lưu nguồn thực phẩm"}</Button>{existing ? <Button variant="danger" disabled={saving} onPress={remove}>Xóa nguồn thực phẩm</Button> : null}</Card>}</Screen></Modal>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing["4xl"] },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  card: { gap: spacing.md },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm },
});
