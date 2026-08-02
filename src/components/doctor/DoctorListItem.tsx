import { Image, Pressable, StyleSheet, View } from "react-native";
import { UserRound } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { Doctor } from "@/src/types/doctor";
import { getDoctorImageUrl, getDoctorName, getDoctorSpecialty } from "@/src/utils/doctorHelpers";

export function DoctorListItem({ doctor, onPress }: { doctor: Doctor; onPress: () => void }) {
  const imageUrl = getDoctorImageUrl(doctor);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.avatar}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.avatarImage} /> : <UserRound size={20} color={colors.teal} />}
      </View>
      <View style={styles.textGroup}>
        <AppText variant="bodyStrong">{getDoctorName(doctor)}</AppText>
        {doctor.academicTitle ? (
          <AppText variant="caption" color={colors.subtle}>
            {doctor.academicTitle}
          </AppText>
        ) : null}
        <AppText variant="caption" color={colors.muted}>
          {getDoctorSpecialty(doctor)}
          {doctor.yearsOfExperience ? ` · ${doctor.yearsOfExperience} năm kinh nghiệm` : ""}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.mint,
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  textGroup: {
    flex: 1,
    gap: spacing.xs / 2,
  },
});
