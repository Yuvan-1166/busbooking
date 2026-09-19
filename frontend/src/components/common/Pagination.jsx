/**
 * Pagination Component
 * 
 * Navigate through pages of content with modern styling.
 */

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
    <div className="flex items-center justify-center gap-2 py-6">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="btn-ghost"
        aria-label="Previous page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* First Page (if not visible) */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            disabled={isLoading}
            className="btn-ghost min-w-[2.5rem]"
          >
            1
          </button>
          {startPage > 2 && (
            <span className="px-2 text-neutral-500">...</span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={isLoading}
          className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            currentPage === page
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "text-neutral-700 hover:bg-neutral-100"
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
            <span className="px-2 text-neutral-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={isLoading}
            className="btn-ghost min-w-[2.5rem]"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="btn-ghost"
        aria-label="Next page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Page Info */}
      <span className="ml-4 text-sm text-neutral-600">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
