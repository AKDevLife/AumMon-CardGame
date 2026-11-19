import { StickerButton } from "../../components/StickerButton.tsx";
import { SharedDeviceNotice } from "./SharedDeviceNotice.tsx";

/** Task 5.3 — Privacy Handoff: nothing private is on screen until the next player confirms. */
export function HandoffScreen({
  name,
  pending,
  onReveal,
}: {
  name: string;
  pending: boolean;
  onReveal: () => void;
}) {
  return (
    <div className="am-sticker flex flex-col items-center gap-4 bg-am-deco-purple p-6 text-center">
      <p className="text-lg">ส่งเครื่องให้</p>
      <h2 className="font-display text-4xl font-bold">{name}</h2>
      <StickerButton
        variant="confirm"
        disabled={pending}
        onClick={onReveal}
        className="min-h-14 w-full"
      >
        ฉันคือ {name} — แสดงการ์ด
      </StickerButton>
      <SharedDeviceNotice />
    </div>
  );
}
