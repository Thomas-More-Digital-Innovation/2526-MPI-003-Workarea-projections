import React from "react";
import Shape from "./shape";

interface GridPresetProps {
  name: string;
  price: number;
}

const GridPreset: React.FC<GridPresetProps> = ({ name, price }) => {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="grid grid-cols-4 gap-8">
        <Shape shape="rectangle" size="small" completed={true} />
        <Shape shape="rectangle" size="medium" completed={true} />
        <Shape shape="rectangle" size="large" completed={true} />
        <Shape shape="rectangle" size="small" completed={false} />
        <Shape shape="rectangle" size="medium" completed={false} />
        <Shape shape="rectangle" size="large" completed={false} />
        <Shape shape="rectangle" size="small" completed={false} />
        <Shape shape="rectangle" size="medium" completed={false} />
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">{name}</h2>
        <p className="text-gray-600">€{price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default GridPreset;
