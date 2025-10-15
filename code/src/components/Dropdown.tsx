'use client'
import React from 'react';

const DropdownContext = React.createContext({
    open: false,
    setOpen: (open: boolean) => {},
});


function Dropdown({ children, ...props }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    
    return (
        <DropdownContext.Provider value={{ open, setOpen }}>
            <div className="relative">{children}</div>
        </DropdownContext.Provider>
    );
}

function DropdownButton({ children, ...props }: { children: React.ReactNode }) {
    const { open, setOpen } = React.useContext(DropdownContext);
    const [isHovered, setIsHovered] = React.useState(false);

    function toggleOpen() {
        setOpen(!open);
    }

    return (
        <button
            onClick={toggleOpen}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`flex h-[64px] items-center justify-between p-3 w-[228px] font-bold text-[var(--color-primary)] shadow-lg border border-gray-200 transition-all duration-200
                ${open ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl'}
            `}
            style={{
                backgroundColor: isHovered
                    ? 'var(--hover-white)'
                    : 'var(--color-white)',
                boxShadow: isHovered
                    ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                    : '0 2px 6px rgba(0, 0, 0, 0.1)',
            }}
            {...props}
        >
            <span className="text-left text-2xl">{children}</span>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                width={20}
                height={20}
                strokeWidth={4}
                stroke="currentColor"
                className={`transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </button>
    );
}

function DropdownMenu({ children, ...props }: { children: React.ReactNode }) {
    const { open } = React.useContext(DropdownContext);
    const menuRef = React.useRef<HTMLDivElement>(null);

    if (!open) return null;

    return (
        <div
            ref={menuRef}
            className="absolute mt-0 bg-[var(--color-white)] border border-gray-200 border-t-0 rounded-b-2xl shadow-lg z-10 w-[228px] animate-fadeIn"
            {...props}
        >
            {children}
        </div>
    );
}

function DropdownItem({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void }) {
    const { setOpen } = React.useContext(DropdownContext);
    const [isHovered, setIsHovered] = React.useState(false);

    function handleClick() {
        onClick?.();
        setOpen(false);
    }

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="block w-full text-left px-4 py-3 font-semibold transition-all duration-200 border-b border-gray-200 last:border-b-0 last:rounded-b-2xl text-2xl"
            style={{
                color: isHovered ? 'var(--hover-primary)' : 'var(--color-primary)',
                backgroundColor: isHovered ? 'var(--hover-white)' : 'transparent',
            }}
            {...props}
        >
            {children}
        </button>
    );
}


Dropdown.Button = DropdownButton;
Dropdown.Menu = DropdownMenu;
Dropdown.Item = DropdownItem;

export default Dropdown;