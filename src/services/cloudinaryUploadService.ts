// Ported from src/services/cloudinaryUploadService.js (Web) — direct-to-
// Cloudinary unsigned upload. RN's fetch/FormData accepts a
// {uri, name, type} object in place of a browser File.
import { env } from "@/src/config/env";
import { Platform } from "react-native";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_MEDICAL_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MEDICAL_DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export type PickedImage = {
  uri: string;
  file?: Blob | null;
  mimeType?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
};

async function appendPickedFile(
  formData: FormData,
  picked: PickedImage,
  fallbackName: string,
  fallbackType: string,
) {
  const fileName = picked.fileName || fallbackName;
  const mimeType = picked.mimeType || fallbackType;

  if (Platform.OS === "web") {
    let blob = picked.file ?? null;
    if (!blob) {
      const fileResponse = await fetch(picked.uri);
      if (!fileResponse.ok) {
        throw new Error("Không thể đọc tệp đã chọn trên thiết bị.");
      }
      blob = await fileResponse.blob();
    }

    const uploadBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
    formData.append("file", uploadBlob, fileName);
    return;
  }

  formData.append("file", {
    uri: picked.uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
}

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
  await appendPickedFile(formData, image, `review-${Date.now()}.jpg`, "image/jpeg");
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

export type PickedDocument = {
  uri: string;
  file?: Blob | null;
  mimeType?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
};

export function validateMedicalDocument(document: PickedDocument) {
  if (!document) {
    throw new Error("Hãy chọn ảnh hoặc PDF phiếu xét nghiệm.");
  }
  if (document.mimeType && !MEDICAL_DOCUMENT_TYPES.has(document.mimeType)) {
    throw new Error("Phiếu xét nghiệm phải là file JPG, PNG hoặc PDF.");
  }
  if (document.fileSize && document.fileSize > MAX_MEDICAL_DOCUMENT_SIZE_BYTES) {
    throw new Error("Phiếu xét nghiệm tối đa 10 MB. Hãy chọn file nhẹ hơn.");
  }
}

// Ported from uploadMedicalDocumentToCloudinary (Web) — the analyze endpoint
// only ever receives a Cloudinary documentUrl, never the file itself (see
// labTestService.ts). Uses the "auto" resource type (not "image/upload")
// since this accepts both images and PDFs, in a dedicated "lab-tests"
// subfolder.
export async function uploadMedicalDocumentToCloudinary(document: PickedDocument) {
  validateMedicalDocument(document);
  const { cloudinaryCloudName: cloudName, cloudinaryUploadPreset: uploadPreset, cloudinaryFolder: folder } = env;

  if (!cloudName || !uploadPreset) {
    throw new Error("Chưa cấu hình dịch vụ tải tài liệu. Vui lòng thử lại sau.");
  }

  const formData = new FormData();
  await appendPickedFile(formData, document, `lab-test-${Date.now()}`, "application/octet-stream");
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder ? `${folder}/lab-tests` : "lab-tests");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.secure_url) {
    const cloudinaryMessage = typeof payload?.error?.message === "string" ? payload.error.message : "";
    throw new Error(cloudinaryMessage ? `Không thể tải phiếu xét nghiệm: ${cloudinaryMessage}` : "Không thể tải phiếu xét nghiệm lên. Vui lòng thử lại.");
  }

  return {
    secureUrl: payload.secure_url as string,
    publicId: payload.public_id as string,
    resourceType: payload.resource_type as string,
  };
}
