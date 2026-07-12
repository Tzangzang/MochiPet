import type { BubbleTone } from "../lib/home-room-presenter"

const TONE_CLASS: Record<BubbleTone, string> = {
  neutral: "home-room-bubble-neutral",
  success: "home-room-bubble-success",
  info: "home-room-bubble-info",
  error: "home-room-bubble-error",
}

export function SpeechBubble({ text, tone }: { text: string | null; tone: BubbleTone }) {
  return (
    <div className="home-room-bubble-slot" aria-live="polite">
      {text ? (
        <div className={`home-room-bubble ${TONE_CLASS[tone]}`}>
          <span className="home-room-bubble-text">{text}</span>
          <span className="home-room-bubble-tail" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  )
}
