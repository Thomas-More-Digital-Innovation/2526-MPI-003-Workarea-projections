"use client";

import React from "react";
import Button from "../ui/Button";

interface FooterProps {
  children?: React.ReactNode;
}

const Footer: React.FC<FooterProps> = ({ children }) => {
  return (
    <footer className="bg-white shadow-md px-3 py-3 flex items-center justify-between rounded-2xl w-full">
      {children}
    </footer>
  );
};

export default Footer;
