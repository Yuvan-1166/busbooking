/**
 * ItemList Component
 *
 * Renders a vertically divided list of items, or an empty-state message
 * when there is nothing to show.
 */

export default function ItemList({ items, empty, render }) {
  return items && items.length ? (
    <div className="divide-y divide-neutral-200">
      {items.map(render)}
    </div>
  ) : (
    <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
      <p className="text-sm text-neutral-600">{empty}</p>
    </div>
  );
}