"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { StatusMessage } from "@/components/StatusMessage";
import { fetchCloset } from "@/lib/api";
import { getOrBootstrapOwnerId } from "@/lib/session";
import type { Category, ClothingItem } from "@/lib/types";

const categoryFilters: Array<{ label: string; value: Category | "all" }> = [
  { label: "All", value: "all" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
  { label: "Outerwear", value: "outerwear" },
  { label: "Shoes", value: "shoes" },
  { label: "Accessory", value: "accessory" },
];

export default function ClosetPage(): React.JSX.Element {
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const id = await getOrBootstrapOwnerId();
        if (!mounted) {
          return;
        }
        setOwnerId(id);
        await loadItems(id, mounted);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load closet.");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  async function loadItems(id: number, mounted = true): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchCloset(id);
      if (mounted) {
        setItems(payload);
      }
    } catch (err) {
      if (mounted) {
        setError(err instanceof Error ? err.message : "Failed to fetch closet.");
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }

  const visibleItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  return (
    <section className="stack">
      <div className="card stack">
        <h2 className="title">Digital Closet</h2>
        <p className="subtitle">Owner ID: {ownerId ?? "loading..."}</p>
        <div className="row gap-md wrap">
          <button className="button secondary" onClick={() => ownerId && loadItems(ownerId)} disabled={!ownerId || loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link href="/upload" className="button">
            Upload More Items
          </Link>
          <Link href="/styling" className="button secondary">
            Go to Styling
          </Link>
        </div>
        <StatusMessage message={error} tone="error" />
      </div>

      <div className="card stack">
        <h3>Category Filters</h3>
        <div className="chip-group">
          {categoryFilters.map((entry) => (
            <button
              key={entry.value}
              className={`chip ${filter === entry.value ? "active" : ""}`}
              onClick={() => setFilter(entry.value)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card stack">
        <h3>Items ({visibleItems.length})</h3>
        {loading ? <p className="subtitle">Loading closet items...</p> : null}
        {!loading && visibleItems.length === 0 ? (
          <EmptyState
            title="No items in this view yet"
            description="Upload clothing photos first, then refresh this page to sync your closet."
          />
        ) : (
          <div className="item-grid">
            {visibleItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
