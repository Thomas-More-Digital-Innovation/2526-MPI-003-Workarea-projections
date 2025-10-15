import React from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

interface ShapeProps {
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  completed?: boolean;
}

const Shape: React.FC<ShapeProps> = ({ shape, size, completed = false }) => {

  const sizeStyles =
    shape === "circle"
      ? {
          small: { width: "10vw", height: "10vw" },
          medium: { width: "15vw", height: "15vw" },
          large: { width: "20vw", height: "20vw" },
        }[size]
      : {
          small: { width: "12vw", height: "6vw" },
          medium: { width: "18vw", height: "9vw" },
          large: { width: "24vw", height: "12vw" },
        }[size];

  const borderColor = completed ? "border-green-500" : "border-foreground";

  const badgeSize =
    size === "small"
      ? { width: "2.5vw", height: "2.5vw", icon: "1.2vw" }
      : size === "medium"
      ? { width: "3vw", height: "3vw", icon: "1.5vw" }
      : { width: "4vw", height: "4vw", icon: "2vw" };
      
  const badgeOffset =
    shape === "circle"
      ? {
          small: { top: "0vw", right: "0vw" },
          medium: { top: "0.5vw", right: "0.5vw" },
          large: { top: "1vw", right: "1vw" },
        }[size]
      : {
          small: { top: "-1vw", right: "-1vw" },
          medium: { top: "-1.5vw", right: "-1.5vw" },
          large: { top: "-2vw", right: "-2vw" },
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
              style={{ width: badgeSize.icon, height: badgeSize.icon }}
              className="text-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Shape;
