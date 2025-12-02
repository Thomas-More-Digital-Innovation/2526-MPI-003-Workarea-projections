import React, { useState, useEffect } from "react";
import Shape from "./Shape";
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from "@heroicons/react/24/solid";

interface ShapePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GridPresetProps {
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  scale?: number;
  total: number;
  perPage?: number;
  pagination?: boolean;
  completedStates?: boolean[];
  onShapeClick?: (index: number) => void; // ✅ klik op een shape
  onPageChange?: (page: number) => void;  // ✅ paginawijziging
  // Optional controlled current page (0-based). When provided GridPreset will
  // follow this value instead of managing its own internal page state.
  currentPage?: number;
  gap?: string; // Tailwind gap class (e.g., "gap-2", "gap-20")
  // Optional positions array - if provided, use absolute positioning instead of CSS Grid
  positions?: ShapePosition[];
  // Custom gap values in rem units for row and column gaps
  rowGapRem?: number;
  colGapRem?: number;
  // Maximum number of shapes to display (useful for limiting large grids)
  maxShapes?: number;
}

const GRID_CONFIG = {
  "rectangle-small": { rows: 3, cols: 5, maxPerPage: 15 },
  "rectangle-medium": { rows: 2, cols: 4, maxPerPage: 8 },
  "rectangle-large": { rows: 2, cols: 2, maxPerPage: 4 },
  "circle-small": { rows: 3, cols: 5, maxPerPage: 15 },
  "circle-medium": { rows: 2, cols: 4, maxPerPage: 8 },
  "circle-large": { rows: 1, cols: 4, maxPerPage: 4 },
} as const;

const GridPreset: React.FC<GridPresetProps> = ({
  shape,
  size,
  scale = 1,
  total,
  perPage = total,
  pagination = true,
  completedStates = [],
  onShapeClick,
  onPageChange,
  currentPage,
  gap = "gap-2", // Default gap value
  positions, // Optional absolute positions
  rowGapRem, // Custom row gap in rem
  colGapRem, // Custom column gap in rem
  maxShapes, // Maximum shapes to display
}) => {
  const key = `${shape}-${size}`;
  const config = GRID_CONFIG[key as keyof typeof GRID_CONFIG];
  
  // Apply maxShapes limiter if provided
  const limitedTotal = maxShapes !== undefined ? Math.min(total, maxShapes) : total;
  
  const effectivePerPage = Math.min(perPage, config.maxPerPage);
  const totalPages = Math.ceil(limitedTotal / effectivePerPage);

  const [page, setPage] = useState<number>(currentPage ?? 0);

  // If parent provides a controlled currentPage prop, follow it.
  useEffect(() => {
    if (typeof currentPage === "number" && currentPage !== page) {
      setPage(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Reset pagina naar 0 bij wijzigingen in vorm of totaal, but only when
  // uncontrolled (parent didn't provide currentPage).
  useEffect(() => {
    if (typeof currentPage !== "number") {
      setPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, size, total]);

  // Notify parent when page changes, but only in uncontrolled mode. In
  // controlled mode the parent already knows the page.
  useEffect(() => {
    if (typeof currentPage !== "number" && onPageChange) onPageChange(page);
  }, [page, onPageChange, currentPage]);

  const startIndex = page * effectivePerPage;
  const endIndex = Math.min(startIndex + effectivePerPage, limitedTotal);
  const shapesArray = Array.from({ length: limitedTotal }).slice(startIndex, endIndex);

  const showArrows = pagination && totalPages > 1 && scale !== 1;

  // Calculate gap based on shape - rectangles need more vertical space
  // Use custom gaps if provided, otherwise use defaults
  const defaultRowGap = shape === "rectangle" ? "28rem" : "18rem";
  const rowGap = rowGapRem ? `${rowGapRem}rem` : defaultRowGap;
  const colGap = colGapRem ? `${colGapRem}rem` : "1rem";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="flex items-center w-full h-full">
        {/* Linkerpijl */}
        {showArrows ? (
          <ArrowLeftCircleIcon
            className={`w-10 h-10 text-[var(--color-primary)] cursor-pointer transition-opacity duration-200 mx-2 ${
              page === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            onClick={() => {
              const next = Math.max(page - 1, 0);
              if (typeof currentPage === "number") {
                onPageChange?.(next);
              } else {
                setPage(next);
              }
            }}
          />
        ) : (
          <div className="w-10 h-10 mx-2" />
        )}

        {/* Grid */}
        <div className="flex-1 flex items-center justify-center h-full">
          {positions && positions.length > 0 ? (
            // Absolute positioning mode - use provided coordinates
            <div className="relative w-full h-full">
              {shapesArray.map((_, index) => {
                const absoluteIndex = startIndex + index;
                const pos = positions[index];
                if (!pos) return null;
                
                const completed = completedStates
                  ? !!completedStates[absoluteIndex]
                  : false;

                return (
                  <div
                    key={absoluteIndex}
                    style={{
                      position: 'absolute',
                      left: `${(pos.x / 1280) * 100}%`,
                      top: `${(pos.y / 720) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <Shape
                      shape={shape}
                      size={size}
                      completed={completed}
                      scale={scale}
                      onClick={() => onShapeClick?.(absoluteIndex)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // CSS Grid mode - original behavior
            <div
              className="grid w-full h-full"
              style={{
                gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                justifyItems: 'center',
                alignItems: 'center',
                rowGap: rowGap,
                columnGap: colGap,
              }}
            >
              {shapesArray.map((_, index) => {
                const absoluteIndex = startIndex + index;
                const completed = completedStates
                  ? !!completedStates[absoluteIndex]
                  : false;

                return (
                  <Shape
                    key={absoluteIndex}
                    shape={shape}
                    size={size}
                    completed={completed}
                    scale={scale}
                    onClick={() => onShapeClick?.(absoluteIndex)} // ✅ vaste naam en veilige check
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Rechterpijl */}
        {showArrows ? (
          <ArrowRightCircleIcon
            className={`w-10 h-10 text-[var(--color-primary)] cursor-pointer transition-opacity duration-200 mx-2 ${
              page === totalPages - 1
                ? "opacity-0 pointer-events-none"
                : "opacity-100"
            }`}
            onClick={() => {
              const next = Math.min(page + 1, totalPages - 1);
              if (typeof currentPage === "number") {
                onPageChange?.(next);
              } else {
                setPage(next);
              }
            }}
          />
        ) : (
          <div className="w-10 h-10 mx-2" />
        )}
      </div>

      {showArrows && (
        <div className="absolute bottom-1 mt-2 text-sm text-gray-500">
          Pagina {page + 1} van {totalPages}
        </div>
      )}
    </div>
  );
};

export default GridPreset;
