import { StyleSheet, View } from "react-native";
import { Bot } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ChatMessage } from "@/src/types/chat";

function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser ? (
        <View style={styles.avatar}>
          <Bot size={16} color={colors.teal} />
        </View>
      ) : null}
      <View style={styles.contentGroup}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <AppText color={isUser ? colors.white : colors.ink} style={styles.text}>
            {message.content}
          </AppText>
          {!isUser ? (
            <AppText variant="caption" color={colors.subtle} style={styles.footnote}>
              Thông tin tham khảo. Hãy liên hệ cơ sở y tế nếu triệu chứng nặng, kéo dài hoặc khiến bạn lo lắng.
            </AppText>
          ) : null}
        </View>
        <AppText variant="caption" color={colors.subtle} style={isUser ? styles.timeUser : undefined}>
          {formatTime(message.timestamp)}
        </AppText>
      </View>
    </View>
  );
}

export function TypingBubble() {
  return (
    <View style={[styles.row, styles.rowAssistant]}>
      <View style={styles.avatar}>
        <Bot size={16} color={colors.teal} />
      </View>
      <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
        <AppText color={colors.subtle}>Đang soạn phản hồi...</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    maxWidth: "88%",
  },
  rowUser: {
    alignSelf: "flex-end",
  },
  rowAssistant: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.mint,
  },
  contentGroup: {
    flexShrink: 1,
    gap: spacing.xs / 2,
  },
  bubble: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bubbleAssistant: {
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
    borderTopRightRadius: 4,
  },
  text: {
    lineHeight: 21,
  },
  footnote: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  timeUser: {
    textAlign: "right",
  },
  typingBubble: {
    minWidth: 96,
  },
});
