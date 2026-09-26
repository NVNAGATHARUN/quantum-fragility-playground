import { RefObject, useEffect, useRef } from "react";

/** Trap focus, close on Escape, and return focus to the invoking control. */
export function useDialogFocus(
  open: boolean,
  ref: RefObject<HTMLElement>,
  onClose: () => void,
) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const selector =
      'a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]';
    const frame = requestAnimationFrame(() =>
      (
        (ref.current?.querySelector(
          "[autofocus],input,textarea",
        ) as HTMLElement) ||
        (ref.current?.querySelector(selector) as HTMLElement)
      )?.focus(),
    );
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const items = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(selector) || [],
        ).filter((el) => el.getClientRects().length);
        if (!items.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !ref.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          last.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handle, true);
      previous?.focus();
    };
  }, [open, ref]);
}
