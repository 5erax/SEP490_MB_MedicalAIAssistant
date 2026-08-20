import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { ApiMessage, AppText, Badge, Button, Card, EmptyState, LoadingState, Screen, TextField } from "@/src/components/ui";
import { adminService, AdminModuleKey } from "@/src/services/adminService";
import { colors, radius, spacing } from "@/src/theme/tokens";

const modules: { key: AdminModuleKey; label: string; sensitive?: boolean }[] = [
  { key: "USERS", label: "Người dùng" },
  { key: "DOCTORS", label: "Bác sĩ" },
  { key: "DOCTOR_INVITATIONS", label: "Lời mời bác sĩ" },
  { key: "FACILITIES", label: "Cơ sở y tế" },
  { key: "DEPARTMENTS", label: "Chuyên khoa" },
  { key: "ICD_CHAPTERS", label: "Chương ICD" },
  { key: "CLINICAL_QUESTIONS", label: "Câu hỏi lâm sàng" },
  { key: "CHECKLIST_ITEMS", label: "Checklist tư vấn" },
  { key: "LAB_INDICATORS", label: "Chỉ số xét nghiệm" },
  { key: "AI_CONFIGS", label: "Cấu hình AI", sensitive: true },
  { key: "SUBSCRIPTION_PLANS", label: "Gói dịch vụ" },
  { key: "PAYMENTS", label: "Thanh toán" },
];

function objectValue(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function getItems(value: unknown) {
  if (Array.isArray(value)) return value.map(objectValue);
  const object = objectValue(value);
  return Array.isArray(object.items) ? object.items.map(objectValue) : [];
}

function firstText(item: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) if (typeof item[key] === "string" && String(item[key]).trim()) return String(item[key]);
  return fallback;
}

function itemTitle(item: Record<string, unknown>) {
  return firstText(item, ["displayName", "fullName", "facilityName", "departmentName", "chapterName", "questionText", "itemText", "fullName", "symbol", "taskType", "planName", "email"], "Bản ghi chưa có tên");
}

function itemSubtitle(item: Record<string, unknown>) {
  return firstText(item, ["email", "address", "chapterCode", "description", "model", "statusName", "status", "createdAt"], "Chưa có thông tin bổ sung");
}

export function AdminCatalogBrowser() {
  const [selectedModule, setSelectedModule] = useState<AdminModuleKey>("USERS");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const selectedDefinition = useMemo(() => modules.find((module) => module.key === selectedModule) ?? modules[0], [selectedModule]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await adminService.list(selectedModule, 1, 20, appliedSearch);
      setItems(getItems(response.data));
    } catch (requestError) {
      setItems([]);
      setError(requestError instanceof Error ? requestError.message : "Không thể tải mô-đun quản trị.");
    } finally { setLoading(false); }
  }, [appliedSearch, selectedModule]);

  useEffect(() => { void load(); }, [load]);

  return <View style={styles.root}>
    <AppText variant="h2">Danh mục quản trị</AppText>
    <View style={styles.moduleGrid}>{modules.map((module) => { const selected = module.key === selectedModule; return <Pressable key={module.key} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => { setSelectedModule(module.key); setSearch(""); setAppliedSearch(""); }} style={[styles.moduleChip, selected && styles.moduleChipSelected]}><AppText variant="caption" color={selected ? colors.white : colors.ink}>{module.label}</AppText></Pressable>; })}</View>
    {selectedDefinition.sensitive ? <ApiMessage type="warning" message="Cấu hình AI có ảnh hưởng P0. Mobile chỉ hiển thị danh sách; thay đổi prompt/model cần workflow phê duyệt và evaluation theo rulebook." /> : null}
    <View style={styles.searchRow}><View style={styles.searchField}><TextField label={`Tìm trong ${selectedDefinition.label}`} value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={() => setAppliedSearch(search.trim())} /></View><Button variant="secondary" onPress={() => setAppliedSearch(search.trim())}>Tìm</Button></View>
    <ApiMessage type="error" message={error} />
    {loading ? <LoadingState title={`Đang tải ${selectedDefinition.label.toLowerCase()}...`} /> : null}
    {!loading && !items.length ? <EmptyState title="Chưa có dữ liệu" description="Backend không trả bản ghi phù hợp hoặc tài khoản không có quyền xem." /> : null}
    {!loading ? <View style={styles.list}>{items.map((item, index) => { const id = String(item.id ?? item.userId ?? item.facilityId ?? index); return <Card key={id} style={styles.card}><View style={styles.cardHeader}><View style={styles.copy}><AppText variant="bodyStrong">{itemTitle(item)}</AppText><AppText variant="caption" color={colors.muted}>{itemSubtitle(item)}</AppText></View>{typeof item.isActive === "boolean" ? <Badge tone={item.isActive ? "success" : "warning"}>{item.isActive ? "Hoạt động" : "Tạm ngưng"}</Badge> : null}</View><Button variant="secondary" onPress={() => setDetail(item)}>Xem chi tiết</Button></Card>; })}</View> : null}
    <AdminRecordDetail moduleLabel={selectedDefinition.label} value={detail} onClose={() => setDetail(null)} />
  </View>;
}

function AdminRecordDetail({ moduleLabel, value, onClose }: { moduleLabel: string; value: Record<string, unknown> | null; onClose: () => void }) {
  if (!value) return null;
  const safeEntries = Object.entries(value).filter(([key, field]) => !/token|password|prompt|secret|credential/i.test(key) && ["string", "number", "boolean"].includes(typeof field));
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><Screen scroll contentContainerStyle={styles.modal}><View style={styles.cardHeader}><View style={styles.copy}><AppText variant="eyebrow" color={colors.teal}>{moduleLabel}</AppText><AppText variant="h2">{itemTitle(value)}</AppText></View><Button variant="secondary" size="sm" onPress={onClose}>Đóng</Button></View><ApiMessage type="info" message="Chi tiết chỉ hiển thị trường scalar an toàn. Token, credential và nội dung prompt không được render trong generic inspector." />{safeEntries.map(([key, field]) => <Card key={key} style={styles.card}><AppText variant="caption" color={colors.muted}>{key}</AppText><AppText>{String(field)}</AppText></Card>)}</Screen></Modal>;
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  moduleGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  moduleChip: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.pill, paddingHorizontal: spacing.md },
  moduleChipSelected: { backgroundColor: colors.teal, borderColor: colors.teal },
  searchRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  searchField: { flex: 1 },
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  modal: { gap: spacing.md, paddingBottom: spacing["4xl"] },
});
