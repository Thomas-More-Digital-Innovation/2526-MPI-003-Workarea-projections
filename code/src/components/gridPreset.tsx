import React from "react";
import Shape from "./shape";

interface GridPresetProps {
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  scale?: number; // Optionele schaalfactor
  total?: number;
}

const GridPreset: React.FC<GridPresetProps> = ({ shape, size, scale, total }) => {
  const gridConfig: Record<
    string,
    { rows: number; cols: number; total: number }
  > = {
    "rectangle-small": { rows: 3, cols: 5, total: Math.min(total || 0, 15) },
    "rectangle-medium": { rows: 2, cols: 4, total: Math.min(total || 0, 8) },
    "rectangle-large": { rows: 2, cols: 3, total: Math.min(total || 0, 6) },
    "circle-small": { rows: 3, cols: 5, total: Math.min(total || 0, 15) },
    "circle-medium": { rows: 2, cols: 4, total: Math.min(total || 0, 8) },
    "circle-large": { rows: 1, cols: 4, total: Math.min(total || 0, 4) },
  };

  const key = `${shape}-${size}`;
  const config = gridConfig[key];

  const shapesArray = Array.from({ length: config.total });

  return (
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
  );
};

export default GridPreset;
