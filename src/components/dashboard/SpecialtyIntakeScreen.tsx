// Ported from src/pages/DashboardPage.jsx (Web) — "Tư vấn chuyên khoa".
//
// Deliberate Mobile UX adaptation (flow/data unchanged): on Web, submitting
// the last answer immediately navigates away to /map, so the inline result
// panel is rarely actually seen. On mobile we show the result panel first
// and let the user explicitly tap "Mở bản đồ" — avoids a jarring
// auto-navigation and matches standard mobile UX (confirm before leaving
// the current flow). The destination (Nearby Clinics/Map, same query
// params: source/facilityId/departmentId/sessionId) is unchanged.
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { History } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useSymptomIntake } from "@/src/hooks/useSymptomIntake";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { useAuth } from "@/src/providers";
import { shouldSetupPatientProfile } from "@/src/utils/roles";
import { getFacilityId, getRecommendedDepartment } from "@/src/utils/facilityRanking";
import { ClinicalAnalysisResult, SymptomAnalysisSession } from "@/src/types/symptomAnalysis";
import { symptomAnalysisApi } from "@/src/services/symptomAnalysisService";
import { IntakeForm } from "./IntakeForm";
import { dismissProfileNudgeForSession, isProfileNudgeDismissed, ProfileNudgeCard } from "./ProfileNudgeCard";
import { QuestionFlow } from "./QuestionFlow";
import { ResultPanel } from "./ResultPanel";

const STEP_LABELS = ["Mô tả", "Làm rõ", "Kết quả"];
const SEGMENT_WIDTH = 112;

function getSessionTitle(session: SymptomAnalysisSession, fallback: string) {
  return session.inputText || session.userInput || session.symptoms || fallback;
}

function formatHistoryDate(value?: string) {
  if (!value) return "Chưa có ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có ngày";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function openFacilities(result: ClinicalAnalysisResult | null, sessionId: string) {
  const department = getRecommendedDepartment(result);
  const topFacility = result?.recommendedFacilities?.[0] ?? null;
  const facilityId = getFacilityId(topFacility);

  router.push({
    pathname: "/(patient)/map" as never,
    params: {
      source: "clinical",
      ...(facilityId ? { facilityId } : {}),
      ...(department?.departmentId ? { departmentId: department.departmentId } : {}),
      ...(sessionId ? { sessionId } : {}),
    },
  });
}

export function SpecialtyIntakeScreen() {
  const { session } = useAuth();
  const {
    answeredCount,
    answers,
    canSubmitAnswers,
    currentQuestionIndex,
    error,
    input,
    loading,
    questions,
    resetDiagnosis,
    result,
    sessionId,
    setCurrentQuestionIndex,
    setInput,
    startDiagnosis,
    status,
    submitAnswers,
    updateAnswer,
  } = useSymptomIntake();

  const { userLocation, locationStatus, requestUserLocation } = useUserLocation();
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [historySessions, setHistorySessions] = useState<SymptomAnalysisSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [profileNudgeVisible, setProfileNudgeVisible] = useState(
    shouldSetupPatientProfile(session) && !isProfileNudgeDismissed(),
  );
  const segmentTranslate = useRef(new Animated.Value(0)).current;
  const historyLoadedRef = useRef(false);

  const showIntakeForm = ["idle", "loading-questions", "no-questions"].includes(status);
  const showQuestionFlow = ["questions", "submitting"].includes(status) && questions[currentQuestionIndex];
  const activeStep = status === "result" ? 2 : ["questions", "submitting"].includes(status) ? 1 : 0;

  useEffect(() => {
    if (status !== "result") return;
    // Once the user has seen the result inline (see module note above), the
    // Web behavior of jumping straight to the map is offered as an explicit
    // action instead — nothing to auto-run here.
  }, [status]);

  const loadHistory = useCallback(async () => {
    historyLoadedRef.current = true;
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const sessions = await symptomAnalysisApi.listAllMySessions("department");
      setHistorySessions(sessions);
    } catch (requestError) {
      setHistoryError((requestError as Error)?.message || "Chưa thể tải lịch sử gợi ý.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    Animated.spring(segmentTranslate, {
      toValue: activeTab === "chat" ? 0 : SEGMENT_WIDTH,
      useNativeDriver: true,
      tension: 110,
      friction: 12,
    }).start();
    if (activeTab === "history" && !historyLoadedRef.current && !historyLoading) {
      loadHistory();
    }
  }, [activeTab, historyLoading, loadHistory, segmentTranslate]);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      {showIntakeForm && profileNudgeVisible ? (
        <ProfileNudgeCard
          onDismiss={() => {
            dismissProfileNudgeForSession();
            setProfileNudgeVisible(false);
          }}
        />
      ) : null}

      <View style={styles.segmentedControl}>
        <Animated.View style={[styles.segmentIndicator, { transform: [{ translateX: segmentTranslate }] }]} />
        <Pressable accessibilityRole="button" onPress={() => setActiveTab("chat")} style={styles.segmentItem}>
          <AppText variant="bodyStrong" color={colors.ink}>
            Trò chuyện
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setActiveTab("history")} style={({ pressed }) => [styles.segmentItem, pressed && styles.pressed]}>
          <History size={15} color={colors.ink} />
          <AppText variant="bodyStrong" color={colors.ink}>
            Lịch sử
          </AppText>
        </Pressable>
      </View>

      {activeTab === "history" ? (
        <View style={styles.historyStrip}>
          {historyLoading ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator color={colors.teal} size="small" />
              <AppText variant="caption" color={colors.muted}>
                Đang tải lịch sử...
              </AppText>
            </View>
          ) : historyError ? (
            <Pressable accessibilityRole="button" onPress={loadHistory} style={styles.historyMessage}>
              <AppText variant="caption" color={colors.danger}>
                {historyError}
              </AppText>
            </Pressable>
          ) : historySessions.length === 0 ? (
            <View style={styles.historyMessage}>
              <AppText variant="caption" color={colors.muted}>
                Chưa có phiên gợi ý chuyên khoa.
              </AppText>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
              {historySessions.map((item, index) => (
                <View key={item.sessionId || item.id || String(index)} style={styles.historyCard}>
                  <AppText variant="bodyStrong" numberOfLines={2}>
                    {getSessionTitle(item, "Phiên gợi ý chuyên khoa")}
                  </AppText>
                  <AppText variant="caption" color={colors.subtle}>
                    {formatHistoryDate(item.createdAt || item.createdDate)}
                  </AppText>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {activeTab === "chat" && !showIntakeForm ? (
        <View style={styles.flowCard}>
          <View style={styles.stepper}>
            {STEP_LABELS.map((label, index) => (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    index === activeStep && styles.stepDotActive,
                    index < activeStep && styles.stepDotComplete,
                  ]}
                >
                  <AppText variant="caption" color={index <= activeStep ? colors.white : colors.subtle}>
                    {index + 1}
                  </AppText>
                </View>
                <AppText variant="caption" color={index === activeStep ? colors.ink : colors.subtle}>
                  {label}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {activeTab === "chat" && showIntakeForm ? (
        <IntakeForm input={input} onChangeInput={setInput} loading={loading} onSubmit={() => startDiagnosis()} />
      ) : null}

      {activeTab === "chat" && status === "loading-questions" ? (
        <View style={styles.skeletonCard}>
          <SkeletonGroup lines={4} />
        </View>
      ) : null}

      {activeTab === "chat" && error ? (
        <View style={styles.errorGroup}>
          <EmptyState title="Không thể kết nối dịch vụ gợi ý chuyên khoa" description={error} />
          <View style={styles.recoveryActions}>
            <Button variant="secondary" onPress={() => resetDiagnosis()}>
              Quay lại biểu mẫu
            </Button>
            <Button onPress={() => startDiagnosis()}>Thử lại</Button>
          </View>
        </View>
      ) : null}

      {activeTab === "chat" && status === "no-questions" ? (
        <View style={styles.errorGroup}>
          <EmptyState
            title="AI chưa có câu hỏi phù hợp"
            description="Hãy mô tả rõ hơn về thời gian xuất hiện, vị trí đau, mức độ và triệu chứng đi kèm."
          />
          <View style={styles.recoveryActions}>
            <Button variant="secondary" onPress={() => resetDiagnosis()}>
              Quay lại biểu mẫu
            </Button>
            <Button onPress={() => startDiagnosis()}>Thử lại với mô tả hiện tại</Button>
          </View>
        </View>
      ) : null}

      {activeTab === "chat" && showQuestionFlow ? (
        <QuestionFlow
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          answeredCount={answeredCount}
          submitting={status === "submitting"}
          canSubmitAnswers={canSubmitAnswers}
          onAnswerChange={updateAnswer}
          onPrevious={() => setCurrentQuestionIndex((index: number) => Math.max(0, index - 1))}
          onNext={() => setCurrentQuestionIndex((index: number) => Math.min(questions.length - 1, index + 1))}
          onSubmit={submitAnswers}
          onReset={() => resetDiagnosis()}
        />
      ) : null}

      {activeTab === "chat" && status === "result" ? (
        <ResultPanel
          result={result}
          userLocation={userLocation}
          locationStatus={locationStatus}
          onRequestLocation={requestUserLocation}
          onOpenMap={() => openFacilities(result, sessionId)}
          onNewSymptom={() => resetDiagnosis({ clearInput: true })}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  segmentedControl: {
    alignSelf: "center",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    padding: spacing.xs,
    position: "relative",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  segmentIndicator: {
    position: "absolute",
    left: spacing.xs,
    top: spacing.xs,
    width: SEGMENT_WIDTH,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 1,
  },
  segmentItem: {
    minHeight: 38,
    width: SEGMENT_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  historyStrip: {
    minHeight: 96,
    justifyContent: "center",
  },
  historyLoading: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  historyMessage: {
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
  },
  historyList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  historyCard: {
    width: 188,
    minHeight: 82,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  flowCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.84)",
    padding: spacing.md,
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  stepItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.line,
  },
  stepDotActive: {
    backgroundColor: colors.teal,
  },
  stepDotComplete: {
    backgroundColor: colors.teal,
  },
  skeletonCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.xl,
  },
  errorGroup: {
    gap: spacing.md,
  },
  recoveryActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
