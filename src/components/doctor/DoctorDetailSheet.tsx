// Ported from the doctor-detail sidebar view in Web's NearbyClinicPage.jsx
// (sidebarView === "doctor-detail"). Web's booking button is a static
// disabled "Chưa hỗ trợ đặt lịch" — mobile keeps the same unavailable
// state but makes it tappable (see AppointmentUnavailableSheet, Module 7)
// since a silently inert button reads poorly on touch UIs.
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CalendarClock, Stethoscope, Star, UserRound, X } from "lucide-react-native";

import { AppText, Button } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { Doctor } from "@/src/types/doctor";
import { getDoctorImageUrl, getDoctorName, getDoctorRoleLabel, getDoctorSpecialty } from "@/src/utils/doctorHelpers";
import { AppointmentUnavailableSheet } from "@/src/components/appointment";

type DoctorDetailSheetProps = {
  doctor: Doctor | null;
  facilityName: string;
  facilityPhone?: string;
  visible: boolean;
  onClose: () => void;
};

export function DoctorDetailSheet({ doctor, facilityName, facilityPhone, visible, onClose }: DoctorDetailSheetProps) {
  const [bookingSheetVisible, setBookingSheetVisible] = useState(false);
  if (!doctor) return null;
  const imageUrl = getDoctorImageUrl(doctor);
  const roleLabel = getDoctorRoleLabel(doctor);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <AppText variant="h3" style={styles.headerTitle}>
            Thông tin bác sĩ
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.avatarImage} /> : <UserRound size={34} color={colors.teal} />}
            </View>
            <View style={styles.profileText}>
              <AppText variant="h2">{getDoctorName(doctor)}</AppText>
              <AppText color={colors.muted}>{doctor.academicTitle || "Chưa cập nhật học hàm/học vị"}</AppText>
            </View>
          </View>

          <View style={styles.quickRow}>
            <View style={styles.quickItem}>
              <Stethoscope size={17} color={colors.teal} />
              <AppText color={colors.muted}>{getDoctorSpecialty(doctor)}</AppText>
            </View>
            {doctor.yearsOfExperience ? (
              <View style={styles.quickItem}>
                <Star size={17} color={colors.amber} />
                <AppText color={colors.muted}>{doctor.yearsOfExperience} năm kinh nghiệm</AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <AppText variant="caption" color={colors.subtle}>
                Cơ sở
              </AppText>
              <AppText variant="bodyStrong">{facilityName}</AppText>
            </View>
            <View style={styles.infoRow}>
              <AppText variant="caption" color={colors.subtle}>
                Chuyên khoa
              </AppText>
              <AppText variant="bodyStrong">{getDoctorSpecialty(doctor)}</AppText>
            </View>
            {roleLabel ? (
              <View style={styles.infoRow}>
                <AppText variant="caption" color={colors.subtle}>
                  Vai trò
                </AppText>
                <AppText variant="bodyStrong">{roleLabel}</AppText>
              </View>
            ) : null}
            {doctor.yearsOfExperience ? (
              <View style={styles.infoRow}>
                <AppText variant="caption" color={colors.subtle}>
                  Kinh nghiệm
                </AppText>
                <AppText variant="bodyStrong">{doctor.yearsOfExperience} năm</AppText>
              </View>
            ) : null}
          </View>

          <Button variant="secondary" fullWidth onPress={() => setBookingSheetVisible(true)} style={styles.bookingButton}>
            <View style={styles.bookingButtonInline}>
              <CalendarClock size={17} color={colors.ink} />
              <AppText variant="bodyStrong">Đặt lịch khám</AppText>
            </View>
          </Button>
        </ScrollView>
      </View>

      <AppointmentUnavailableSheet
        visible={bookingSheetVisible}
        onClose={() => setBookingSheetVisible(false)}
        facilityPhone={facilityPhone}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  avatar: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.mint,
    overflow: "hidden",
  },
  avatarImage: {
    width: 76,
    height: 76,
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
  },
  quickRow: {
    gap: spacing.sm,
  },
  quickItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoList: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  bookingButton: {
    marginTop: spacing.sm,
  },
  bookingButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
