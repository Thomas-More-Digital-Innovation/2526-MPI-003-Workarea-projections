"use client";

import React from "react";
import Button from "../ui/Button";



const Footer: React.FC = ({
}) => {
  return (
    <footer className="bg-white shadow-md px-6 py-3 flex items-center justify-between m-2 rounded-2xl fixed bottom-0 left-0 right-0 max-w-[calc(100%-1rem)] mx-auto z-10">
      <Button type="secondary" text={"Bewerken"} onClick={() => {}} />
      <Button type="primary" text={"Start"} onClick={() => {}} />
    </footer>
  );
};

export default Footer;
