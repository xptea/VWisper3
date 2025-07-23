"use client"

import { X } from "lucide-react"
import { cn } from "../lib/utils"
import useAudioPillState from "../lib/AudioPillState"
import VoiceVisualizer from "../components/VoiceVisualizer"
export default function AudioPill() {
  const { state, visible } = useAudioPillState()

  const handleStop = () => {
    console.log('Stop recording requested')
  }

  if (!visible) return null

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="relative">
        <div
          className={cn(
            "flex items-center justify-center bg-black text-white rounded-full transition-all duration-300 shadow-lg relative",
            state === "idle" && "px6 py-2",
            state === "listening" && "px-6 py-2",
            state === "loading" && "px-11 py-2",
          )}
        >
          <div
            className={cn(
              "absolute right-3 transition-opacity duration-300",
              state === "loading" ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="w-5 h-5 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <div
            className={cn(
              "absolute left-3 transition-opacity duration-300 cursor-pointer",
              state === "loading" ? "opacity-100" : "opacity-0",
            )}
            onClick={handleStop}
          >
            <X className="w-5 h-5 text-red-500 hover:text-red-400" />
          </div>
          <VoiceVisualizer />
        </div>
      </div>
    </div>
  )
}
