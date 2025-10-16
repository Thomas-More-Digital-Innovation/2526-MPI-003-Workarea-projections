import React from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

interface ShapeProps {
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  completed: boolean;
  scale?: number;
}

const SHAPE_SIZES = {
  circle: {
    small: { width: 10, height: 10 },
    medium: { width: 15, height: 15 },
    large: { width: 20, height: 20 },
  },
  rectangle: {
    small: { width: 12, height: 6 },
    medium: { width: 18, height: 9 },
    large: { width: 24, height: 12 },
  },
} as const;

const BADGE_SIZES = {
  small: { width: 2.5, height: 2.5, icon: 1.2 },
  medium: { width: 3, height: 3, icon: 1.5 },
  large: { width: 4, height: 4, icon: 2 },
} as const;

const BADGE_OFFSETS = {
  circle: {
    small: { top: 0, right: 0 },
    medium: { top: 0.5, right: 0.5 },
    large: { top: 1, right: 1 },
  },
  rectangle: {
    small: { top: -1, right: -1 },
    medium: { top: -1.5, right: -1.5 },
    large: { top: -2, right: -2 },
  },
} as const;

const Shape: React.FC<ShapeProps> = ({
  shape,
  size,
  completed = false,
  scale = 1,
}) => {
  const sizeStyles = {
    width: `${SHAPE_SIZES[shape][size].width * scale}vw`,
    height: `${SHAPE_SIZES[shape][size].height * scale}vw`,
  };

  const borderColor = completed ? "border-green-500" : "border-foreground";

  const badgeSize = {
    width: `${BADGE_SIZES[size].width * scale}vw`,
    height: `${BADGE_SIZES[size].height * scale}vw`,
    icon: `${BADGE_SIZES[size].icon * scale}vw`,
  };

  const badgeOffset = {
    top: `${BADGE_OFFSETS[shape][size].top * scale}vw`,
    right: `${BADGE_OFFSETS[shape][size].right * scale}vw`,
  };

  return (
    <div className="relative inline-block">
      {/* Shape */}
      <div
        style={sizeStyles}
        className={`border-2 ${borderColor} ${
          shape === "circle" ? "rounded-full" : "rounded-lg"
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
