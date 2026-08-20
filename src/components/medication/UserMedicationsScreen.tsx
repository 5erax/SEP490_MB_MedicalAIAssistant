// Ported from Web's UserMedicationsPage.jsx — real CRUD feature backed by
// /api/user-medications (access: "auth", not premium-gated on Web).
import { Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";

import { AppText, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useToast, useUserMedications } from "@/src/hooks";
import { UserMedication } from "@/src/types/medication";
import { MedicationCard } from "./MedicationCard";
import { MedicationFormSheet } from "./MedicationFormSheet";

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
    loadingDetailId,
    updatingReminderId,
    openCreateForm,
    openEditForm,
    closeForm,
    setField,
    addReminderTime,
    removeReminderTime,
    submit,
    remove,
    disableReminders,
  } = useUserMedications();

  async function handleSubmit() {
    const result = await submit();
    if (result === "success") {
      showToast({ type: "success", message: editingId ? "Đã cập nhật thông tin thuốc." : "Đã thêm thuốc mới." });
    }
  }

  function handleRemove(medication: UserMedication) {
    Alert.alert("Xoá thuốc này?", `"${medication.medicineName}" sẽ bị xoá khỏi danh sách và lịch nhắc.`, [
      { text: "Đóng", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          const result = await remove(medication.id);
          if (result === "success") {
            showToast({ type: "success", message: "Đã xoá thuốc." });
          }
        },
      },
    ]);
  }

  function handleDisableReminder(medication: UserMedication) {
    Alert.alert("Tắt lịch nhắc?", `Thông tin ${medication.medicineName} vẫn được giữ trong danh sách.`, [
      { text: "Đóng", style: "cancel" },
      {
        text: "Tắt lịch nhắc",
        onPress: async () => {
          const result = await disableReminders(medication);
          if (result === "success") showToast({ type: "success", message: "Đã tắt lịch nhắc thuốc." });
        },
      },
    ]);
  }

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="h2">Thuốc & lịch nhắc</AppText>
        <AppText variant="caption" color={colors.subtle}>
          {medications.length} loại thuốc đang theo dõi
        </AppText>
      </View>

      {loading && medications.length === 0 ? (
        <View style={styles.padded}>
          <SkeletonGroup lines={5} />
        </View>
      ) : listError && medications.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState title="Không tải được danh sách thuốc" description={listError} />
        </View>
      ) : medications.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState
            title="Chưa có thuốc nào"
            description="Thêm thuốc bạn đang dùng để nhận nhắc nhở đúng giờ."
          />
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(medication) => medication.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
          renderItem={({ item }) => (
            <MedicationCard
              medication={item}
              removing={removingId === item.id}
              loadingDetail={loadingDetailId === item.id}
              updatingReminder={updatingReminderId === item.id}
              onEdit={() => openEditForm(item)}
              onRemove={() => handleRemove(item)}
              onDisableReminder={() => handleDisableReminder(item)}
            />
          )}
        />
      )}

      <Pressable accessibilityRole="button" accessibilityLabel="Thêm thuốc" onPress={openCreateForm} style={styles.fab}>
        <Plus size={24} color={colors.white} />
      </Pressable>

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
  },
  header: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  padded: {
    padding: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["4xl"],
    gap: spacing.md,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.teal,
    backgroundColor: colors.teal,
    ...Platform.select({
      web: { boxShadow: "0 12px 20px rgba(8,127,140,0.24)" },
      default: { shadowColor: colors.teal, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.24, shadowRadius: 20, elevation: 5 },
    }),
  },
});
