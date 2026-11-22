import { useEffect, useState } from "react";

/**
 * Busy = this button was clicked and is now disabled because its request is running.
 * Clears itself when the button is enabled again.
 */
export function useClickBusy(disabled: boolean | undefined): [boolean, () => void] {
  const [clicked, setClicked] = useState(false);
  useEffect(() => {
    if (disabled) return;
    const id = setTimeout(() => {
      setClicked(false);
    }, 0);
    return () => {
      clearTimeout(id);
    };
  }, [disabled]);
  return [
    clicked && disabled === true,
    () => {
      setClicked(true);
    },
  ];
}
