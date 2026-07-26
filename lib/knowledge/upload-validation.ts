const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

export type UploadValidationResult = { ok: true } | { ok: false; reason: string };

export function validateKnowledgeUpload(file: Pick<File, "name" | "size" | "type">): UploadValidationResult {
  if (!file.name || file.name.length > 255) return { ok: false, reason: "اسم الملف غير صالح." };
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) return { ok: false, reason: "حجم الملف يجب أن يكون بين 1 بايت و50 ميغابايت." };
  if (!ALLOWED_MIME_TYPES.has(file.type)) return { ok: false, reason: "يسمح فقط بملفات PDF أو DOCX." };
  return { ok: true };
}
