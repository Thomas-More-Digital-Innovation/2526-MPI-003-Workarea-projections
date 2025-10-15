import React from "react";


type ButtonProps = {
  text: string;
  type?: "primary" | "secondary";
  onClick?: () => void;
};

const Button = ({ text, type = "primary", onClick }: ButtonProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  if (type === "primary") {
    return (
      <button
        className="w-full p-4 text-[var(--color-white)] font-bold text-lg rounded-2xl transition-colors duration-200 cursor-pointer shadow-2xl"
        style={{
          backgroundColor: isHovered ? "var(--hover-primary)" : "var(--color-primary)",
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
      className="border-2 border-[var(--color-primary)] w-full p-4 text-[var(--color-primary)] font-bold text-lg rounded-2xl transition-colors duration-200 cursor-pointer shadow-2xl"
      style={{
        backgroundColor: isHovered ? "var(--hover-white)" : "var(--color-white)",
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