"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { StatusMessage } from "@/components/StatusMessage";
import { getOrBootstrapOwnerId } from "@/lib/session";
import { uploadItem } from "@/lib/api";
import type { UploadResponse } from "@/lib/types";

export default function UploadPage(): React.JSX.Element {
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        const id = await getOrBootstrapOwnerId();
        if (mounted) {
          setOwnerId(id);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to bootstrap user.");
        }
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const previewUrl = useMemo(() => {
    if (!file) {
      return "";
    }
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const selected = event.target.files?.[0];
    setFile(selected ?? null);
    setError("");
    setSuccess("");
  }

  async function handleUpload(): Promise<void> {
    if (!ownerId || !file) {
      setError("Owner or file is missing.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = await uploadItem(ownerId, file);
      setLastUpload(payload);
      setSuccess(payload.message);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <div className="card stack">
        <h2 className="title">Upload Clothing</h2>
        <p className="subtitle">
          Add one clothing item photo at a time. The backend removes background and auto-categorizes
          each item.
        </p>
        <p className="subtitle">Active owner ID: {ownerId ?? "loading..."}</p>
      </div>

      <div className="card stack">
        <label htmlFor="item-upload">Choose image</label>
        <input id="item-upload" className="input" type="file" accept="image/*" onChange={handleChange} />

        {previewUrl ? (
          // Using native img for local blob preview before upload.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="preview" src={previewUrl} alt="Preview of selected clothing item" />
        ) : null}

        <div className="row gap-md wrap">
          <button className="button" onClick={handleUpload} disabled={!file || !ownerId || submitting}>
            {submitting ? "Uploading..." : "Upload Item"}
          </button>
          <Link href="/closet" className="button secondary">
            Go to Closet
          </Link>
        </div>

        <StatusMessage message={success} tone="success" />
        <StatusMessage message={error} tone="error" />
      </div>

      {lastUpload ? (
        <div className="card stack">
          <h3>Last Upload</h3>
          <p>Item ID: {lastUpload.item.id}</p>
          <p>Category: {lastUpload.item.category}</p>
          <p>Processed URL: {lastUpload.item.processed_url}</p>
        </div>
      ) : null}
    </section>
  );
}
