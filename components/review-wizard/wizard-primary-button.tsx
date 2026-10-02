"use client";

import { useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WizardPrimaryButtonProps = {
  /** When true, the control stays greyed out and non-interactive. */
  disabled?: boolean;
  /** Click handler; ignored while disabled. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Button label and optional leading icons. */
  children: ReactNode;
  /** Extra classes merged onto the Button. */
  className?: string;
  /** Native button type. Defaults to "button". */
  type?: "button" | "submit" | "reset";
};

/**
 * Primary next-step / gated action for the review wizard.
 * Stays visibly grey while disabled, then plays a one-shot soft
 * fade + scale + green glow when it becomes enabled.
 * Honors prefers-reduced-motion (skips the enable animation).
 */
export function WizardPrimaryButton({
  disabled = false,
  onClick,
  children,
  className,
  type = "button",
}: WizardPrimaryButtonProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const wasDisabledRef = useRef(disabled);
  const [enableAnim, setEnableAnim] = useState(false);

  useEffect(() => {
    const wasDisabled = wasDisabledRef.current;
    wasDisabledRef.current = disabled;

    if (wasDisabled && !disabled && !reduceMotion) {
      setEnableAnim(true);
    }
  }, [disabled, reduceMotion]);

  /**
   * Clears the one-shot class after the CSS animation finishes.
   */
  function handleAnimationEnd(): void {
    setEnableAnim(false);
  }

  return (
    <Button
      type={type}
      size="lg"
      disabled={disabled}
      onClick={onClick}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        handleAnimationEnd();
      }}
      className={cn(
        "h-12 w-full text-base",
        "disabled:bg-[color:var(--brand-line)] disabled:text-[color:var(--brand-muted)]",
        "disabled:opacity-100 disabled:shadow-none disabled:hover:bg-[color:var(--brand-line)]",
        enableAnim && "wizard-action-enable transition-none",
        className
      )}
    >
      {children}
    </Button>
  );
}
