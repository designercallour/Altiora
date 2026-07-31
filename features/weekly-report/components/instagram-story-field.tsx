"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ImageUp,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  INVALID_TYPE_MESSAGE,
  TOO_LARGE_MESSAGE,
  MAX_UPLOAD_LABEL,
  uploadInstagramProof,
  UploadError,
  validateProofFile,
} from "../upload";

interface InstagramStoryFieldProps {
  internshipId: string;
  year: number;
  weekNumber: number;
  value: string | null;
  onChange: (url: string | null) => void;
}

type Status = "idle" | "uploading" | "error";

export function InstagramStoryField({
  internshipId,
  year,
  weekNumber,
  value,
  onChange,
}: InstagramStoryFieldProps) {
  const reduce = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  function openPicker() {
    setError(null);
    inputRef.current?.click();
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    // Client-side validation. Per spec, an invalid file type surfaces a
    // validation message; oversize is rejected with a clear message too.
    const problem = validateProofFile(file);
    if (problem === "invalid-type") {
      setError(INVALID_TYPE_MESSAGE);
      setStatus("error");
      return;
    }
    if (problem === "too-large") {
      setError(TOO_LARGE_MESSAGE);
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("uploading");
    setProgress(0);
    try {
      const url = await uploadInstagramProof(file, {
        internshipId,
        year,
        weekNumber,
        onProgress: setProgress,
      });
      onChange(url);
      setStatus("idle");
    } catch (err) {
      const message =
        err instanceof UploadError
          ? err.message
          : "Upload failed — please try again.";
      setError(message);
      setStatus("error");
    } finally {
      // Allow re-selecting the same file after a remove/replace.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const uploading = status === "uploading";

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Upload Instagram Story Proof</p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value ? (
        // ── Preview + replace/remove ────────────────────────────────────────
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Instagram Story proof"
            className="max-h-72 w-full object-contain"
          />
          <div className="border-border flex items-center justify-between gap-2 border-t px-3 py-2.5">
            <span className="text-muted-foreground text-xs">
              Uploaded — you can replace or remove it before submitting.
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openPicker}
                disabled={uploading}
              >
                <RefreshCw />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null);
                  setStatus("idle");
                  setError(null);
                }}
                disabled={uploading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : uploading ? (
        // ── Upload progress ─────────────────────────────────────────────────
        <div className="border-border bg-card rounded-xl border px-4 py-5">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Uploading… {progress}%
          </div>
          <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
            <motion.div
              className="bg-primary h-full rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
      ) : (
        // ── Empty dropzone / picker ─────────────────────────────────────────
        <button
          type="button"
          onClick={openPicker}
          className={cn(
            "border-border hover:border-primary/60 hover:bg-accent/40 flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
            status === "error" && "border-destructive/50",
          )}
        >
          <ImageUp className="text-muted-foreground size-6" />
          <span className="text-sm font-medium">Upload a screenshot</span>
          <span className="text-muted-foreground text-xs">
            Only PNG or JPG files are accepted · up to {MAX_UPLOAD_LABEL}
          </span>
        </button>
      )}

      {error && (
        <p className="text-destructive flex items-center gap-1.5 text-xs">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
