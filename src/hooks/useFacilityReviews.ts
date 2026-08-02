// Ported from the review fetch/submit effects in Web's NearbyClinicPage.jsx
// (submitReview, uploadReviewImage, startEditingReview, cancelEditingReview).
import { useCallback, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/src/providers";
import { feedbackReviewsApi } from "@/src/services/feedbackReviewService";
import { uploadImageToCloudinary } from "@/src/services/cloudinaryUploadService";
import { normalizeSearchText } from "@/src/utils/facilityNormalize";
import {
  FeedbackReview,
  getReviewImageUrls,
  getReviewMessageText,
  isReviewByCurrentUser,
  toReviewImageUrlMap,
} from "@/src/utils/reviewHelpers";

export type ReviewForm = { rating: string; comment: string; imageUrls: string[] };

const INITIAL_FORM: ReviewForm = { rating: "5", comment: "", imageUrls: [] };

export function useFacilityReviews(facilityId: string | undefined) {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<FeedbackReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ReviewForm>(INITIAL_FORM);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [submittedReview, setSubmittedReview] = useState<FeedbackReview | null>(null);

  const currentUserReview = reviews.find((review) => isReviewByCurrentUser(review, session)) || submittedReview;

  const load = useCallback(async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const response = (await feedbackReviewsApi.byFacility(facilityId)) as { data?: { items?: FeedbackReview[] } };
      setReviews(response.data?.items ?? []);
    } catch (error) {
      setMessage(getReviewMessageText(error, "Không thể tải đánh giá cho cơ sở này."));
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    setReviews([]);
    setSubmittedReview(null);
    setEditing(false);
    setMessage("");
    load();
  }, [load]);

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

    setSubmitting(true);
    setMessage("");
    try {
      const submittedRating = Number(form.rating);
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

      const refreshed = (await feedbackReviewsApi.byFacility(facilityId)) as { data?: { items?: FeedbackReview[] } };
      const refreshedItems = refreshed.data?.items ?? [];
      const savedIndex = refreshedItems.findIndex((review) => String(review.id) === String(saved.id));
      const nextReviews =
        savedIndex >= 0
          ? refreshedItems.map((review, index) => (index === savedIndex ? { ...saved, ...review } : review))
          : [saved, ...refreshedItems];
      setReviews(nextReviews);
      return "success" as const;
    } catch (error) {
      const text = getReviewMessageText(error, "Không thể gửi đánh giá. Vui lòng thử lại sau.");
      setMessage(text);
      if (normalizeSearchText(text).includes("da danh gia")) {
        setSubmittedReview({ isCurrentUser: true, isKnownDuplicate: true });
      }
      return "error" as const;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    reviews,
    loading,
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
