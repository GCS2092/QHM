import React, { createContext, useContext, useState, ReactNode } from "react";
import { X } from "lucide-react";

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(
  undefined,
);

function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error("useAlertDialog must be used within AlertDialog");
  }
  return context;
}

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function AlertDialog({
  open: controlledOpen,
  onOpenChange,
  children,
}: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

interface AlertDialogTriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

export function AlertDialogTrigger({
  asChild,
  children,
}: AlertDialogTriggerProps) {
  const { setOpen } = useAlertDialog();

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as {
      onClick?: (e: React.MouseEvent) => void;
    };
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        childProps.onClick?.(e);
        setOpen(true);
      },
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

interface AlertDialogContentProps {
  children: ReactNode;
}

export function AlertDialogContent({ children }: AlertDialogContentProps) {
  const { open, setOpen } = useAlertDialog();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-lg max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">{children}</div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-lg shrink-0"
            title="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface AlertDialogTitleProps {
  children: ReactNode;
}

export function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return <h3 className="font-semibold text-gray-900">{children}</h3>;
}

interface AlertDialogDescriptionProps {
  children: ReactNode;
}

export function AlertDialogDescription({
  children,
}: AlertDialogDescriptionProps) {
  return <p className="text-sm text-gray-600 mt-2">{children}</p>;
}

interface AlertDialogCancelProps {
  children: ReactNode;
  onClick?: () => void;
}

export function AlertDialogCancel({
  children,
  onClick,
}: AlertDialogCancelProps) {
  const { setOpen } = useAlertDialog();

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

interface AlertDialogActionProps {
  children: ReactNode;
  destructive?: boolean;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
}

export function AlertDialogAction({
  children,
  destructive,
  onClick,
  disabled,
}: AlertDialogActionProps) {
  const { setOpen } = useAlertDialog();

  return (
    <button
      type="button"
      onClick={async () => {
        await onClick?.();
        setOpen(false);
      }}
      disabled={disabled}
      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
        destructive
          ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      }`}
    >
      {children}
    </button>
  );
}
