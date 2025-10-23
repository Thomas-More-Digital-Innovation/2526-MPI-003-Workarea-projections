import React from "react";

interface ButtonProps {
  text: string;
  type?: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  fixedWidth?: boolean;
}

const Button = ({ text, type = "primary", onClick, fullWidth = true, fixedWidth = false, disabled = false }: ButtonProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const widthClass = fullWidth ? 'w-full' : 'w-auto';
  // fixed width that matches the 'Toevoegen' button on the homepage
  const fixedWidthClass = fixedWidth ? 'w-75' : widthClass;

  if (type === "primary") {
  const hoverColor = isHovered ? "var(--hover-primary)" : "var(--color-primary)";
  const backgroundColor = disabled ? "#9ca3af" : hoverColor;
    return (
      <button
        className={`${fixedWidthClass} text-2xl p-4 text-[var(--color-white)] font-bold rounded-2xl transition-colors duration-200 cursor-pointer shadow-2xl flex items-center justify-center`}
        style={{
          backgroundColor,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        {text}
      </button>
    );
  }

  // Secondary button
  return (
    <button
      className={`border-2 border-[var(--color-primary)] ${fixedWidthClass} p-4 text-2xl text-[var(--color-primary)] font-bold rounded-2xl transition-colors duration-200 cursor-pointer shadow-2xl flex items-center justify-center`}
      style={{
        backgroundColor: isHovered ? "var(--hover-white)" : "var(--color-white)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
