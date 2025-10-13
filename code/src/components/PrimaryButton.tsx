import React from "react";

const PrimaryButton = ({ text }: { text: string}) => {
  return (
    <div>
      <button className="bg-[var(--color-primary)] w-[100%] p-4 text-[var(--color-white)] font-bold text-lg rounded">{ text }</button>
    </div>
  );
};

export default PrimaryButton;
