"use client";
import { Languages, User2 } from "lucide-react";
import { Button } from "./button";

export default function Header() {
  return (
    <header className="flex w-full flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          </div>
          <Button>
            <Languages className="h-4 w-4" />
          </Button>
          <Button className="">
            <User2 className="h-4 w-4" />
            Login
          </Button>
        </div>
      </div>
    </header>
  );
}
