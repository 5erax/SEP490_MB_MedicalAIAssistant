// Ported from the review fetch/submit effects in Web's NearbyClinicPage.jsx
// (submitReview, uploadReviewImage, startEditingReview, cancelEditingReview).
import { useCallback, useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/src/providers";
import { feedbackReviewsApi } from "@/src/services/feedbackReviewService";
import { medicalFacilitiesApi } from "@/src/services/facilityService";
import { FacilityRatingSummary, normalizeFacilityRating } from "@/src/utils/facilityRating";
import { uploadImageToCloudinary } from "@/src/services/cloudinaryUploadService";
import { getObjectData, normalizeSearchText } from "@/src/utils/facilityNormalize";
import {
  FeedbackReview,
  getReviewImageUrls,
  getReviewMessageText,
  isReviewByCurrentUser,
  toReviewImageUrlMap,
} from "@/src/utils/reviewHelpers";

export type ReviewForm = { rating: string; comment: string; imageUrls: string[] };

const INITIAL_FORM: ReviewForm = { rating: "5", comment: "", imageUrls: [] };
const UNKNOWN_RATING: FacilityRatingSummary = { averageRating: null, reviewCount: null };
type ReviewPage = { items: FeedbackReview[]; totalPages: number; totalCount: number };
export type RatingChangeHandler = (facilityId: string, summary: FacilityRatingSummary) => void;

export function useFacilityReviews(facilityId: string | undefined, onRatingChange?: RatingChangeHandler) {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<FeedbackReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingSummary, setRatingSummary] = useState<FacilityRatingSummary>(UNKNOWN_RATING);
  const [loadError, setLoadError] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);
  const activeFacility = useRef<string | undefined>(facilityId);
  const saving = useRef(false);
  const paging = useRef(false);
  const [form, setForm] = useState<ReviewForm>(INITIAL_FORM);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [submittedReview, setSubmittedReview] = useState<FeedbackReview | null>(null);

  const currentUserReview = submittedReview || reviews.find((review) => isReviewByCurrentUser(review, session));

  const load = useCallback(async () => {
    if (!facilityId) return false;
    const version = ++requestId.current;
    setLoading(true);
    setLoadError("");
    const [reviewResult, facilityResult] = await Promise.allSettled([
      feedbackReviewsApi.byFacility(facilityId), medicalFacilitiesApi.get(facilityId),
    ]);
    if (requestId.current !== version || activeFacility.current !== facilityId) return false;
    const problems: string[] = [];
    if (reviewResult.status === "fulfilled" && Array.isArray((reviewResult.value.data as ReviewPage)?.items)) {
      const page = reviewResult.value.data as ReviewPage;
      setReviews(page.items);
      setSubmittedReview((current) => current ? page.items.find((review) => review.id && review.id === current.id) ?? current : null);
      setPageNumber(1);
      setTotalPages(Number(page.totalPages) || 1);
      setTotalReviews(Number.isInteger(page.totalCount) && page.totalCount >= 0 ? page.totalCount : null);
    } else {
      problems.push("Chưa thể tải danh sách đánh giá.");
    }
    if (facilityResult.status === "fulfilled") {
      const summary = normalizeFacilityRating(getObjectData(facilityResult.value));
      setRatingSummary(summary);
      onRatingChange?.(facilityId, summary);
      if (summary.reviewCount == null || (summary.reviewCount > 0 && summary.averageRating == null)) {
        problems.push("Chưa thể xác định điểm tổng hợp của cơ sở.");
      }
    } else {
      setRatingSummary(UNKNOWN_RATING);
      onRatingChange?.(facilityId, UNKNOWN_RATING);
      problems.push("Chưa thể cập nhật điểm trung bình của cơ sở.");
    }
    setLoadError(problems.join(" "));
    setLoading(false);
    return problems.length === 0;
  }, [facilityId, onRatingChange]);

  useEffect(() => {
    activeFacility.current = facilityId;
    setReviews([]);
    setRatingSummary(UNKNOWN_RATING);
    setTotalReviews(null);
    setForm(INITIAL_FORM);
    setSubmittedReview(null);
    setEditing(false);
    setMessage("");
    void load();
    return () => { requestId.current += 1; activeFacility.current = undefined; };
  }, [facilityId, load]);

  async function loadMore() {
    if (!facilityId || loading || paging.current || pageNumber >= totalPages) return;
    const version = requestId.current;
    paging.current = true;
    setLoadingMore(true);
    setLoadError("");
    try {
      const response = await feedbackReviewsApi.byFacility(facilityId, pageNumber + 1);
      if (version !== requestId.current || activeFacility.current !== facilityId) return;
      const page = response.data as ReviewPage;
      if (!Array.isArray(page?.items)) throw new Error("Invalid review page");
      setReviews((current) => [...current, ...page.items.filter((item) => !item.id || !current.some((review) => review.id === item.id))]);
      setPageNumber((current) => current + 1);
      setTotalPages(Number(page.totalPages) || 1);
    } catch {
      if (version === requestId.current && activeFacility.current === facilityId) setLoadError("Chưa thể tải thêm đánh giá. Vui lòng thử lại.");
    } finally {
      paging.current = false;
      if (activeFacility.current === facilityId) setLoadingMore(false);
    }
  }

  function startEditing() {
    if (!currentUserReview?.id) return;
    setForm({
      rating: String(currentUserReview.rating || 5),
      comment: currentUserReview.comment || "",
      imageUrls: getReviewImageUrls(currentUserReview),
    });
    setMessage("");
    setEditing(true);
  }

  function cancelEditing() {
    setForm(INITIAL_FORM);
    setMessage("");
    setEditing(false);
  }

  async function pickAndUploadImage() {
    const remainingSlots = 5 - form.imageUrls.length;
    if (remainingSlots <= 0) {
      setMessage("Mỗi đánh giá được tải tối đa 5 ảnh.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Cần quyền truy cập ảnh để đính kèm vào đánh giá.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });
    if (result.canceled || result.assets.length === 0) return;

    setUploadingImage(true);
    setMessage("");
    try {
      const uploads = await Promise.all(
        result.assets.map((asset) =>
          uploadImageToCloudinary({ uri: asset.uri, mimeType: asset.mimeType, fileSize: asset.fileSize, fileName: asset.fileName }),
        ),
      );
      const uploadedUrls = uploads.map(({ secureUrl }) => secureUrl);
      setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, ...uploadedUrls] }));
      setMessage(`Đã tải ${uploadedUrls.length} ảnh. Ảnh sẽ được lưu cùng đánh giá.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(url: string) {
    setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((imageUrl) => imageUrl !== url) }));
  }

  async function submit() {
    if (!facilityId) return "no-facility" as const;
    if (!session) return "requires-auth" as const;
    if (saving.current) return "busy" as const;
    const submittedRating = Number(form.rating);
    if (!Number.isInteger(submittedRating) || submittedRating < 1 || submittedRating > 5) {
      setMessage("Vui lòng chọn từ 1 đến 5 sao.");
      return "error" as const;
    }

    saving.current = true;
    setSubmitting(true);
    setMessage("");
    try {
      const submittedComment = form.comment.trim();
      const imageUrlsMap = toReviewImageUrlMap(form.imageUrls);
      const reviewValues = {
        rating: submittedRating,
        comment: submittedComment || null,
        imageUrls: Object.keys(imageUrlsMap).length ? imageUrlsMap : null,
      };
      const isUpdating = editing && currentUserReview?.id;
      const response = (await (isUpdating
        ? feedbackReviewsApi.update(currentUserReview!.id!, reviewValues)
        : feedbackReviewsApi.create({ facilityId, ...reviewValues }))) as { data?: FeedbackReview; message?: string };
      if (activeFacility.current !== facilityId) return "success" as const;

      const saved: FeedbackReview = {
        ...(currentUserReview || {}),
        ...(response.data || {}),
        facilityId,
        rating: submittedRating,
        comment: submittedComment,
        imageUrl: form.imageUrls[0] || "",
        imageUrls: form.imageUrls,
        reviewerName: String(session.displayName || session.name || (session as Record<string, unknown>).userName || "Bạn"),
        isCurrentUser: true,
      };

      setSubmittedReview(saved);
      setEditing(false);
      setForm(INITIAL_FORM);
      setMessage(isUpdating ? "Đã cập nhật đánh giá của bạn." : getReviewMessageText(response.message, "Đã gửi đánh giá của bạn."));

      // Persisted review is already successful. A failed refresh must never
      // report the POST/PUT as failed or encourage sending it again.
      setRatingSummary(UNKNOWN_RATING);
      onRatingChange?.(facilityId, UNKNOWN_RATING);
      const refreshed = await load();
      if (!refreshed && activeFacility.current === facilityId) {
        setMessage("Đã lưu đánh giá. Chưa thể đồng bộ đủ dữ liệu mới; hãy bấm Tải lại đánh giá.");
      }
      return "success" as const;
    } catch (error) {
      if (activeFacility.current !== facilityId) return "error" as const;
      const text = getReviewMessageText(error, "Không thể gửi đánh giá. Vui lòng thử lại sau.");
      setMessage(text);
      if (normalizeSearchText(text).includes("da danh gia")) {
        setSubmittedReview({ isCurrentUser: true, isKnownDuplicate: true });
      }
      return "error" as const;
    } finally {
      saving.current = false;
      if (activeFacility.current === facilityId) setSubmitting(false);
    }
  }

  return {
    reviews,
    loading,
    ratingSummary,
    loadError,
    totalReviews,
    loadingMore,
    hasMore: pageNumber < totalPages,
    loadMore,
    form,
    setForm,
    editing,
    submitting,
    uploadingImage,
    message,
    currentUserReview,
    startEditing,
    cancelEditing,
    pickAndUploadImage,
    removeImage,
    submit,
    reload: load,
  };
}
