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
        <button type="button" onClick={handleClick} className={`w-[286px] h-[340px] rounded-2xl shadow-lg p-4 flex flex-col text-left transition-colors ${active ? 'bg-[var(--color-primary)]/50 text-white' : 'bg-[var(--color-popup)] text-[var(--dark-text)]'}`}>
            {/* Image area */}
            <div className={`rounded-2xl w-full h-[50%] flex flex-col justify-center items-center bg-white`}>
                <div className="w-full">
                    {(
                      preset &&
                      typeof preset.amount === 'number' &&
                      preset.amount > 0 &&
                      (preset.shape === 'circle' || preset.shape === 'rectangle' || preset.shape === 'square') &&
                      (preset.size === 'small' || preset.size === 'medium' || preset.size === 'large')
                    ) ? (
                        // render the actual preset (only when the preset contains valid grid layout data)
                        <GridPreset
                            shape={preset.shape === 'square' ? 'circle' : (preset.shape as any)}
                            size={preset.size as any}
                            scale={0.128}
                            total={preset.amount}
                            pagination={false}
                            rowGapRem={1.5}
                            colGapRem={0.25}
                        />
                    ) : (
                        // fallback preview when preset does not represent a grid layout
                        <GridPreset 
                            shape="circle" 
                            size="medium" 
                            scale={0.128} 
                            total={20} 
                            pagination={false} 
                            rowGapRem={1.5}
                            colGapRem={0.25}
                        />
                    )}
                </div>
            </div>

            {/* Text area */}
            <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
                <p className={`font-semibold text-xl text-[var(--dark-text)] line-clamp-2`}>{title}</p>
                <hr className="border-black/50 border-1 flex-shrink-0" />
                <p className={`text-[var(--color-text)] text-sm line-clamp-3 overflow-hidden`}>{description}</p>
            </div>
        </button>
    );
};

export default GridCard;