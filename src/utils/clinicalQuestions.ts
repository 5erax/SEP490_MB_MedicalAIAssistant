// Ported 1:1 from src/services/symptomAnalysisService.js (Web) — this is the
// most business-logic-heavy piece of the app: it infers whether a
// backend-provided clinical question should render as a binary Có/Không
// choice vs. a multi-option/boolean-list UI, and does on-the-fly EN->VI
// translation when the backend doesn't supply questionVi. Any deviation
// here changes which questions render as binary vs. multi-choice and can
// corrupt submitted answers — do not "clean up" this logic independently
// of the Web source.
import { AnswerValue, ClinicalAnswerItem, ClinicalQuestion } from "@/src/types/symptomAnalysis";

const FALLBACK_ANSWER_OPTIONS: [string, string][] = [
  ["yes", "Có"],
  ["no", "Không"],
];

const BOOLEAN_CHOICE_PREFIX = "__medimate_boolean_choice__";

const CLINICAL_TRANSLATIONS = new Map<string, string>([
  [
    "do you have a persistent high fever that does not improve after taking fever-reducing medicine?",
    "Bạn có bị sốt cao kéo dài hoặc sốt không giảm sau khi dùng thuốc hạ sốt không?",
  ],
  ["do you have chest pain?", "Bạn có đau ngực không?"],
  ["do you have chest pain during exertion?", "Bạn có đau ngực khi gắng sức không?"],
  ["do you have shortness of breath?", "Bạn có khó thở không?"],
  ["do you have severe headache?", "Bạn có đau đầu dữ dội không?"],
  ["do you feel dizzy?", "Bạn có chóng mặt không?"],
  ["do you have nausea or vomiting?", "Bạn có buồn nôn hoặc nôn không?"],
  ["do you have abdominal pain?", "Bạn có đau bụng không?"],
  ["do you have a cough?", "Bạn có ho không?"],
  ["do you have a fever?", "Bạn có sốt không?"],
]);

const CLINICAL_PHRASES: [string, string][] = [
  ["persistent high fever", "sốt cao kéo dài"],
  ["does not improve after taking fever-reducing medicine", "không giảm sau khi dùng thuốc hạ sốt"],
  ["fever-reducing medicine", "thuốc hạ sốt"],
  ["shortness of breath", "khó thở"],
  ["chest pain", "đau ngực"],
  ["during exertion", "khi gắng sức"],
  ["severe headache", "đau đầu dữ dội"],
  ["headache", "đau đầu"],
  ["dizziness", "chóng mặt"],
  ["dizzy", "chóng mặt"],
  ["nausea", "buồn nôn"],
  ["vomiting", "nôn"],
  ["abdominal pain", "đau bụng"],
  ["cough", "ho"],
  ["fever", "sốt"],
  ["rash", "phát ban"],
  ["swelling", "sưng"],
  ["bleeding", "chảy máu"],
  ["weakness", "yếu"],
  ["numbness", "tê bì"],
  ["pain", "đau"],
];

function normalizeText(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeLookup(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizeForMatch(value: unknown) {
  return normalizeLookup(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

function hasVietnameseText(value: unknown) {
  return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
    String(value ?? ""),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looksLikeAffirmative(value: unknown) {
  const text = normalizeForMatch(value);
  return /\b(yes|true|co|dong y|1)\b/.test(text);
}

function looksLikeNegative(value: unknown) {
  const text = normalizeForMatch(value);
  return /\b(no|false|khong|0)\b/.test(text);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function makeBooleanChoiceKey(sourceKey: string, value: boolean) {
  return `${BOOLEAN_CHOICE_PREFIX}:${value ? "true" : "false"}:${encodeURIComponent(sourceKey)}`;
}

function parseBooleanChoiceKey(value: unknown) {
  const text = normalizeText(value);
  const prefix = `${BOOLEAN_CHOICE_PREFIX}:`;

  if (!text.startsWith(prefix)) return null;

  const [, booleanText, ...encodedKeyParts] = text.split(":");
  const encodedKey = encodedKeyParts.join(":");

  if (!["true", "false"].includes(booleanText) || !encodedKey) return null;

  try {
    return {
      sourceKey: decodeURIComponent(encodedKey),
      value: booleanText === "true",
    };
  } catch {
    return null;
  }
}

function areYesNoOptions(options: [string, string][]) {
  if (options.length !== 2) return false;

  const normalized = options.map(([key, label]) => `${key} ${label}`);
  return normalized.some(looksLikeAffirmative) && normalized.some(looksLikeNegative);
}

function getQuestionId(question: ClinicalQuestion | string, index = 0) {
  if (typeof question === "string") return `question-${index + 1}`;

  return (
    (question.questionId as string | undefined)
    ?? (question.id as string | undefined)
    ?? (question.code as string | undefined)
    ?? `question-${index + 1}`
  );
}

function getRawAnswerEntries(question: ClinicalQuestion): [string, string][] {
  const answers = question?.answers;
  if (!isPlainObject(answers)) return [];

  return Object.entries(answers)
    .map(([key, label]): [string, string] => {
      const answerKey = normalizeText(key);
      const answerValue = normalizeText(label || key);
      const shouldDisplayKey = hasVietnameseText(answerKey) || answerKey.length > 20;

      return [answerKey, shouldDisplayKey ? answerKey : answerValue];
    })
    .filter(([key]) => Boolean(key));
}

function getPayloadAnswerOptions(question: ClinicalQuestion) {
  const rawEntries = getRawAnswerEntries(question);
  return rawEntries.length > 0 ? rawEntries : FALLBACK_ANSWER_OPTIONS;
}

function normalizeAnswerLabel(key: string, label: string, index: number) {
  const source = normalizeText(label || key);

  // Ưu tiên tuyệt đối label tiếng Việt backend trả về.
  if (hasVietnameseText(source)) return source;

  const combined = `${key} ${source}`;

  if (looksLikeAffirmative(combined)) return "Có";
  if (looksLikeNegative(combined)) return "Không";

  if (index === 0 && looksLikeAffirmative(source)) return "Có";
  if (index === 1 && looksLikeNegative(source)) return "Không";

  return translateClinicalText(source);
}

function shouldRenderSingleBackendPromptAsYesNo(entries: [string, string][]) {
  if (entries.length !== 1) return false;

  const [key, label] = entries[0];
  const source = normalizeText(label || key);
  const keyText = normalizeText(key);
  const combined = `${keyText} ${source}`;

  if (looksLikeAffirmative(combined) || looksLikeNegative(combined)) return false;

  return (
    source.length > 20
    || keyText.length > 20
    || /[?？]$/.test(source)
    || /[?？]$/.test(keyText)
    || /^do you|^are you|^have you/i.test(source)
    || /^do you|^are you|^have you/i.test(keyText)
  );
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item)).filter(Boolean);
}

function getOriginalQuestionText(
  question: ClinicalQuestion,
  hasQuestionVi: boolean,
  rawQuestionText: string,
  translatedText: string,
) {
  if (hasQuestionVi) {
    const possibleOriginal = normalizeText(
      (question.englishPrefix as string | undefined)
        || question.questionText
        || (question.text as string | undefined)
        || (question.content as string | undefined)
        || "",
    );

    if (!possibleOriginal) return "";
    if (possibleOriginal === normalizeText(question.questionVi)) return "";
    if (hasVietnameseText(possibleOriginal)) return "";

    return possibleOriginal;
  }

  if (!hasVietnameseText(rawQuestionText) && translatedText !== rawQuestionText) {
    return rawQuestionText;
  }

  return "";
}

export function unwrapApiData<T = unknown>(response: unknown): T {
  const withData = response as { data?: { data?: T } & T } | undefined;
  return (withData?.data?.data ?? withData?.data ?? response) as T;
}

export function translateClinicalText(value: unknown): string {
  const text = normalizeText(value);
  if (!text || hasVietnameseText(text)) return text;

  const exact = CLINICAL_TRANSLATIONS.get(normalizeLookup(text));
  if (exact) return exact;

  let translated = text
    .replace(/^do you have\s+/i, "Bạn có ")
    .replace(/^are you experiencing\s+/i, "Bạn có đang bị ")
    .replace(/^have you experienced\s+/i, "Bạn từng bị ")
    .replace(/\?$/, "");

  CLINICAL_PHRASES.forEach(([english, vietnamese]) => {
    translated = translated.replace(new RegExp(`\\b${escapeRegExp(english)}\\b`, "gi"), vietnamese);
  });

  if (translated !== text) {
    const needsQuestion = /^Bạn\b/i.test(translated) && !/[?？]$/.test(translated);
    return `${translated}${needsQuestion ? " không?" : ""}`;
  }

  return text;
}

export function normalizeClinicalQuestion(question: unknown, index = 0): ClinicalQuestion {
  if (typeof question === "string") {
    const questionText = translateClinicalText(question);

    return {
      questionId: getQuestionId(question, index),
      questionText,
      questionVi: questionText,
      questionOriginalText: questionText === question ? "" : question,
      chapterId: "",
      chapterCode: "",
      totalScore: 0,
      matchedKeywords: [],
      answers: {},
    };
  }

  const source = (question ?? {}) as ClinicalQuestion;
  const hasQuestionVi = Boolean(normalizeText(source.questionVi));

  const rawQuestionText = normalizeText(
    source.questionVi
      || source.questionText
      || source.text
      || source.content
      || `Câu hỏi lâm sàng ${index + 1}`,
  );

  const translatedText = hasQuestionVi
    ? normalizeText(source.questionVi)
    : translateClinicalText(rawQuestionText);

  return {
    ...source,
    questionId: getQuestionId(source, index),
    questionText: translatedText,
    questionVi: source.questionVi || translatedText,
    questionOriginalText: getOriginalQuestionText(source, hasQuestionVi, rawQuestionText, translatedText),
    chapterId: (source.chapterId as string) || "",
    chapterCode: (source.chapterCode as string) || "",
    totalScore: Number.isFinite(Number(source.totalScore)) ? Number(source.totalScore) : 0,
    matchedKeywords: normalizeStringList(source.matchedKeywords),
    answers: isPlainObject(source.answers) ? source.answers : {},
  };
}

export function readSuggestClinicalQuestionsPayload(response: unknown) {
  const data = (unwrapApiData<{ sessionId?: string; questions?: unknown[] }>(response)) ?? {};
  const rawQuestions = Array.isArray(data.questions) ? data.questions : [];

  return {
    sessionId: data.sessionId || "",
    questions: rawQuestions.map((question, index) => normalizeClinicalQuestion(question, index)),
  };
}

export function readAnalysisPayload(response: unknown) {
  const data = unwrapApiData<Record<string, unknown>>(response);
  return data?.analysis ?? data?.result ?? data ?? null;
}

export function getClinicalQuestionAnswerOptions(question: ClinicalQuestion): [string, string][] {
  const entries = getRawAnswerEntries(question);

  if (entries.length > 1) {
    return entries.map(([key, label], index) => [key, normalizeAnswerLabel(key, label, index)]);
  }

  if (shouldRenderSingleBackendPromptAsYesNo(entries)) {
    const [sourceKey] = entries[0];
    return [
      [makeBooleanChoiceKey(sourceKey, true), "Có"],
      [makeBooleanChoiceKey(sourceKey, false), "Không"],
    ];
  }

  if (entries.length === 1) {
    return entries.map(([key, label], index) => [key, normalizeAnswerLabel(key, label, index)]);
  }

  return FALLBACK_ANSWER_OPTIONS;
}

export function getClinicalQuestionAnswerMode(question: ClinicalQuestion): "choice" | "boolean-list" {
  return areYesNoOptions(getClinicalQuestionAnswerOptions(question)) ? "choice" : "boolean-list";
}

export function getClinicalQuestionBooleanPrompts(question: ClinicalQuestion) {
  const entries = getPayloadAnswerOptions(question);

  return entries.map(([key, label]) => {
    const source = normalizeText(label) || normalizeText(key);
    const translatedLabel = translateClinicalText(source);
    const original = hasVietnameseText(source) || translatedLabel === source ? "" : source;

    return { key, label: translatedLabel, original };
  });
}

export function isClinicalQuestionAnswered(question: ClinicalQuestion, selected: AnswerValue) {
  const options = getClinicalQuestionAnswerOptions(question);

  if (getClinicalQuestionAnswerMode(question) === "choice") {
    return typeof selected === "string" && options.some(([key]) => key === selected);
  }

  const payloadOptions = getPayloadAnswerOptions(question);
  return (
    isPlainObject(selected)
    && payloadOptions.every(([key]) => typeof selected[key] === "boolean")
  );
}

export function buildClinicalQuestionAnswerItems(
  questions: ClinicalQuestion[] = [],
  selectedAnswers: Record<string, AnswerValue> = {},
): ClinicalAnswerItem[] {
  return questions.map((question, index) => {
    const questionId = getQuestionId(question, index);
    const selected = selectedAnswers[questionId];
    const payloadOptions = getPayloadAnswerOptions(question);
    const parsedBooleanChoice = parseBooleanChoiceKey(selected);

    return {
      questionId,
      answers: Object.fromEntries(
        payloadOptions.map(([key, label], optionIndex) => {
          if (parsedBooleanChoice) {
            return [key, key === parsedBooleanChoice.sourceKey ? parsedBooleanChoice.value : false];
          }

          if (isPlainObject(selected)) {
            return [key, selected[key] === true];
          }

          if (typeof selected === "boolean") {
            const normalized = `${key} ${label}`;
            const isPositive = looksLikeAffirmative(normalized) || optionIndex === 0;
            const isNegative = looksLikeNegative(normalized) || optionIndex === 1;
            return [key, selected ? isPositive : isNegative];
          }

          return [key, selected === key];
        }),
      ),
    };
  });
}
