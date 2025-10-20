import React from "react";

interface ButtonProps {
  text: string;
  type?: "primary" | "secondary";
  onClick?: () => void;
}

const Button = ({ text, type = "primary", onClick }: ButtonProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  if (type === "primary") {
    return (
      <button
        className="px-6 py-4 text-2xl text-[var(--color-white)] font-bold rounded-2xl transition-colors duration-200 cursor-pointer shadow-2xl inline-flex items-center justify-center"
        style={{
          backgroundColor: isHovered
            ? "var(--hover-primary)"
            : "var(--color-primary)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        {text}
      </button>
    );
  }

  // Secondary button
  return (
    <button
      className="border-2 border-[var(--color-primary)] px-6 py-4 text-2xl text-[var(--color-primary)] font-bold rounded-2xl transition-colors duration-200 cursor-pointer shadow-2xl inline-flex items-center justify-center"
      style={{
        backgroundColor: isHovered
          ? "var(--hover-white)"
          : "var(--color-white)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
