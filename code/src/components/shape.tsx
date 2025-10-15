import React from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

interface ShapeProps {
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  completed?: boolean;
  scale?: number; // 👈 nieuwe prop
}

const Shape: React.FC<ShapeProps> = ({
  shape,
  size,
  completed = false,
  scale = 1,
}) => {
  const sizeStyles =
    shape === "circle"
      ? {
          small: { width: `${10 * scale}vw`, height: `${10 * scale}vw` },
          medium: { width: `${15 * scale}vw`, height: `${15 * scale}vw` },
          large: { width: `${20 * scale}vw`, height: `${20 * scale}vw` },
        }[size]
      : {
          small: { width: `${12 * scale}vw`, height: `${6 * scale}vw` },
          medium: { width: `${18 * scale}vw`, height: `${9 * scale}vw` },
          large: { width: `${24 * scale}vw`, height: `${12 * scale}vw` },
        }[size];

  const borderColor = completed ? "border-green-500" : "border-foreground";

  const badgeSize =
    size === "small"
      ? { width: `${2.5 * scale}vw`, height: `${2.5 * scale}vw`, icon: `${1.2 * scale}vw` }
      : size === "medium"
      ? { width: `${3 * scale}vw`, height: `${3 * scale}vw`, icon: `${1.5 * scale}vw` }
      : { width: `${4 * scale}vw`, height: `${4 * scale}vw`, icon: `${2 * scale}vw` };

  const badgeOffset =
    shape === "circle"
      ? {
          small: { top: `${0 * scale}vw`, right: `${0 * scale}vw` },
          medium: { top: `${0.5 * scale}vw`, right: `${0.5 * scale}vw` },
          large: { top: `${1 * scale}vw`, right: `${1 * scale}vw` },
        }[size]
      : {
          small: { top: `${-1 * scale}vw`, right: `${-1 * scale}vw` },
          medium: { top: `${-1.5 * scale}vw`, right: `${-1.5 * scale}vw` },
          large: { top: `${-2 * scale}vw`, right: `${-2 * scale}vw` },
        }[size];

  return (
    <div className="relative inline-block">
      {/* Shape */}
      <div
        style={sizeStyles}
        className={`border-2 ${borderColor} ${
          shape === "circle" ? "rounded-full" : ""
        }`}
      >
        {/* Completed badge */}
        {completed && (
          <div
            className="absolute bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
            style={{
              width: badgeSize.width,
              height: badgeSize.height,
              top: badgeOffset.top,
              right: badgeOffset.right,
            }}
          >
            <CheckIcon
              style={{
                width: badgeSize.icon,
                height: badgeSize.icon,
              }}
              className="text-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Shape;
