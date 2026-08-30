export type FacilityRatingSummary = {
  averageRating: number | null;
  reviewCount: number | null;
};

// The API aggregates all public feedback reviews. Never substitute the average
// of a paginated subset or treat missing metadata as zero reviews.
export function normalizeFacilityRating(source: { averageRating?: unknown; reviewCount?: unknown }): FacilityRatingSummary {
  const reviewCount = typeof source.reviewCount === "number" && Number.isInteger(source.reviewCount) && source.reviewCount >= 0
    ? source.reviewCount : null;
  const averageRating = reviewCount !== 0 && typeof source.averageRating === "number" && Number.isFinite(source.averageRating)
    && source.averageRating >= 1 && source.averageRating <= 5 ? source.averageRating : null;
  return { averageRating, reviewCount };
}

export function formatFacilityRating(summary: FacilityRatingSummary) {
  if (summary.reviewCount === 0) return "Chưa có đánh giá";
  const score = summary.averageRating == null ? "Chưa có điểm tổng hợp" : `${summary.averageRating.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5`;
  return summary.reviewCount == null ? score : `${score} · ${summary.reviewCount.toLocaleString("vi-VN")} đánh giá`;
}

export function getStarFill(value: number, star: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value - star + 1)) : 0;
}
