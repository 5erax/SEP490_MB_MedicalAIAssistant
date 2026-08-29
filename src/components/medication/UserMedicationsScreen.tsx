// Mobile version of Web's UserMedicationsPage: CRUD is backed by
// /api/user-medications, while reminder notifications are delivered by BE push.
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import {
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
  Pencil,
  Pill,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react-native";

import { AppText, Badge, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { MoreBackHeader } from "@/src/components/more";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
import { useToast, useUserMedications } from "@/src/hooks";
import { UserMedication } from "@/src/types/medication";
import { getMedicationReminderStatus, getMedicationReminderTimes } from "@/src/utils/medicationReminderStatus";
import { MedicationFormSheet } from "./MedicationFormSheet";

function formatDate(value?: string | null) {
  if (!value) return "?";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric", year: "2-digit" }).format(date);
}

function getNextReminder(medications: UserMedication[]) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const candidates = medications
    .filter((medication) => getMedicationReminderStatus(medication).active)
    .flatMap((medication) =>
      getMedicationReminderTimes(medication).map((time) => {
        const [hours = "0", minutes = "0"] = time.split(":");
        const totalMinutes = Number(hours) * 60 + Number(minutes);
        return {
          medication,
          time,
          distance: totalMinutes >= currentMinutes ? totalMinutes - currentMinutes : totalMinutes + 1440 - currentMinutes,
        };
      }),
    )
    .sort((left, right) => left.distance - right.distance);

  return candidates[0] ?? null;
}

function getTodayReminderTimes(medications: UserMedication[]) {
  return medications
    .filter((medication) => getMedicationReminderStatus(medication).active)
    .flatMap((medication) =>
      getMedicationReminderTimes(medication).map((time) => ({
        id: `${medication.id}-${time}`,
        time,
        name: medication.medicineName,
      })),
    )
    .sort((left, right) => left.time.localeCompare(right.time))
    .slice(0, 4);
}

function MedicationHeader({
  medications,
  totalCount,
  pageNumber,
  totalPages,
  loading,
  listError,
  onReload,
  onCreate,
}: {
  medications: UserMedication[];
  totalCount: number;
  pageNumber: number;
  totalPages: number;
  loading: boolean;
  listError: string;
  onReload: () => void;
  onCreate: () => void;
}) {
  const currentActiveCount = medications.filter((medication) => getMedicationReminderStatus(medication).active).length;
  const reminderCount = medications.reduce((total, medication) => {
    if (!getMedicationReminderStatus(medication).active) return total;
    return total + getMedicationReminderTimes(medication).length;
  }, 0);
  const nextReminder = getNextReminder(medications);
  const todayReminderTimes = getTodayReminderTimes(medications);
  const displayedPage = Math.max(1, pageNumber);
  const displayedPages = Math.max(1, totalPages || 1);

  return (
    <View style={styles.headerWrap}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Pill size={21} color={colors.white} />
          </View>
          <View style={styles.heroBadge}>
            <BellRing size={13} color={colors.white} />
            <AppText variant="caption" color={colors.white}>
              Lịch nhắc cá nhân
            </AppText>
          </View>
        </View>

        <View style={styles.heroCopyWrap}>
          <AppText variant="h2" color={colors.white} style={styles.heroTitle}>
            Thuốc & lịch nhắc
          </AppText>
          <AppText color="rgba(255,255,255,0.86)" style={styles.heroCopy}>
            Theo dõi thuốc đang dùng, giờ uống và các mốc nhắc quan trọng trong ngày.
          </AppText>
        </View>

        <View style={styles.heroSummary}>
          <View style={styles.summaryMain}>
            <AppText variant="caption" color="rgba(255,255,255,0.74)">
              Lần nhắc tiếp theo
            </AppText>
            <AppText variant="h3" color={colors.white} numberOfLines={1}>
              {nextReminder ? nextReminder.medication.medicineName : "Chưa có lịch nhắc"}
            </AppText>
          </View>
          <View style={styles.summaryTime}>
            <Clock3 size={15} color={colors.white} />
            <AppText variant="bodyStrong" color={colors.white}>
              {nextReminder ? nextReminder.time : "--:--"}
            </AppText>
          </View>
        </View>

        <View style={styles.heroStatRow}>
          <View style={styles.heroStatItem}>
            <AppText variant="h3" color={colors.ink}>
              {totalCount}
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              Tổng thuốc
            </AppText>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStatItem}>
            <AppText variant="h3" color={colors.ink}>
              {currentActiveCount}
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              Đang nhắc
            </AppText>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStatItem}>
            <AppText variant="h3" color={colors.ink}>
              {reminderCount}
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              Mốc giờ
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Button
          variant="secondary"
          size="sm"
          onPress={onReload}
          disabled={loading}
          leftIcon={<RefreshCw size={16} color={colors.ink} />}
          style={styles.reloadButton}
        >
          Tải lại
        </Button>
        <Button size="sm" onPress={onCreate} leftIcon={<Plus size={16} color={colors.white} />} style={styles.addButton}>
          Thêm thuốc
        </Button>
      </View>

      <View style={styles.todayCard}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIcon}>
            <CalendarDays size={18} color={colors.teal} />
          </View>
          <View style={styles.sectionCopy}>
            <AppText variant="bodyStrong">Lịch uống hôm nay</AppText>
            <AppText variant="caption" color={colors.subtle}>
              {todayReminderTimes.length ? "Các mốc nhắc còn hiệu lực" : "Không có mốc nhắc trong trang này"}
            </AppText>
          </View>
        </View>

        {todayReminderTimes.length ? (
          <View style={styles.timeline}>
            {todayReminderTimes.map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <AppText variant="bodyStrong">{item.time}</AppText>
                <AppText variant="caption" color={colors.muted} numberOfLines={1} style={styles.timelineName}>
                  {item.name}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.notice}>
        <ShieldCheck size={17} color={colors.teal} />
        <AppText variant="caption" color={colors.muted} style={styles.noticeText}>
          Lịch nhắc dựa trên thông tin bạn đã cung cấp. MediMate không kê đơn hoặc xác minh chỉ định dùng thuốc.
        </AppText>
      </View>

      <View style={styles.listHeadCard}>
        <View style={styles.listHeadIcon}>
          <ListChecks size={18} color={colors.teal} />
        </View>
        <View style={styles.listHeadCopy}>
          <AppText variant="h3">Danh sách thuốc</AppText>
          <AppText variant="caption" color={colors.subtle}>
            {listError ? "Kiểm tra kết nối rồi tải lại danh sách." : "Mỗi trang hiển thị tối đa 5 thuốc để dễ quản lý."}
          </AppText>
        </View>
        <Badge tone="info">
          {displayedPage}/{displayedPages}
        </Badge>
      </View>
    </View>
  );
}

function MedicationListItem({
  medication,
  removing,
  onEdit,
  onRemove,
}: {
  medication: UserMedication;
  removing: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const state = getMedicationReminderStatus(medication);
  const reminderTimes = getMedicationReminderTimes(medication);
  const visibleTimes = state.active ? reminderTimes.slice(0, 3) : [];
  const accentStyle =
    state.key === "active" ? styles.medicationRowActive : state.key === "expired" ? styles.medicationRowExpired : styles.medicationRowIdle;

  return (
    <View style={[styles.medicationRow, accentStyle]}>
      <View style={styles.medicationIcon}>
        <Pill size={19} color={colors.teal} />
      </View>

      <View style={styles.medicationMain}>
        <View style={styles.medicationTitleRow}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.medicationTitle}>
            {medication.medicineName || "Thuốc chưa đặt tên"}
          </AppText>
          <Badge tone={state.tone}>{state.label}</Badge>
        </View>

        <View style={styles.metaLine}>
          <CalendarDays size={13} color={colors.subtle} />
          <AppText variant="caption" color={colors.subtle} numberOfLines={1} style={styles.metaText}>
            {formatDate(medication.startDate)} - {formatDate(medication.endDate)}
          </AppText>
        </View>

        {medication.dosageInstruction ? (
          <AppText variant="caption" color={colors.muted} numberOfLines={2} style={styles.dosageText}>
            {medication.dosageInstruction}
          </AppText>
        ) : null}

        <View style={styles.rowBottom}>
          <View style={styles.timePills}>
            {visibleTimes.length ? (
              visibleTimes.map((time) => (
                <View key={time} style={styles.timePill}>
                  <Clock3 size={12} color={colors.teal} />
                  <AppText variant="caption" color={colors.teal}>
                    {time}
                  </AppText>
                </View>
              ))
            ) : (
              <View style={styles.timePillMuted}>
                <AppText variant="caption" color={colors.subtle}>
                  {state.emptyText}
                </AppText>
              </View>
            )}
            {state.active && reminderTimes.length > visibleTimes.length ? (
              <View style={styles.timePillMuted}>
                <AppText variant="caption" color={colors.subtle}>
                  +{reminderTimes.length - visibleTimes.length}
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.itemActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Sửa thuốc" onPress={onEdit} style={styles.iconAction}>
              <Pencil size={15} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa thuốc"
              onPress={onRemove}
              disabled={removing}
              style={[styles.iconAction, styles.deleteAction, removing && styles.disabled]}
            >
              <Trash2 size={15} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function Pagination({
  pageNumber,
  totalPages,
  totalCount,
  pageSize,
  loading,
  onChange,
}: {
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const firstItem = totalCount ? (pageNumber - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(totalCount, pageNumber * pageSize);

  return (
    <View style={styles.pagination}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trang trước"
        disabled={pageNumber <= 1 || loading}
        onPress={() => onChange(Math.max(1, pageNumber - 1))}
        style={[styles.pageButton, (pageNumber <= 1 || loading) && styles.pageButtonDisabled]}
      >
        <ChevronLeft size={18} color={colors.ink} />
      </Pressable>
      <View style={styles.pageInfo}>
        <AppText variant="bodyStrong">
          Trang {pageNumber}/{totalPages}
        </AppText>
        <AppText variant="caption" color={colors.subtle}>
          {firstItem}-{lastItem}/{totalCount} thuốc
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trang sau"
        disabled={pageNumber >= totalPages || loading}
        onPress={() => onChange(Math.min(totalPages, pageNumber + 1))}
        style={[styles.pageButton, (pageNumber >= totalPages || loading) && styles.pageButtonDisabled]}
      >
        <ChevronRight size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

export function UserMedicationsScreen() {
  const { showToast } = useToast();
  const {
    medications,
    pageInfo,
    pageNumber,
    setPageNumber,
    loading,
    refreshing,
    listError,
    reload,
    formVisible,
    editingId,
    form,
    formErrors,
    submitting,
    removingId,
    openCreateForm,
    openEditForm,
    closeForm,
    setField,
    addReminderTime,
    removeReminderTime,
    submit,
    remove,
  } = useUserMedications();

  async function handleSubmit() {
    const result = await submit();
    if (result === "success") {
      showToast({ type: "success", message: editingId ? "Đã cập nhật thông tin thuốc." : "Đã thêm thuốc mới." });
    }
  }

  function handleRemove(medication: UserMedication) {
    Alert.alert("Xóa thuốc này?", `"${medication.medicineName}" sẽ bị xóa khỏi danh sách và lịch nhắc.`, [
      { text: "Đóng", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const result = await remove(medication.id);
          if (result === "success") {
            showToast({ type: "success", message: "Đã xóa thuốc." });
          }
        },
      },
    ]);
  }

  const header = (
    <>
      <MoreBackHeader title="Thuốc & lịch nhắc" />
      <MedicationHeader
        medications={medications}
        totalCount={pageInfo.totalCount}
        pageNumber={pageInfo.pageNumber || pageNumber}
        totalPages={pageInfo.totalPages}
        loading={loading || refreshing}
        listError={listError}
        onReload={reload}
        onCreate={openCreateForm}
      />
    </>
  );

  return (
    <Screen padded={false} style={styles.screen}>
      {loading && medications.length === 0 ? (
        <View style={styles.content}>
          {header}
          <SkeletonGroup lines={4} />
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(medication) => medication.id}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                title={listError ? "Không tải được danh sách thuốc" : "Chưa có thuốc nào"}
                description={listError || "Thêm thuốc bạn đang dùng để nhận nhắc nhở đúng giờ."}
              />
              {!listError ? (
                <Pressable accessibilityRole="button" onPress={openCreateForm} style={styles.emptyButton}>
                  <Plus size={18} color={colors.white} />
                  <AppText variant="bodyStrong" color={colors.white}>
                    Thêm thuốc đầu tiên
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          }
          ListFooterComponent={
            <Pagination
              pageNumber={pageInfo.pageNumber || pageNumber}
              totalPages={pageInfo.totalPages}
              totalCount={pageInfo.totalCount}
              pageSize={pageInfo.pageSize}
              loading={loading}
              onChange={setPageNumber}
            />
          }
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
          renderItem={({ item }) => (
            <MedicationListItem
              medication={item}
              removing={removingId === item.id}
              onEdit={() => openEditForm(item)}
              onRemove={() => handleRemove(item)}
            />
          )}
        />
      )}

      <MedicationFormSheet
        visible={formVisible}
        isEditing={Boolean(editingId)}
        form={form}
        errors={formErrors}
        submitting={submitting}
        onClose={closeForm}
        onSetField={setField}
        onAddReminderTime={addReminderTime}
        onRemoveReminderTime={removeReminderTime}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing["4xl"],
  },
  headerWrap: {
    gap: spacing.sm,
  },
  hero: {
    gap: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.limeDark,
    padding: spacing.md,
    ...shadows.soft,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  heroIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroBadge: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: spacing.md,
  },
  heroCopyWrap: {
    gap: spacing.xs,
  },
  heroTitle: {
    maxWidth: 300,
  },
  heroCopy: {
    maxWidth: 320,
  },
  heroSummary: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.13)",
    padding: spacing.sm,
  },
  summaryMain: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  summaryTime: {
    minWidth: 74,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.md,
  },
  heroStatRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.95)",
    overflow: "hidden",
  },
  heroStatItem: {
    flex: 1,
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: spacing.md,
  },
  heroDivider: {
    width: 1,
    marginVertical: spacing.sm,
    backgroundColor: "rgba(8,127,140,0.14)",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  reloadButton: {
    flex: 0.9,
  },
  addButton: {
    flex: 1.25,
    borderRadius: radius.pill,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
  },
  todayCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.2)",
    borderRadius: radius.xl,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.paper,
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  timeline: {
    gap: spacing.sm,
  },
  timelineItem: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: spacing.md,
  },
  timelineName: {
    flex: 1,
    textAlign: "right",
  },
  listHeadCard: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  listHeadIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
  },
  listHeadCopy: {
    flex: 1,
    minWidth: 0,
  },
  medicationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
    padding: spacing.md,
    ...shadows.soft,
  },
  medicationRowActive: {
    borderLeftWidth: 4,
    borderLeftColor: colors.teal,
  },
  medicationRowExpired: {
    borderLeftWidth: 4,
    borderLeftColor: colors.coral,
  },
  medicationRowIdle: {
    borderLeftWidth: 4,
    borderLeftColor: colors.lineStrong,
  },
  medicationIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
  },
  medicationMain: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  medicationTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  medicationTitle: {
    flex: 1,
    minWidth: 0,
  },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    flex: 1,
  },
  dosageText: {
    paddingTop: 1,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  timePills: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  timePill: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.sm,
  },
  timePillMuted: {
    minHeight: 28,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
    paddingHorizontal: spacing.sm,
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  iconAction: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  deleteAction: {
    borderColor: "rgba(180,35,24,0.18)",
    backgroundColor: colors.dangerBg,
  },
  disabled: {
    opacity: 0.5,
  },
  pagination: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  pageButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  pageButtonDisabled: {
    opacity: 0.42,
  },
  pageInfo: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  emptyWrap: {
    gap: spacing.md,
  },
  emptyButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.lg,
  },
});
