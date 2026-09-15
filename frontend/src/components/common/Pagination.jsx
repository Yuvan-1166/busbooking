export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return { pages, startPage, endPage };
  };

  const { pages, startPage, endPage } = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-8 max-[600px]:gap-1">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="rounded-md border border-[#e7e5dc] bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-[#fafaf8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs"
        aria-label="Previous page"
      >
        ←
      </button>

      {/* First Page (if not visible) */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            disabled={isLoading}
            className="rounded-md border border-[#e7e5dc] bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-[#fafaf8] disabled:opacity-50 transition-colors max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs"
          >
            1
          </button>
          {startPage > 2 && (
            <span className="px-2 text-muted font-mono text-[10px]">...</span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={isLoading}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs ${
            currentPage === page
              ? "bg-orange text-white"
              : "border border-[#e7e5dc] bg-white text-ink hover:bg-[#fafaf8] disabled:opacity-50"
          }`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </button>
      ))}

      {/* Last Page (if not visible) */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 text-muted font-mono text-[10px]">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={isLoading}
            className="rounded-md border border-[#e7e5dc] bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-[#fafaf8] disabled:opacity-50 transition-colors max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="rounded-md border border-[#e7e5dc] bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-[#fafaf8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs"
        aria-label="Next page"
      >
        →
      </button>

      {/* Page Info */}
      <span className="ml-4 font-mono text-[11px] text-muted max-[600px]:ml-2 max-[600px]:text-[10px]">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
