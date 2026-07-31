"use client";

/**
 * Instagram Story proof upload (client-side).
 *
 * In supabase mode the file is uploaded to the `weekly-report-proofs` Storage
 * bucket and its public URL is returned. In mock mode (local dev, no Storage
 * backend) the image is inlined as a data URL so preview + persistence still
 * work end-to-end. Either way the returned string is stored in
 * `weekly_reports.instagram_story_url`.
 */

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = ".png,.jpg,.jpeg";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_UPLOAD_LABEL = "10 MB";
export const INSTAGRAM_PROOF_BUCKET = "weekly-report-proofs";

export type UploadErrorCode = "invalid-type" | "too-large" | "upload-failed";

export class UploadError extends Error {
  code: UploadErrorCode;
  constructor(code: UploadErrorCode, message: string) {
    super(message);
    this.name = "UploadError";
    this.code = code;
  }
}

/** Returns the first validation problem with a file, or null if it's accepted. */
export function validateProofFile(file: File): UploadErrorCode | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "invalid-type";
  }
  if (file.size > MAX_UPLOAD_BYTES) return "too-large";
  return null;
}

export const INVALID_TYPE_MESSAGE = "Only PNG or JPG files are accepted.";
export const TOO_LARGE_MESSAGE = `Image is too large — the maximum size is ${MAX_UPLOAD_LABEL}.`;

function isSupabaseMode(): boolean {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase";
}

function extensionFor(type: string): string {
  return type === "image/png" ? "png" : "jpg";
}

interface UploadOptions {
  internshipId: string;
  year: number;
  weekNumber: number;
  onProgress?: (percent: number) => void;
}

export async function uploadInstagramProof(
  file: File,
  opts: UploadOptions,
): Promise<string> {
  const problem = validateProofFile(file);
  if (problem === "invalid-type") {
    throw new UploadError("invalid-type", INVALID_TYPE_MESSAGE);
  }
  if (problem === "too-large") {
    throw new UploadError("too-large", TOO_LARGE_MESSAGE);
  }

  if (!isSupabaseMode()) {
    // Local/mock mode: no Storage backend. Use a short-lived object URL for the
    // preview instead of a data URL — a data URL would push megabytes of base64
    // through the report autosave server action (Next caps action bodies at
    // 1 MB) and break saving for real screenshots. The blob is only valid for
    // this page session (the preview won't survive a reload in mock mode), but
    // the value stays tiny. In supabase mode a real, persistent URL is stored.
    opts.onProgress?.(100);
    return URL.createObjectURL(file);
  }

  const { createClient } = await import("@/supabase/client");
  const supabase = createClient();
  const path = `${opts.internshipId}/${opts.year}-W${opts.weekNumber}-${crypto.randomUUID()}.${extensionFor(file.type)}`;

  opts.onProgress?.(15);
  const { error } = await supabase.storage
    .from(INSTAGRAM_PROOF_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) {
    throw new UploadError("upload-failed", error.message);
  }
  opts.onProgress?.(100);

  const { data } = supabase.storage
    .from(INSTAGRAM_PROOF_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}
