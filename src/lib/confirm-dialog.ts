import { create } from "zustand";

export interface ConfirmDialogOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmDialogState {
  open: boolean;
  options: ConfirmDialogOptions | null;
  resolve: ((value: boolean) => void) | null;
  requestConfirm: (options: string | ConfirmDialogOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmDialogStore = create<ConfirmDialogState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  requestConfirm: (rawOptions) => {
    const prevResolve = get().resolve;
    if (prevResolve) prevResolve(false);

    const options: ConfirmDialogOptions =
      typeof rawOptions === "string"
        ? {
            title: "Потвърждение",
            description: rawOptions,
            confirmLabel: "Потвърди",
            cancelLabel: "Отказ",
            variant: "destructive",
          }
        : {
            title: rawOptions.title || "Потвърждение",
            description: rawOptions.description,
            confirmLabel: rawOptions.confirmLabel || "Потвърди",
            cancelLabel: rawOptions.cancelLabel || "Отказ",
            variant: rawOptions.variant || "destructive",
          };

    return new Promise<boolean>((resolve) => {
      set({ open: true, options, resolve });
    });
  },
  handleConfirm: () => {
    const { resolve } = get();
    set({ open: false, options: null, resolve: null });
    resolve?.(true);
  },
  handleCancel: () => {
    const { resolve } = get();
    set({ open: false, options: null, resolve: null });
    resolve?.(false);
  },
}));

/**
 * Accessible async confirmation dialog replacing native window.confirm().
 */
export function confirmDialog(
  options: string | ConfirmDialogOptions
): Promise<boolean> {
  return useConfirmDialogStore.getState().requestConfirm(options);
}
