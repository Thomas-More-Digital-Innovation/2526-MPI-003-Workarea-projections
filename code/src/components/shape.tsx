import React from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

interface ShapeProps {
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  completed?: boolean;
}

const Shape: React.FC<ShapeProps> = ({ shape, size, completed = false }) => {
  const sizeClasses =
    shape === "circle"
      ? {
        small: "w-24 h-24",
        medium: "w-36 h-36",
        large: "w-48 h-48",
      }[size]
      : {
        small: "w-32 h-16",
        medium: "w-48 h-24",
        large: "w-64 h-32",
      }[size];

  const borderColor = completed ? "border-green-500" : "border-foreground";

  const badgePosition =
    shape === "circle"
      ? {
        small: "-top-1 -right-1",
        medium: "-top-0 -right-0",
        large: "-top-0 -right-0",
      }[size]
      : {
        small: "-top-4 -right-4",
        medium: "-top-5 -right-5",
        large: "-top-6 -right-6",
      }[size];
      

  const badgeSize =
    size === "small" ? "w-8 h-8" : size === "medium" ? "w-10 h-10" : "w-12 h-12";

  const iconSize =
    size === "small" ? "w-5 h-5" : size === "medium" ? "w-6 h-6" : "w-8 h-8";

  return (
    <div className="relative inline-block">
      {/* Shape */}
      {shape === "circle" ? (
        <div
          className={`${sizeClasses} border-2 relative ${borderColor} rounded-full`}
        >
          {/* Completed badge */}
          {completed && (
            <div
              className={`absolute ${badgePosition} ${badgeSize} bg-green-500 rounded-full flex items-center justify-center border-2 border-white`}
            >
              <CheckIcon className={`${iconSize} text-white`} />
            </div>
          )}
        </div>
      ) : (
        <div className={`${sizeClasses} border-2 relative ${borderColor}`}>
          {/* Completed badge */}
          {completed && (
            <div
              className={`absolute ${badgePosition} ${badgeSize} bg-green-500 rounded-full flex items-center justify-center border-2 border-white`}
            >
              <CheckIcon className={`${iconSize} text-white`} />
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default Shape;
