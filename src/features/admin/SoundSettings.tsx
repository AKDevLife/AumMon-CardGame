import { useState } from "react";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError } from "../../lib/api.ts";
import {
  defaultSoundConfig,
  normalizeSoundConfig,
  PRESETS,
  previewPreset,
  SOUND_EVENTS,
  type PresetId,
  type SoundConfig,
  type SoundEvent,
} from "../tcg/sound.ts";
import { dateTime } from "./format.ts";

/** Admin editor for the global sound settings (preset, volume, on/off per game moment). */
export function SoundSettings({
  stored,
  updatedAt,
  onSave,
}: {
  stored: unknown;
  updatedAt: unknown;
  onSave: (value: SoundConfig) => Promise<void>;
}) {
  const [config, setConfig] = useState<SoundConfig>(() => normalizeSoundConfig(stored));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const events = Object.keys(SOUND_EVENTS) as SoundEvent[];
  const presets = Object.keys(PRESETS) as PresetId[];

  const update = (e: SoundEvent, patch: Partial<SoundConfig[SoundEvent]>) => {
    setConfig({ ...config, [e]: { ...config[e], ...patch } });
    setStatus(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(config);
      setStatus("บันทึกแล้ว ✅ ผู้เล่นจะได้ยินเสียงใหม่ในเกมถัดไปที่เปิด");
    } catch (e) {
      setStatus(e instanceof ApiError ? `บันทึกไม่สำเร็จ: ${e.message}` : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-am-muted">
        แก้ไขล่าสุด: {updatedAt ? dateTime(updatedAt) : "ยังไม่เคยแก้ (ใช้ค่าเริ่มต้น)"} · กด ▶ เพื่อฟังก่อนบันทึก
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {events.map((e) => {
          const s = config[e];
          return (
            <li key={e} className="am-sticker flex flex-col gap-2 bg-am-card p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-bold">{SOUND_EVENTS[e].label}</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(ev) => {
                      update(e, { enabled: ev.target.checked });
                    }}
                  />
                  เปิดเสียง
                </label>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label={`เสียงของ ${SOUND_EVENTS[e].label}`}
                  value={s.preset}
                  disabled={!s.enabled}
                  onChange={(ev) => {
                    update(e, { preset: ev.target.value as PresetId });
                  }}
                  className="am-sticker min-h-10 flex-1 bg-am-card px-2 shadow-none"
                >
                  {presets.map((p) => (
                    <option key={p} value={p}>
                      {PRESETS[p].label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`ฟังเสียง ${SOUND_EVENTS[e].label}`}
                  onClick={() => {
                    previewPreset(s.preset, s.volume);
                  }}
                  className="am-sticker am-pressable bg-am-hover px-3 py-1.5 font-bold"
                >
                  ▶
                </button>
              </div>
              <label className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-am-muted">
                  ความดัง {Math.round(s.volume * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={s.volume}
                  disabled={!s.enabled}
                  onChange={(ev) => {
                    update(e, { volume: Number(ev.target.value) });
                  }}
                  className="flex-1 accent-[var(--am-accent)]"
                />
              </label>
            </li>
          );
        })}
      </ul>
      {status && (
        <p role="status" className="font-semibold">
          {status}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <StickerButton variant="confirm" disabled={saving} onClick={() => void save()}>
          {saving ? "กำลังบันทึก…" : "บันทึกการตั้งค่าเสียง"}
        </StickerButton>
        <StickerButton
          disabled={saving}
          onClick={() => {
            setConfig(defaultSoundConfig());
            setStatus("คืนค่าเริ่มต้นแล้ว (ยังไม่บันทึก)");
          }}
        >
          คืนค่าเริ่มต้น
        </StickerButton>
      </div>
    </div>
  );
}
