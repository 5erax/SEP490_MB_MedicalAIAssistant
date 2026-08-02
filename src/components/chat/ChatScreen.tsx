// Ported from src/pages/ChatbotPage.jsx (Web) — authenticated free-form AI
// chat, gated by PremiumGate (route access:"premium" on Web). Facility-
// scoped consultation (Web's MapConsultationAssistant, embedded in the map
// page) is intentionally not included — see docs/mobile-progress.md.
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Bot, Camera, MapPin, Send, ShieldCheck, Stethoscope, Trash2 } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";
import { webChatbotService } from "@/src/services/domainServices";
import { ChatMessage } from "@/src/types/chat";
import { ChatMessageBubble, TypingBubble } from "./ChatMessageBubble";
import { WelcomePrompts } from "./WelcomePrompts";

let messageIdCounter = 0;
function nextMessageId() {
  messageIdCounter += 1;
  return `message-${messageIdCounter}`;
}

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  function addFallbackReply() {
    setMessages((current) => [
      ...current,
      {
        id: nextMessageId(),
        role: "assistant",
        content:
          "Xin lỗi, không thể kết nối với trợ lý lúc này. Bạn có thể thử lại sau hoặc mô tả triệu chứng trong phần tư vấn chuyên khoa.",
        timestamp: new Date(),
      },
    ]);
  }

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { id: nextMessageId(), role: "user", content: text, timestamp: new Date() };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await webChatbotService.message(text, true);
      const data = response as { data?: { answer?: string }; message?: string };
      const aiText = data.data?.answer || data.message || "Xin lỗi, có lỗi xảy ra.";
      setMessages((current) => [...current, { id: nextMessageId(), role: "assistant", content: aiText, timestamp: new Date() }]);
    } catch {
      addFallbackReply();
    } finally {
      setLoading(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }

  function confirmClear() {
    if (messages.length === 0) return;
    Alert.alert("Xóa hội thoại", "Thao tác này chỉ xóa hội thoại trên màn hình hiện tại và không thể hoàn tác.", [
      { text: "Giữ lại", style: "cancel" },
      { text: "Xóa hội thoại", style: "destructive", onPress: () => setMessages([]) },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.replace(ROUTES.PATIENT.HOME)} style={styles.iconButton}>
          <ArrowLeft size={19} color={colors.ink} />
        </Pressable>
        <View style={styles.brandMark}>
          <Bot size={20} color={colors.teal} />
        </View>
        <View style={styles.headingGroup}>
          <AppText variant="eyebrow" color={colors.limeDark}>
            Trợ lý sức khỏe
          </AppText>
          <AppText variant="bodyStrong">MediMate AI</AppText>
        </View>
        {messages.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Xóa hội thoại" onPress={confirmClear} style={styles.iconButton}>
            <Trash2 size={18} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.scopeNote}>
        <ShieldCheck size={15} color={colors.warning} />
        <AppText variant="caption" color={colors.warning} style={styles.scopeNoteText}>
          Nội dung AI chỉ để tham khảo, không phải chẩn đoán và không thay thế bác sĩ.
        </AppText>
      </View>

      {messages.length === 0 ? (
        <View style={styles.welcomeArea}>
          <View style={styles.welcomeIntro}>
            <AppText variant="h2">Bạn đang cần tìm hiểu điều gì?</AppText>
            <AppText color={colors.muted}>
              Mô tả điều bạn đang gặp hoặc chọn một chủ đề bên dưới. Hãy tránh nhập thông tin nhận dạng cá nhân không cần thiết.
            </AppText>
          </View>
          <WelcomePrompts onSelect={(prompt) => handleSend(prompt)} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => <ChatMessageBubble message={item} />}
          ListFooterComponent={loading ? <TypingBubble /> : null}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.composer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở công cụ nhận diện thuốc"
          onPress={() => router.push(ROUTES.PATIENT.MEDICATION as never)}
          style={styles.iconButton}
        >
          <Camera size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.inputShell}>
          <AppText
            accessibilityRole="text"
            style={styles.hiddenLabel}
          >
            Nội dung cần hỏi
          </AppText>
          <View style={styles.textInputWrap}>
            <TextInputMultiline value={input} onChangeText={setInput} onSubmit={() => handleSend()} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gửi"
          disabled={!input.trim() || loading}
          onPress={() => handleSend()}
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
        >
          {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Send size={18} color={colors.white} />}
        </Pressable>
      </View>

      <View style={styles.shortcutRow}>
        <Pressable accessibilityRole="button" onPress={() => router.replace(ROUTES.PATIENT.HOME)} style={styles.shortcutChip}>
          <Stethoscope size={14} color={colors.teal} />
          <AppText variant="caption" color={colors.teal}>
            Tư vấn chuyên khoa
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push(ROUTES.PATIENT.MAP)} style={styles.shortcutChip}>
          <MapPin size={14} color={colors.teal} />
          <AppText variant="caption" color={colors.teal}>
            Tìm cơ sở y tế
          </AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// Isolated so the growing textarea (RN TextInput multiline) can manage its
// own local uncontrolled height without re-rendering the whole screen.
function TextInputMultiline({
  value,
  onChangeText,
  onSubmit,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Mô tả triệu chứng hoặc đặt câu hỏi…"
      placeholderTextColor={colors.subtle}
      multiline
      style={styles.textInput}
      onSubmitEditing={onSubmit}
      blurOnSubmit={false}
    />
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.paper,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  brandMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  headingGroup: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  scopeNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.warningBg,
  },
  scopeNoteText: {
    flex: 1,
  },
  welcomeArea: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  welcomeIntro: {
    gap: spacing.sm,
  },
  messageList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  inputShell: {
    flex: 1,
  },
  hiddenLabel: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },
  textInputWrap: {
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    paddingHorizontal: spacing.md,
  },
  textInput: {
    maxHeight: 112,
    minHeight: 44,
    paddingVertical: spacing.sm,
    color: colors.ink,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.teal,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  shortcutRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  shortcutChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
