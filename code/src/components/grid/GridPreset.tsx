import React, { useState, useEffect } from "react";
import Shape from "./Shape";
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from "@heroicons/react/24/solid";

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
}

const GRID_CONFIG = {
  "rectangle-small": { rows: 3, cols: 5, maxPerPage: 15 },
  "rectangle-medium": { rows: 2, cols: 4, maxPerPage: 8 },
  "rectangle-large": { rows: 2, cols: 3, maxPerPage: 6 },
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
}) => {
  const key = `${shape}-${size}`;
  const config = GRID_CONFIG[key as keyof typeof GRID_CONFIG];
  const effectivePerPage = Math.min(perPage, config.maxPerPage);
  const totalPages = Math.ceil(total / effectivePerPage);

  const [page, setPage] = useState(0);

  // Reset pagina naar 0 bij wijzigingen in vorm of totaal
  useEffect(() => {
    setPage(0);
  }, [shape, size, total]);

  // Meld pagina aan parent
  useEffect(() => {
    if (onPageChange) onPageChange(page);
  }, [page, onPageChange]);

  const startIndex = page * effectivePerPage;
  const endIndex = Math.min(startIndex + effectivePerPage, total);
  const shapesArray = Array.from({ length: total }).slice(startIndex, endIndex);

  const showArrows = pagination && totalPages > 1 && scale !== 1;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="flex items-center w-full">
        {/* Linkerpijl */}
        {showArrows ? (
          <ArrowLeftCircleIcon
            className={`w-10 h-10 text-[var(--color-primary)] cursor-pointer transition-opacity duration-200 mx-2 ${
              page === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          />
        ) : (
          <div className="w-10 h-10 mx-2" />
        )}

        {/* Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="grid gap-1 justify-center"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, auto)`,
              gridTemplateRows: `repeat(${config.rows}, auto)`,
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
                  onClick={() => onShapeClick && onShapeClick(absoluteIndex)} // ✅ vaste naam en veilige check
                />
              );
            })}
          </div>
        </div>

        {/* Rechterpijl */}
        {showArrows ? (
          <ArrowRightCircleIcon
            className={`w-10 h-10 text-[var(--color-primary)] cursor-pointer transition-opacity duration-200 mx-2 ${
              page === totalPages - 1
                ? "opacity-0 pointer-events-none"
                : "opacity-100"
            }`}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
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
