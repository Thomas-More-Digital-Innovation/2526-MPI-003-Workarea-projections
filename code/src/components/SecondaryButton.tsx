import React from "react";

const SecondaryButton = ({ text }: { text: string}) => {
  return (
    <div>
      <button className="bg-[var(--color-white)] border-2 border-[var(--color-primary)] w-[100%] p-4 text-[var(--color-primary)] font-bold text-lg rounded-lg">{ text }</button>
    </div>
  );
};

export default SecondaryButton;
