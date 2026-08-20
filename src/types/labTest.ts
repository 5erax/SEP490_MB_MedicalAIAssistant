export type LabSessionStatus = "processing" | "completed" | "failed";
export type LabResultStatus = "unknown" | "normal" | "high" | "low" | "criticalHigh" | "criticalLow";

export type LabReferenceRange = {
  comparisonType?: string;
  minValue?: number | null;
  maxValue?: number | null;
  unit?: string | null;
};

export type LabIndicatorInfo = {
  fullName?: string;
  symbol?: string;
  category?: string;
  unit?: string;
};

export type LabResultAdvice = {
  displayTitle?: string;
  urgencyLevel?: string;
  summary?: string;
  possibleCauses?: string;
  lifestyleAdvice?: string;
  nutritionalAdvice?: string;
  warningSigns?: string;
  followUpSuggestion?: string;
  doctorQuestions?: string;
};

export type LabResult = {
  resultDetailId: string;
  rawExtractedName?: string;
  rawExtractedValue?: string;
  userValue?: number | string | null;
  status: LabResultStatus;
  isMatched?: boolean;
  matchConfidence?: number | null;
  referenceRangeUsed?: LabReferenceRange | null;
  referenceMinUsed?: number | null;
  referenceMaxUsed?: number | null;
  referenceUnitUsed?: string | null;
  comparisonTypeUsed?: string | null;
  indicator?: LabIndicatorInfo | null;
  advice?: LabResultAdvice | null;
};

export type LabTestSession = {
  sessionId: string;
  status: LabSessionStatus;
  testDate?: string;
  processedAt?: string | null;
  createdAt?: string;
  patientGenderAtTest?: "male" | "female";
  patientAgeAtTest?: number;
  facilityName?: string | null;
  rawOcrText?: string | null;
  results?: LabResult[];
};

export type AnalyzeLabTestPayload = {
  documentUrl: string;
  patientGenderAtTest: "male" | "female";
  patientAgeAtTest: number;
  testDate: string;
};

export type LabOcrExtract = {
  ocrExtractId: string;
  testSessionId: string;
  rowIndex: number;
  extractedTestName?: string | null;
  extractedValue?: string | null;
  extractedUnit?: string | null;
  extractedReferenceText?: string | null;
  createdAt?: string;
};

export type LabTrendIndicator = {
  indicatorId: string;
  symbol?: string | null;
  name?: string | null;
  unit?: string | null;
  measurementCount: number;
  firstTestDate?: string;
  latestTestDate?: string;
};

export type LabTrendPoint = {
  sessionId: string;
  testDate: string;
  value: number;
  status: LabResultStatus;
  referenceMin?: number | null;
  referenceMax?: number | null;
  unit?: string | null;
  deviationPercent?: number | null;
  facilityName?: string | null;
};

export type LabIndicatorTrend = LabTrendIndicator & {
  latestValue?: number | null;
  previousValue?: number | null;
  trend?: string;
  hasMixedUnits?: boolean;
  points?: LabTrendPoint[];
};
