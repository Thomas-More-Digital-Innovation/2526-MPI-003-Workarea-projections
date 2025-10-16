import React, { useState } from "react";
import Shape from "./shape";
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from "@heroicons/react/24/solid";

interface GridPresetProps {
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  scale?: number; // Optionele schaalfactor
  total: number;
  perPage?: number;
}

const GridPreset: React.FC<GridPresetProps> = ({ shape, size, scale = 1, total, perPage = total }) => {
  const gridConfig: Record<
    string,
    { rows: number; cols: number; maxPerPage: number }
  > = {
    "rectangle-small": { rows: 3, cols: 5, maxPerPage: 15 },
    "rectangle-medium": { rows: 2, cols: 4, maxPerPage: 8 },
    "rectangle-large": { rows: 2, cols: 3, maxPerPage: 6 },
    "circle-small": { rows: 3, cols: 5, maxPerPage: 15 },
    "circle-medium": { rows: 2, cols: 4, maxPerPage: 8 },
    "circle-large": { rows: 1, cols: 4, maxPerPage: 4 },
  };

  const key = `${shape}-${size}`;
  const config = gridConfig[key];
  const effectivePerPage = Math.min(perPage, config.maxPerPage);
  const totalPages = Math.ceil(total / effectivePerPage);

  const [page, setPage] = useState(0);

  const startIndex = page * effectivePerPage;
  const endIndex = Math.min(startIndex + effectivePerPage, total);
  const shapesArray = Array.from({ length: total }).slice(startIndex, endIndex);

  const showArrows = totalPages > 1 && scale !== 1;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="flex items-center justify-between w-full px-5">
        {/* Linkerpijl of placeholder */}
        {showArrows ? (
          <ArrowLeftCircleIcon
            className={`w-10 h-10 text-[var(--color-primary)] cursor-pointer transition-opacity duration-200 mx-2 ${
              page === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          />
        ) : (
          <div className="w-10 h-10 mx-2" /> // placeholder voor centrering
        )}

        {/* Grid */}
        <div
          className={`${!scale ? "h-screen flex items-center justify-center" : ""}`}
        >
          <div
            className="grid gap-10 justify-center"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, auto)`,
              gridTemplateRows: `repeat(${config.rows}, auto)`,
            }}
          >
            {shapesArray.map((_, index) => (
              <Shape
                key={index}
                shape={shape}
                size={size}
                completed={false}
                scale={scale}
              />
            ))}
          </div>
        </div>

        {/* Rechterpijl of placeholder */}
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
          <div className="w-10 h-10 mx-2" /> // placeholder voor centrering
        )}
      </div>

      {/* Pagina-indicator */}
      {showArrows && (
        <div className="absolute bottom-1 mt-2 text-sm text-gray-500">
          Pagina {page + 1} van {totalPages}
        </div>
      )}
    </div>
  );
};

export default GridPreset;
