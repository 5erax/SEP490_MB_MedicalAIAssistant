// Mobile version of Web's UserMedicationsPage: CRUD is backed by
// /api/user-medications, while reminder notifications are delivered by BE push.
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { BellRing, CalendarDays, Clock3, Pill, Plus, RefreshCw, ShieldCheck } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { MoreBackHeader } from "@/src/components/more";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
import { useToast, useUserMedications } from "@/src/hooks";
import { UserMedication } from "@/src/types/medication";
import { MedicationCard } from "./MedicationCard";
import { MedicationFormSheet } from "./MedicationFormSheet";

function getReminderTimes(medication: UserMedication) {
  return (medication.reminderTimes ?? [])
    .map((entry) => (entry?.timeOfDay ? String(entry.timeOfDay).slice(0, 5) : ""))
    .filter(Boolean)
    .sort();
}

function getNextReminder(medications: UserMedication[]) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const candidates = medications
    .filter((medication) => medication.isReminderEnabled)
    .flatMap((medication) =>
      getReminderTimes(medication).map((time) => {
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
    .filter((medication) => medication.isReminderEnabled)
    .flatMap((medication) =>
      getReminderTimes(medication).map((time) => ({
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
  loading,
  listError,
  onReload,
  onCreate,
}: {
  medications: UserMedication[];
  loading: boolean;
  listError: string;
  onReload: () => void;
  onCreate: () => void;
}) {
  const enabledCount = medications.filter((medication) => medication.isReminderEnabled).length;
  const reminderCount = medications.reduce((total, medication) => total + getReminderTimes(medication).length, 0);
  const nextReminder = getNextReminder(medications);
  const todayReminderTimes = getTodayReminderTimes(medications);

  return (
    <View style={styles.headerWrap}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Pill size={22} color={colors.white} />
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
              Nhắc gần nhất
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

      <View style={styles.statGrid}>
        <View style={styles.statTile}>
          <AppText variant="h3">{medications.length}</AppText>
          <AppText variant="caption" color={colors.muted}>
            Thuốc
          </AppText>
        </View>
        <View style={styles.statTile}>
          <AppText variant="h3">{enabledCount}</AppText>
          <AppText variant="caption" color={colors.muted}>
            Đang nhắc
          </AppText>
        </View>
        <View style={styles.statTile}>
          <AppText variant="h3">{reminderCount}</AppText>
          <AppText variant="caption" color={colors.muted}>
            Mốc giờ
          </AppText>
        </View>
      </View>

      <View style={styles.notice}>
        <ShieldCheck size={17} color={colors.teal} />
        <AppText variant="caption" color={colors.muted} style={styles.noticeText}>
          Lịch nhắc dựa trên thông tin bạn đã cung cấp. MediMate không kê đơn hoặc xác minh chỉ định dùng thuốc.
        </AppText>
      </View>

      <View style={styles.todayCard}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIcon}>
            <CalendarDays size={18} color={colors.teal} />
          </View>
          <View style={styles.sectionCopy}>
            <AppText variant="bodyStrong">Lịch uống hôm nay</AppText>
            <AppText variant="caption" color={colors.subtle}>
              {todayReminderTimes.length ? "Các mốc nhắc đang bật" : "Bật nhắc trong form thuốc để hiện lịch hôm nay"}
            </AppText>
          </View>
        </View>

        {todayReminderTimes.length ? (
          <View style={styles.timeline}>
            {todayReminderTimes.map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineCopy}>
                  <AppText variant="bodyStrong">{item.time}</AppText>
                  <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                    {item.name}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.listHead}>
        <AppText variant="h3">Thuốc đang dùng</AppText>
        <AppText variant="caption" color={colors.subtle}>
          {listError ? "Kiểm tra kết nối rồi tải lại danh sách." : "Chạm Sửa để thay đổi ngày dùng và giờ nhắc."}
        </AppText>
      </View>
    </View>
  );
}

export function UserMedicationsScreen() {
  const { showToast } = useToast();
  const {
    medications,
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
          <SkeletonGroup lines={5} />
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
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
          renderItem={({ item }) => (
            <MedicationCard
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
    paddingTop: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  headerWrap: {
    gap: spacing.md,
  },
  hero: {
    gap: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.limeDark,
    padding: spacing.lg,
    ...shadows.soft,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  heroIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroBadge: {
    minHeight: 31,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: spacing.md,
  },
  heroCopyWrap: {
    gap: spacing.sm,
  },
  heroTitle: {
    maxWidth: 300,
  },
  heroCopy: {
    maxWidth: 320,
  },
  heroSummary: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.13)",
    padding: spacing.md,
  },
  summaryMain: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  summaryTime: {
    minWidth: 76,
    minHeight: 40,
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
  statGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    minHeight: 72,
    justifyContent: "center",
    gap: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
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
    gap: spacing.md,
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
    width: 44,
    height: 44,
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
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: spacing.md,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  timelineCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  listHead: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
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
