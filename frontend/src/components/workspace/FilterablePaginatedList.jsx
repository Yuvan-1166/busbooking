import { useEffect, useMemo, useState } from "react";
import FilterBar from "./FilterBar";
import Pagination from "../common/Pagination";
import ItemList from "../common/ItemList";

const PAGE_SIZE = 8;

/**
 * FilterablePaginatedList
 *
 * A reusable list that combines a FilterBar (search + dropdown filters),
 * a paginated item list, and the design-system Pagination component.
 * Filtering happens before pagination, and the page resets to 1 whenever
 * the filters change.
 */
export default function FilterablePaginatedList({
  title,
  titleAction,
  items,
  filters = [],
  searchPlaceholder = "Search...",
  searchGetter = (item) => JSON.stringify(item),
  empty = "No results found.",
  resultLabel = "results",
  renderItem,
  pageSize = PAGE_SIZE,
  page,
  onPageChange,
}) {
  const [search, setSearch] = useState("");
  const [selectValues, setSelectValues] = useState({});
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = page ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (query && !searchGetter(item).toLowerCase().includes(query)) return false;
      return filters.every((filter) => {
        const selected = selectValues[filter.label];
        return !selected || String(filter.getValue(item)) === selected;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, selectValues, searchGetter, filters]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectValues]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const startIdx = (safePage - 1) * pageSize;
    return filteredItems.slice(startIdx, startIdx + pageSize);
  }, [filteredItems, safePage, pageSize]);

  const selectConfigs = filters.map((filter) => ({
    label: filter.label,
    value: selectValues[filter.label] || "",
    onChange: (value) =>
      setSelectValues((prev) => ({ ...prev, [filter.label]: value })),
    options: Array.from(
      new Set(items.map((item) => filter.getValue(item)).filter(Boolean)),
    )
      .sort()
      .map((value) => ({
        value: String(value),
        label: filter.formatLabel ? filter.formatLabel(value) : String(value),
      })),
  }));

  const clearFilters = () => {
    setSearch("");
    setSelectValues({});
    setPage(1);
  };

  return (
    <div>
      {(title || titleAction) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h3 className="text-sm font-semibold text-neutral-700">
              {title} ({items.length})
            </h3>
          )}
          {titleAction}
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        selects={selectConfigs}
        onClear={clearFilters}
        resultCount={filteredItems.length}
        resultLabel={resultLabel}
      />

      <ItemList
        items={paginatedItems}
        empty={
          items.length === 0
            ? empty
            : `No ${resultLabel} match your filters.`
        }
        render={renderItem}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={(next) => setPage(Math.min(next, totalPages))}
        />
      )}
    </div>
  );
}