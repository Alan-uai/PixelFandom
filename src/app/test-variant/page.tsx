'use client';
import CollectionItemView from '@/components/wiki/collection-item-view';
const base = {
  id: 'base1', slug: 'item-v1', name: 'Item V1', description: 'base description', rarity: 'common', icon: '⚔️',
};
export default function TestVariantPage() {
  return (
    <div className="p-8">
      <CollectionItemView data={base} collectionType="weapon" tenantId="t1" tenantSlug="tenant" sourceTable="weapons" />
    </div>
  );
}
