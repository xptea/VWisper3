import { useEffect, useState } from "react"
import { Window } from "@tauri-apps/api/window"

type AudioPillState = "idle" | "listening" | "loading"

type UnlistenFn = () => void

const appWindow = new Window('main')

export default function useAudioPillState() {
  const [state, setState] = useState<AudioPillState>("idle")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    appWindow.isVisible().then((isVisible: boolean) => {
      if (isVisible) {
        setState("listening")
        setVisible(true)
      } else {
        setState("idle")
        setVisible(false)
      }
    })
    let unlistenPill: UnlistenFn | undefined
    appWindow.listen<string>("pill-state", (event) => {
      const newState = event.payload as AudioPillState
      setState(newState)
      setVisible(newState !== "idle")
    }).then((fn: UnlistenFn) => { unlistenPill = fn })
    return () => {
      if (unlistenPill) unlistenPill()
    }
  }, [])

  return { state, visible }
} 