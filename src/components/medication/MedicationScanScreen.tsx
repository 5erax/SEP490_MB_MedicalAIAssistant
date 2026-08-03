// Ported from Web's MedicationScanPage.jsx — an intentional client-only
// preview stub, NOT a real recognition feature. Web never calls a backend
// here: it decodes the picked image only to show an on-device preview, and
// "Kiểm tra trạng thái nhận diện" always resolves (after a fake delay) to a
// fixed disclaimer saying the feature isn't implemented yet. Mobile mirrors
// this exact behavior — no OCR/recognition logic exists on Web to port.
import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Images, MapPin, ShieldAlert } from "lucide-react-native";

import { AppText, Button, Card, Screen } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import { ROUTES } from "@/src/navigation/routes";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type ScanStatus = "idle" | "scanning";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function MedicationScanScreen() {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanStep, setScanStep] = useState("");
  const [scanMessage, setScanMessage] = useState("");

  function acceptAsset(asset: ImagePicker.ImagePickerAsset) {
    setFileError("");
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      setPreviewUri(null);
      setFileError("Ảnh phải có dung lượng không vượt quá 10 MB.");
      return;
    }
    setPreviewUri(asset.uri);
    setScanStatus("idle");
    setScanStep("");
    setScanMessage("");
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFileError("Cần quyền truy cập ảnh để chọn ảnh xem trước.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    acceptAsset(result.assets[0]);
  }

  async function captureWithCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFileError("Cần quyền dùng camera để chụp ảnh xem trước.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    acceptAsset(result.assets[0]);
  }

  async function handleScan() {
    if (!previewUri) return;
    setScanStatus("scanning");
    setScanMessage("");
    setScanStep("Đang kiểm tra trạng thái dịch vụ nhận diện thuốc...");
    await delay(600);
    setScanStatus("idle");
    setScanStep("");
    setScanMessage(
      "Tính năng nhận diện thuốc đang được hoàn thiện. Ảnh của bạn chỉ được xem trước trên thiết bị và không được phân tích hoặc lưu.",
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.headerGroup}>
        <AppText variant="eyebrow" color={colors.teal}>
          Kiểm tra thuốc
        </AppText>
        <AppText variant="h1">Xem trước ảnh nhãn thuốc</AppText>
        <AppText color={colors.muted}>
          Chọn hoặc chụp ảnh nhãn thuốc để xem trước. Đây là bản xem trước tại chỗ, MediMate chưa nhận diện thuốc từ ảnh.
        </AppText>
      </View>

      <Card variant="hard" style={styles.previewCard}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Images size={28} color={colors.subtle} />
            <AppText variant="caption" color={colors.subtle} center>
              Chưa có ảnh nào được chọn
            </AppText>
          </View>
        )}

        <View style={styles.pickerActions}>
          <Button variant="secondary" onPress={pickFromLibrary} style={styles.pickerButton}>
            <View style={styles.pickerButtonInline}>
              <Images size={16} color={colors.ink} />
              <AppText variant="bodyStrong">Chọn từ thư viện</AppText>
            </View>
          </Button>
          <Button variant="secondary" onPress={captureWithCamera} style={styles.pickerButton}>
            <View style={styles.pickerButtonInline}>
              <Camera size={16} color={colors.ink} />
              <AppText variant="bodyStrong">Chụp ảnh</AppText>
            </View>
          </Button>
        </View>

        {fileError ? (
          <AppText color={colors.danger} variant="caption">
            {fileError}
          </AppText>
        ) : null}

        <Button fullWidth disabled={!previewUri || scanStatus === "scanning"} onPress={handleScan}>
          {scanStatus === "scanning" ? (
            <View style={styles.scanningInline}>
              <ActivityIndicator color={colors.ink} size="small" />
              <AppText variant="bodyStrong">{scanStep}</AppText>
            </View>
          ) : (
            "Kiểm tra trạng thái nhận diện"
          )}
        </Button>
      </Card>

      <Card variant="soft" style={styles.guidanceCard}>
        <View style={styles.guidanceHeader}>
          <View style={styles.iconMark}>
            <ShieldAlert size={20} color={colors.teal} />
          </View>
          <AppText variant="h3">{scanMessage ? "Chưa có kết quả phân tích thuốc" : "Về tính năng này"}</AppText>
        </View>
        <AppText color={colors.muted}>
          {scanMessage ||
            "Trang này không xác định tên thuốc, hoạt chất, liều dùng hay mức độ tương tác. Không dùng ảnh xem trước để tự quyết định cách sử dụng thuốc."}
        </AppText>
        <View style={styles.checklist}>
          <AppText variant="caption" color={colors.subtle}>
            • Ảnh chỉ được xử lý cục bộ để tạo bản xem trước.
          </AppText>
          <AppText variant="caption" color={colors.subtle}>
            • Không có dữ liệu thuốc mẫu được hiển thị như kết quả thật.
          </AppText>
          <AppText variant="caption" color={colors.subtle}>
            • Thông tin sử dụng thuốc cần được xác nhận với bác sĩ hoặc dược sĩ.
          </AppText>
        </View>
        <Button variant="secondary" onPress={() => router.push(ROUTES.PATIENT.MAP)}>
          <View style={styles.pickerButtonInline}>
            <MapPin size={16} color={colors.ink} />
            <AppText variant="bodyStrong">Tìm cơ sở y tế</AppText>
          </View>
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  headerGroup: {
    gap: spacing.sm,
  },
  previewCard: {
    gap: spacing.md,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
  },
  previewPlaceholder: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.lineStrong,
    backgroundColor: colors.paperSoft,
  },
  pickerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pickerButton: {
    flex: 1,
  },
  pickerButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  scanningInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  guidanceCard: {
    gap: spacing.md,
  },
  guidanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  checklist: {
    gap: spacing.xs,
  },
});
