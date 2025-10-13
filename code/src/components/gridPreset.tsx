import React from "react";
import Shape from "./shape";

interface GridPresetProps {
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
}

const GridPreset: React.FC<GridPresetProps> = ({ shape, size }) => {
  // 📊 Mapping van rows, columns en totaal aantal shapes
  const gridConfig: Record<
    string,
    { rows: number; cols: number; total: number }
  > = {
    "rectangle-small": { rows: 3, cols: 5, total: 15 },
    "rectangle-medium": { rows: 2, cols: 4, total: 8 },
    "rectangle-large": { rows: 2, cols: 3, total: 6 },
    "circle-small": { rows: 3, cols: 5, total: 15 },
    "circle-medium": { rows: 2, cols: 4, total: 8 },
    "circle-large": { rows: 1, cols: 4, total: 4 },
  };

  const key = `${shape}-${size}`;
  const config = gridConfig[key];

  // Maak een array van de juiste lengte om te mappen
  const shapesArray = Array.from({ length: config.total });

  return (
    <div className="h-screen flex items-center justify-center">
      <div
        className={`grid gap-10`}
        style={{
          gridTemplateColumns: `repeat(${config.cols}, auto)`,
          gridTemplateRows: `repeat(${config.rows}, auto)`,
        }}
      >
        {shapesArray.map((_, index) => (
          <Shape key={index} shape={shape} size={size} completed={false} />
        ))}
      </div>
    </div>
  );
};

export default GridPreset;
