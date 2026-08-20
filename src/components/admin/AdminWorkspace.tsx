import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, View } from "react-native";
import { Building2, LogOut, RefreshCw, Stethoscope, Users } from "lucide-react-native";

import { ApiMessage, AppText, Badge, Button, Card, LoadingState, Screen, TextField } from "@/src/components/ui";
import { useLogout } from "@/src/hooks/useLogout";
import { doctorManagementApi } from "@/src/services/doctorService";
import { medicalDepartmentsService, usersService } from "@/src/services/domainServices";
import { medicalFacilitiesApi } from "@/src/services/facilityService";
import { colors, spacing } from "@/src/theme/tokens";
import { AdminCatalogBrowser } from "./AdminCatalogBrowser";

type AdminPreview = { id: string; title: string; subtitle: string; status?: string; raw: Record<string, unknown> };
type AdminSection = { key: string; title: string; count: number; items: AdminPreview[]; failed: boolean };

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function normalizePage(value: unknown) {
  const page = getObject(value);
  const items = Array.isArray(page.items) ? page.items.map(getObject) : Array.isArray(value) ? value.map(getObject) : [];
  return { items, totalCount: Number(page.totalCount ?? items.length) || items.length };
}

function textValue(item: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

export function AdminWorkspace() {
  const { logout, loggingOut } = useLogout();
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentEditor, setDepartmentEditor] = useState<Record<string, unknown> | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      usersService.list(1, 5),
      doctorManagementApi.list({ pageNumber: 1, pageSize: 5 }),
      medicalFacilitiesApi.list(1, 5),
      medicalDepartmentsService.list(),
    ]);

    const definitions = [
      { key: "users", title: "Người dùng", result: results[0], titleKeys: ["displayName", "userName", "email"], subtitleKeys: ["email", "phoneNumber"] },
      { key: "doctors", title: "Bác sĩ", result: results[1], titleKeys: ["fullName", "displayName"], subtitleKeys: ["departmentName", "specialty"] },
      { key: "facilities", title: "Cơ sở y tế", result: results[2], titleKeys: ["facilityName", "name"], subtitleKeys: ["address", "phone"] },
      { key: "departments", title: "Chuyên khoa", result: results[3], titleKeys: ["departmentName", "name"], subtitleKeys: ["chapterCode", "description"] },
    ];

    const next = definitions.map((definition): AdminSection => {
      if (definition.result.status === "rejected") {
        return { key: definition.key, title: definition.title, count: 0, items: [], failed: true };
      }
      const page = normalizePage(definition.result.value.data);
      return {
        key: definition.key,
        title: definition.title,
        count: page.totalCount,
        failed: false,
        items: page.items.map((item, index) => ({
          id: textValue(item, ["id", "userId", "facilityId"], `${definition.key}-${index}`),
          title: textValue(item, definition.titleKeys, "Chưa có tên"),
          subtitle: textValue(item, definition.subtitleKeys, "Chưa có thông tin bổ sung"),
          status: typeof item.isActive === "boolean" ? (item.isActive ? "Đang hoạt động" : "Tạm ngưng") : undefined,
          raw: item,
        })),
      };
    });
    setSections(next);
    if (next.every((section) => section.failed)) setError("Không thể tải dữ liệu quản trị từ backend.");
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="eyebrow" color={colors.teal}>Không gian quản trị</AppText>
          <AppText variant="h1">Tổng quan hệ thống</AppText>
          <AppText color={colors.muted}>Dữ liệu trực tiếp từ các API được bảo vệ bằng vai trò Admin.</AppText>
        </View>
        <Button variant="secondary" size="sm" disabled={loggingOut} onPress={logout} leftIcon={<LogOut size={16} color={colors.ink} />}>Đăng xuất</Button>
      </View>

      <View style={styles.toolbar}>
        <AppText variant="h3">Tài nguyên chính</AppText>
        <Button variant="secondary" size="sm" disabled={loading} onPress={load} leftIcon={<RefreshCw size={16} color={colors.ink} />}>Tải lại</Button>
      </View>
      <ApiMessage type="error" message={error} />
      {loading ? <LoadingState title="Đang tải tổng quan quản trị..." /> : null}

      {!loading ? sections.map((section) => (
        <Card key={section.key} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              {section.key === "users" ? <Users size={20} color={colors.teal} /> : section.key === "doctors" ? <Stethoscope size={20} color={colors.teal} /> : <Building2 size={20} color={colors.teal} />}
              <AppText variant="h3">{section.title}</AppText>
            </View>
            <View style={styles.headerActions}>{section.key === "departments" ? <Button size="sm" onPress={() => setDepartmentEditor("new")}>Thêm</Button> : null}<Badge tone={section.failed ? "danger" : "info"}>{section.failed ? "Lỗi tải" : `${section.count}`}</Badge></View>
          </View>
          {section.items.length ? section.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemCopy}>
                <AppText variant="bodyStrong">{item.title}</AppText>
                <AppText variant="caption" color={colors.muted}>{item.subtitle}</AppText>
              </View>
              {item.status ? <Badge tone={item.status === "Đang hoạt động" ? "success" : "warning"}>{item.status}</Badge> : null}
              {section.key === "departments" ? <Button variant="secondary" size="sm" onPress={() => setDepartmentEditor(item.raw)}>Sửa</Button> : null}
            </View>
          )) : <AppText color={colors.muted}>{section.failed ? "Backend từ chối hoặc không trả dữ liệu cho mô-đun này." : "Chưa có dữ liệu."}</AppText>}
        </Card>
      )) : null}

      <Card variant="soft" style={styles.notice}>
        <AppText variant="bodyStrong">Phạm vi hiện tại</AppText>
        <AppText color={colors.muted}>Tổng quan và chuyên khoa dùng API thật; các danh mục quản trị còn lại có tìm kiếm và xem chi tiết an toàn. Thay đổi cấu hình AI P0 chỉ được thực hiện qua workflow phê duyệt.</AppText>
      </Card>
      <AdminCatalogBrowser />
      {departmentEditor ? <DepartmentEditor key={departmentEditor === "new" ? "new" : String(departmentEditor.id ?? departmentEditor.departmentId)} value={departmentEditor} onClose={() => setDepartmentEditor(null)} onSaved={load} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.lg, paddingBottom: spacing["4xl"] },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  itemCopy: { flex: 1, gap: spacing.xs },
  notice: { gap: spacing.sm },
});

function DepartmentEditor({ value, onClose, onSaved }: { value: Record<string, unknown> | "new"; onClose: () => void; onSaved: () => Promise<void> }) {
  const existing = value !== "new" ? value : null;
  const [name, setName] = useState(String(existing?.departmentName ?? existing?.name ?? ""));
  const [description, setDescription] = useState(String(existing?.description ?? ""));
  const [chapterCode, setChapterCode] = useState(String(existing?.chapterCode ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const id = String(existing?.id ?? existing?.departmentId ?? "");

  async function save() {
    if (!name.trim()) { setError("Tên chuyên khoa là bắt buộc."); return; }
    setSaving(true); setError("");
    try {
      const payload = { departmentName: name.trim(), description: description.trim() || null, chapterCode: chapterCode.trim() || null };
      if (existing) await medicalDepartmentsService.update(id, payload); else await medicalDepartmentsService.create(payload);
      await onSaved(); onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể lưu chuyên khoa.");
    } finally { setSaving(false); }
  }

  function remove() {
    if (!existing) return;
    Alert.alert("Xóa chuyên khoa?", "Backend sẽ kiểm tra các ràng buộc liên quan trước khi xóa.", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => { setSaving(true); try { await medicalDepartmentsService.remove(id); await onSaved(); onClose(); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Không thể xóa chuyên khoa."); } finally { setSaving(false); } } },
    ]);
  }

  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><Screen scroll contentContainerStyle={styles.screen}><View style={styles.header}><AppText variant="h2">{existing ? "Sửa chuyên khoa" : "Thêm chuyên khoa"}</AppText><Button variant="secondary" size="sm" onPress={onClose}>Đóng</Button></View><ApiMessage type="error" message={error} /><Card style={styles.section}><TextField label="Tên chuyên khoa" value={name} onChangeText={setName} editable={!saving} /><TextField label="Mã chương ICD" value={chapterCode} onChangeText={setChapterCode} editable={!saving} /><TextField label="Mô tả" value={description} onChangeText={setDescription} multiline editable={!saving} /><Button disabled={saving || !name.trim()} onPress={save}>{saving ? "Đang lưu..." : "Lưu chuyên khoa"}</Button>{existing ? <Button variant="danger" disabled={saving} onPress={remove}>Xóa chuyên khoa</Button> : null}</Card></Screen></Modal>;
}
