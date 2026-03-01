import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { toAssetUrl } from "@/lib/api";
import type { ClothingItem } from "@/lib/types";

interface ItemCardProps {
  item: ClothingItem;
  disabled?: boolean;
  onRename: (itemId: number, name: string) => Promise<void>;
  onAddPhotos: (itemId: number, files: FileList, angleLabel?: string) => Promise<void>;
}

export function ItemCard({ item, disabled = false, onRename, onAddPhotos }: ItemCardProps): React.JSX.Element {
  const processedImageSrc = useMemo(() => toAssetUrl(item.processed_url), [item.processed_url]);
  const originalImageSrc = useMemo(() => toAssetUrl(item.original_url), [item.original_url]);
  const [imageSrc, setImageSrc] = useState(processedImageSrc);
  const [nameDraft, setNameDraft] = useState(item.name ?? "");
  const [angleLabel, setAngleLabel] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    setImageSrc(processedImageSrc);
  }, [processedImageSrc]);

  useEffect(() => {
    setNameDraft(item.name ?? "");
  }, [item.name]);

  function handleImageError(): void {
    if (originalImageSrc && imageSrc !== originalImageSrc) {
      setImageSrc(originalImageSrc);
    }
  }

  async function handleSaveName(): Promise<void> {
    const nextName = nameDraft.trim();
    if (!nextName) {
      return;
    }
    await onRename(item.id, nextName);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    setSelectedFiles(event.target.files);
  }

  async function handleAddPhotos(): Promise<void> {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
    await onAddPhotos(item.id, selectedFiles, angleLabel.trim() || undefined);
    setSelectedFiles(null);
    setAngleLabel("");
  }

  return (
    <article className="item-card stack">
      <Image
        src={imageSrc}
        alt={`Closet item ${item.id}`}
        className="item-image"
        width={320}
        height={400}
        unoptimized
        onError={handleImageError}
      />

      <div className="item-meta stack">
        <strong>{item.name ?? `Item #${item.id}`}</strong>
        <span>Category: {item.category}</span>
        <span>ID: {item.id}</span>
        <span>Angles: {item.photos.length}</span>
        {item.color ? <span>Color: {item.color}</span> : null}

        <label htmlFor={`item-name-${item.id}`}>Rename item</label>
        <div className="row gap-sm wrap">
          <input
            id={`item-name-${item.id}`}
            className="input"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder="Item name"
            disabled={disabled}
          />
          <button
            className="button secondary"
            onClick={handleSaveName}
            disabled={disabled || !nameDraft.trim() || nameDraft.trim() === (item.name ?? "")}
          >
            Save Name
          </button>
        </div>

        <label htmlFor={`item-angle-${item.id}`}>Angle label (optional)</label>
        <input
          id={`item-angle-${item.id}`}
          className="input"
          value={angleLabel}
          onChange={(event) => setAngleLabel(event.target.value)}
          placeholder="e.g. left side, back"
          disabled={disabled}
        />

        <input
          className="input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={disabled}
        />
        <button className="button" onClick={handleAddPhotos} disabled={disabled || !selectedFiles?.length}>
          Add Angle Photos
        </button>

        {item.photos.length > 0 ? (
          <div className="angles-grid">
            {item.photos.slice(0, 6).map((photo) => (
              <Image
                key={photo.id}
                src={toAssetUrl(photo.processed_url)}
                alt={photo.angle_label ? `${photo.angle_label} angle` : `Angle ${photo.id}`}
                className="angle-image"
                width={100}
                height={100}
                unoptimized
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
