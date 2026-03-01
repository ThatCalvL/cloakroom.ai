"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/EmptyState";
import { generateTryOn, fetchCloset, toAssetUrl } from "@/lib/api";
import { getOrBootstrapOwnerId } from "@/lib/session";
import { StatusMessage } from "@/components/StatusMessage";
import type { ClothingItem } from "@/lib/types";

export default function StylingPage(): React.JSX.Element {
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [topId, setTopId] = useState("");
  const [bottomId, setBottomId] = useState("");
  const [shoesId, setShoesId] = useState("");
  const [accessoryId, setAccessoryId] = useState("");

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const id = await getOrBootstrapOwnerId();
        if (!mounted) {
          return;
        }
        setOwnerId(id);
        const closet = await fetchCloset(id);
        if (!mounted) {
          return;
        }
        setItems(closet);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load styling data.");
        }
      } finally {
        if (mounted) {
          setLoadingItems(false);
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    return {
      tops: items.filter((item) => item.category === "top"),
      bottoms: items.filter((item) => item.category === "bottom"),
      shoes: items.filter((item) => item.category === "shoes"),
      accessories: items.filter((item) => item.category === "accessory"),
    };
  }, [items]);

  async function handleGenerate(): Promise<void> {
    if (!ownerId) {
      setError("Owner context is not ready yet.");
      return;
    }

    if (!topId && !bottomId && !shoesId && !accessoryId) {
      setError("Select at least one item before running try-on.");
      return;
    }

    setError("");
    setSuccess("");
    setGenerating(true);
    setResultUrl("");

    try {
      const payload = await generateTryOn({
        user_id: ownerId,
        top_id: topId ? Number(topId) : undefined,
        bottom_id: bottomId ? Number(bottomId) : undefined,
        shoes_id: shoesId ? Number(shoesId) : undefined,
        accessory_id: accessoryId ? Number(accessoryId) : undefined,
      });
      setResultUrl(payload.generated_image_url);
      setSuccess(`Try-on complete. Outfit ID ${payload.outfit_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try-on generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function renderSelect(
    id: string,
    label: string,
    value: string,
    onChange: (next: string) => void,
    options: ClothingItem[],
  ): React.JSX.Element {
    return (
      <label className="stack" htmlFor={id}>
        <span>{label}</span>
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">None</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              #{item.id} {item.name ?? item.category}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <section className="stack">
      <div className="card stack">
        <h2 className="title">Styling / Try-On Test</h2>
        <p className="subtitle">Owner ID: {ownerId ?? "loading..."}</p>
        <div className="row gap-md wrap">
          <Link href="/closet" className="button secondary">
            Back to Closet
          </Link>
          <Link href="/upload" className="button">
            Upload New Item
          </Link>
        </div>
      </div>

      <div className="card stack">
        <h3>Select Items</h3>
        {loadingItems ? <p className="subtitle">Loading closet items...</p> : null}
        {!loadingItems ? (
          <>
            {items.length === 0 ? (
              <EmptyState
                title="No closet items available"
                description="Upload at least one clothing item before running try-on."
              />
            ) : (
              <>
                {renderSelect("top-id", "Top", topId, setTopId, grouped.tops)}
                {renderSelect("bottom-id", "Bottom", bottomId, setBottomId, grouped.bottoms)}
                {renderSelect("shoes-id", "Shoes", shoesId, setShoesId, grouped.shoes)}
                {renderSelect("accessory-id", "Accessory", accessoryId, setAccessoryId, grouped.accessories)}
                <button className="button" onClick={handleGenerate} disabled={generating || loadingItems}>
                  {generating ? "Generating..." : "Generate Try-On"}
                </button>
              </>
            )}
          </>
        ) : null}
        <StatusMessage message={success} tone="success" />
        <StatusMessage message={error} tone="error" />
      </div>

      {resultUrl ? (
        <div className="card stack">
          <h3>Generated Result</h3>
          <Image
            className="result-image"
            src={toAssetUrl(resultUrl)}
            alt="Generated try-on result"
            width={420}
            height={620}
            unoptimized
          />
          <a className="button secondary" href={toAssetUrl(resultUrl)} target="_blank" rel="noreferrer">
            Open Image
          </a>
        </div>
      ) : null}
    </section>
  );
}
