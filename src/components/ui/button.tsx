import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 active:scale-95",
          {
            "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-green-500/30":
              variant === "default",
            "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 hover:shadow-red-500/30":
              variant === "destructive",
            "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent":
              variant === "outline",
            "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80":
              variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline":
              variant === "link",
          },
          {
            "h-10 px-6 py-2": size === "default",
            "h-9 rounded-full px-4": size === "sm",
            "h-12 rounded-full px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
