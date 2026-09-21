import React, { useState } from "react";
import { cn } from "../utils/cn";
import { Bot } from "lucide-react";

export const LISYAN_AI_LOGO_URL = "https://github.com/user-attachments/assets/5805610d-ed98-41c3-9b92-83e53dc1adb4";

export interface LogoProps {
  className?: string;
  ringed?: boolean;
  variant?: "badge" | "raw";
}

export default function Logo({ className, ringed = false, variant = "badge" }: LogoProps) {
  const [hasError, setHasError] = useState(false);

  if (variant === "raw") {
    if (hasError) return <Bot className={cn("text-white", className)} />;
    return (
      <img
        src={LISYAN_AI_LOGO_URL}
        alt="Lisyan AI"
        className={cn("object-contain brightness-0 invert", className)}
        style={{ filter: "brightness(0) invert(1)" }}
        draggable={false}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full shadow-md bg-[var(--s-brand)] p-1",
        ringed && "ring-4 ring-white/60",
        className,
      )}
    >
      {!hasError ? (
        <img
          src={LISYAN_AI_LOGO_URL}
          alt="Lisyan AI"
          className="h-full w-full object-contain brightness-0 invert"
          style={{ filter: "brightness(0) invert(1)" }}
          draggable={false}
          onError={() => setHasError(true)}
        />
      ) : (
        <Bot className="h-3/5 w-3/5 text-white" />
      )}
    </span>
  );
}
