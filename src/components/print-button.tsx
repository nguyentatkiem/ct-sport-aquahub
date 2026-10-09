"use client";
import { Printer } from "lucide-react";
import { Button } from "./ui";

export function PrintButton({ label = "In" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()}>
      <Printer className="size-4" /> {label}
    </Button>
  );
}
