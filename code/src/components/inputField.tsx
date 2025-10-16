"use client";

import React from "react";

interface InputFieldProps {
  type: "textField" | "shapeDropdown" | "sizeDropdown";
  label: string;
  hint?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  label,
  hint,
  value,
  onChange,
}) => {
  const baseClass =
    "w-full border border-gray-300 rounded-lg p-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] h-10";

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-bold text-[var(--color-primary)]">{label}</label>


      {type === "textField" && (
        <input
          type="text"
          className={baseClass}
          placeholder={hint}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}

      {type === "shapeDropdown" && (
        <select
          className={baseClass}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="circle">Cirkel</option>
          <option value="rectangle">Rechthoek</option>
        </select>
      )}

      {type === "sizeDropdown" && (
        <select
          className={baseClass}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="small">Klein</option>
          <option value="medium">Gemiddeld</option>
          <option value="large">Groot</option>
        </select>
      )}
    </div>
  );
};

export default InputField;
