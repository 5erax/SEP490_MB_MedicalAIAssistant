// Ported from src/services/cloudinaryUploadService.js (Web) — direct-to-
// Cloudinary unsigned upload. RN's fetch/FormData accepts a
// {uri, name, type} object in place of a browser File.
import { env } from "@/src/config/env";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export type PickedImage = {
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
};

export function validateCloudinaryImage(image: PickedImage) {
  if (!image) {
    throw new Error("Hãy chọn một ảnh để tải lên.");
  }
  if (image.mimeType && !image.mimeType.startsWith("image/")) {
    throw new Error("Cloudinary chỉ nhận file ảnh ở trường này.");
  }
  if (image.fileSize && image.fileSize > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Ảnh tối đa 5 MB. Hãy chọn ảnh nhẹ hơn.");
  }
}

export async function uploadImageToCloudinary(image: PickedImage) {
  validateCloudinaryImage(image);
  const { cloudinaryCloudName: cloudName, cloudinaryUploadPreset: uploadPreset, cloudinaryFolder: folder } = env;

  if (!cloudName || !uploadPreset) {
    throw new Error("Chưa cấu hình Cloudinary. Hãy thêm EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME và EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: image.uri,
    name: image.fileName || `review-${Date.now()}.jpg`,
    type: image.mimeType || "image/jpeg",
  } as unknown as Blob);
  formData.append("upload_preset", uploadPreset);
  if (folder) formData.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload?.error?.message || "Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.");
  }

  return { secureUrl: payload.secure_url as string, publicId: payload.public_id as string };
}
