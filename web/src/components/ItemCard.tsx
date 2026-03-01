import Image from "next/image";
import { toAssetUrl } from "@/lib/api";
import type { ClothingItem } from "@/lib/types";

interface ItemCardProps {
  item: ClothingItem;
}

export function ItemCard({ item }: ItemCardProps): React.JSX.Element {
  const imageSrc = toAssetUrl(item.processed_url);

  return (
    <article className="item-card">
      <Image
        src={imageSrc}
        alt={`Closet item ${item.id}`}
        className="item-image"
        width={320}
        height={400}
      />
      <div className="item-meta">
        <strong>{item.category}</strong>
        <span>ID: {item.id}</span>
        {item.color ? <span>Color: {item.color}</span> : null}
      </div>
    </article>
  );
}
