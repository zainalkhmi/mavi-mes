/**
 * shadcnVirtualFiles.js
 * High-performance virtual implementations of core shadcn/ui components for the Sandpack Sandbox.
 * Provides Button, Card, Badge, Input, Dialog, Tabs, and the `cn` utility.
 */

export const SHADCN_UTILS_CODE = `import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export default cn;
`;

export const SHADCN_BUTTON_CODE = `import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        secondary: "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
        ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
`;

export const SHADCN_CARD_CODE = `import React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50", className)}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-slate-50", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export default Card;
`;

export const SHADCN_BADGE_CODE = `import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600 text-white shadow hover:bg-blue-700",
        secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50",
        destructive: "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
        outline: "text-slate-950 dark:text-slate-50 border-slate-200 dark:border-slate-800",
        success: "border-transparent bg-emerald-500 text-white shadow hover:bg-emerald-600",
        warning: "border-transparent bg-amber-500 text-white shadow hover:bg-amber-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export default Badge;
`;

export const SHADCN_INPUT_CODE = `import React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
export default Input;
`;

export const SHADCN_DIALOG_CODE = `import React, { createContext, useContext, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const DialogContext = createContext({
  open: false,
  setOpen: () => {},
});

function Dialog({ children, open: controlledOpen, onOpenChange }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (val) => {
    if (!isControlled) setUncontrolledOpen(val);
    if (onOpenChange) onOpenChange(val);
  };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ children, asChild, ...props }) {
  const { setOpen } = useContext(DialogContext);
  return (
    <span onClick={() => setOpen(true)} className="cursor-pointer inline-flex" {...props}>
      {children}
    </span>
  );
}

function DialogContent({ children, className, ...props }) {
  const { open, setOpen } = useContext(DialogContext);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={cn(
          "relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-50 animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-50", className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />;
}

function DialogClose({ children, ...props }) {
  const { setOpen } = useContext(DialogContext);
  return (
    <span onClick={() => setOpen(false)} className="cursor-pointer inline-flex" {...props}>
      {children}
    </span>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
export default Dialog;
`;

export const SHADCN_TABS_CODE = `import React, { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext({
  value: "",
  setValue: () => {},
});

function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children, ...props }) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const setValue = (val) => {
    if (!isControlled) setUncontrolledValue(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ value, className, children, ...props }) {
  const { value: activeValue, setValue } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50 font-semibold"
          : "hover:text-slate-900 dark:hover:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className, children, ...props }) {
  const { value: activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;

  return (
    <div
      className={cn(
        "mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
export default Tabs;
`;

export const SHADCN_INDEX_CODE = `export * from './button';
export * from './card';
export * from './badge';
export * from './input';
export * from './dialog';
export * from './tabs';
`;

/**
 * Combined virtual file map to mount into Sandpack Virtual File System
 */
export const SHADCN_UI_VIRTUAL_FILES = {
  // Utils
  '/lib/utils.js': SHADCN_UTILS_CODE,
  '/src/lib/utils.js': SHADCN_UTILS_CODE,

  // Button
  '/components/ui/button.jsx': SHADCN_BUTTON_CODE,
  '/components/ui/button.js': SHADCN_BUTTON_CODE,
  '/src/components/ui/button.jsx': SHADCN_BUTTON_CODE,
  '/src/components/ui/button.js': SHADCN_BUTTON_CODE,

  // Card
  '/components/ui/card.jsx': SHADCN_CARD_CODE,
  '/components/ui/card.js': SHADCN_CARD_CODE,
  '/src/components/ui/card.jsx': SHADCN_CARD_CODE,
  '/src/components/ui/card.js': SHADCN_CARD_CODE,

  // Badge
  '/components/ui/badge.jsx': SHADCN_BADGE_CODE,
  '/components/ui/badge.js': SHADCN_BADGE_CODE,
  '/src/components/ui/badge.jsx': SHADCN_BADGE_CODE,
  '/src/components/ui/badge.js': SHADCN_BADGE_CODE,

  // Input
  '/components/ui/input.jsx': SHADCN_INPUT_CODE,
  '/components/ui/input.js': SHADCN_INPUT_CODE,
  '/src/components/ui/input.jsx': SHADCN_INPUT_CODE,
  '/src/components/ui/input.js': SHADCN_INPUT_CODE,

  // Dialog
  '/components/ui/dialog.jsx': SHADCN_DIALOG_CODE,
  '/components/ui/dialog.js': SHADCN_DIALOG_CODE,
  '/src/components/ui/dialog.jsx': SHADCN_DIALOG_CODE,
  '/src/components/ui/dialog.js': SHADCN_DIALOG_CODE,

  // Tabs
  '/components/ui/tabs.jsx': SHADCN_TABS_CODE,
  '/components/ui/tabs.js': SHADCN_TABS_CODE,
  '/src/components/ui/tabs.jsx': SHADCN_TABS_CODE,
  '/src/components/ui/tabs.js': SHADCN_TABS_CODE,

  // Index / Barrel
  '/components/ui/index.js': SHADCN_INDEX_CODE,
  '/components/ui/index.jsx': SHADCN_INDEX_CODE,
  '/components/ui.js': SHADCN_INDEX_CODE,
  '/components/ui.jsx': SHADCN_INDEX_CODE,
  '/src/components/ui/index.js': SHADCN_INDEX_CODE,
  '/src/components/ui/index.jsx': SHADCN_INDEX_CODE,
  '/src/components/ui.js': SHADCN_INDEX_CODE,
  '/src/components/ui.jsx': SHADCN_INDEX_CODE,
};
