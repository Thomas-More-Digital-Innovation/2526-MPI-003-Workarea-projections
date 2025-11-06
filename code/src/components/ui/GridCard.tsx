"use client";

import React from "react";
import GridPreset from "../grid/GridPreset";

interface GridLayoutPreset {
    gridLayoutId: number;
    amount: number;
    shape: string;
    size: string;
}

interface CardProps {
    id: string | number;
    title: string;
    description: string;
    preset?: GridLayoutPreset;
    active?: boolean;
    onSelect?: (id: string | number) => void;
}

const GridCard = ({ id, title, description, preset, active = false, onSelect }: CardProps) => {
    const handleClick = () => onSelect?.(id);

    return (
        <button type="button" onClick={handleClick} className={`w-[282px] h-[348px] rounded-2xl shadow-lg p-4 flex flex-col text-left transition-colors ${active ? 'bg-[var(--color-primary)]/50 text-white' : 'bg-[var(--color-popup)] text-[var(--dark-text)]'}`}>
            {/* Image area */}
            <div className={`rounded-2xl w-full h-[50%] flex flex-col justify-center items-center p-4 bg-white`}>
                <div className="w-full">
                    {preset ? (
                        // render the actual preset
                        <GridPreset
                            shape={preset.shape as any}
                            size={preset.size as any}
                            scale={0.1}
                            total={preset.amount}
                            pagination={false}
                        />
                    ) : (
                        // fallback preview
                        <GridPreset shape="circle" size="medium" scale={0.1} total={20} pagination={false} />
                    )}
                </div>
            </div>

            {/* Text area */}
            <div className="mt-4 flex flex-col gap-2">
                <p className={`font-semibold text-xl text-[var(--dark-text)]`}>{title}</p>
                <hr className="border-black/50 border-1" />
                <p className={`text-[var(--color-text)] text-sm`}>{description}</p>
            </div>
        </button>
    );
};

export default GridCard;