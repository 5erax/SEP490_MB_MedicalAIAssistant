// Ported from the "clinical flow" state machine in Web's NearbyClinicPage.jsx
// (source=clinical query param, set by Dashboard's "Mở bản đồ" CTA). Reads
// the cached recommendation snapshot symptomAnalysisApi.submitClinicalQuestionAnswers()
// stored (in-memory Map, same JS runtime as Dashboard since this is a single
// app process — the Web report's "separate tab" cache-miss caveat does not
// apply on mobile as long as the app wasn't killed between screens).
import { useEffect, useState } from "react";

import { symptomAnalysisApi } from "@/src/services/symptomAnalysisService";
import { ClinicalDepartment, ClinicalFacility } from "@/src/types/symptomAnalysis";
import { useAuth } from "@/src/providers";

export type ClinicalStatus = "idle" | "locked" | "loading" | "ready" | "error";

export type ClinicalRecommendationContext = {
  recommendedDepartment: ClinicalDepartment | null;
  recommendedFacilities: ClinicalFacility[];
  sessionId: string;
};

type Params = {
  source?: string;
  sessionId?: string;
  facilityId?: string;
  departmentId?: string;
};

export function useClinicalRecommendation(params: Params) {
  const { session, isRestoring } = useAuth();
  const isClinicalFlow = params.source === "clinical";

  const [status, setStatus] = useState<ClinicalStatus>(isClinicalFlow ? "loading" : "idle");
  const [notice, setNotice] = useState("");
  const [context, setContext] = useState<ClinicalRecommendationContext | null>(null);

  useEffect(() => {
    if (!isClinicalFlow || isRestoring) return;

    if (!session?.accessToken) {
      setStatus("locked");
      setNotice("Đăng nhập để xem lại kết quả gợi ý chuyên khoa của bạn.");
      return;
    }

    if (!params.sessionId) {
      setStatus("error");
      setNotice("Không tìm thấy mã phiên gợi ý để khôi phục kết quả.");
      return;
    }

    let active = true;
    setStatus("loading");
    setNotice("");

    symptomAnalysisApi.getCachedClinicalAnalysis(params.sessionId).then((snapshot) => {
      if (!active) return;
      if (snapshot && (snapshot.recommendedDepartment || snapshot.recommendedFacilities.length)) {
        setContext({
          recommendedDepartment: snapshot.recommendedDepartment,
          recommendedFacilities: snapshot.recommendedFacilities,
          sessionId: snapshot.sessionId,
        });
        setStatus("ready");
        setNotice("");
      } else {
        setContext(null);
        setStatus("error");
        setNotice("Kết quả gợi ý không còn trong phiên hiện tại. Vui lòng quay lại trang chủ và gửi lại triệu chứng.");
      }
    });

    return () => {
      active = false;
    };
  }, [isClinicalFlow, isRestoring, session?.accessToken, params.sessionId]);

  return { isClinicalFlow, status, notice, context };
}
