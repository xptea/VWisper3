
"use client"
import { useEffect, useRef } from "react"
import useAudioPillState from "../lib/useAudioPillState"

export default function VoiceVisualizer() {
  const { state } = useAudioPillState()
  const bars = Array.from({ length: 10 }, (_, i) => i)
  const barsRef = useRef<HTMLDivElement[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    if (state === "listening" || state === "loading") {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        if (cancelled) return
        streamRef.current = stream
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.05
        source.connect(analyser)
        analyserRef.current = analyser
        const bufferLength = analyser.frequencyBinCount
        const dataArray: Uint8Array = new Uint8Array(bufferLength)
        dataArrayRef.current = dataArray
        let lastHeights: number[] = Array(bars.length).fill(6)
        function getLogBinRange(barIdx: number, barCount: number, fftSize: number, sampleRate: number): [number, number] {
          const minHz = 20;
          const maxHz = sampleRate / 2;
          const minLog = Math.log10(minHz);
          const maxLog = Math.log10(maxHz);
          const logRange = maxLog - minLog;
          const startLog = minLog + (logRange * barIdx) / barCount;
          const endLog = minLog + (logRange * (barIdx + 1)) / barCount;
          const startHz = Math.pow(10, startLog);
          const endHz = Math.pow(10, endLog);
          const binSize = maxHz / fftSize;
          const startBin = Math.max(0, Math.floor(startHz / binSize));
          const endBin = Math.min(fftSize - 1, Math.ceil(endHz / binSize));
          return [startBin, endBin];
        }
        function animate() {
          if (analyserRef.current && dataArrayRef.current && state === "listening") {
            // @ts-ignore
            analyserRef.current.getByteFrequencyData(dataArrayRef.current)
          }
          const bufferLength = dataArrayRef.current ? dataArrayRef.current.length : 0;
          const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
          for (let i = 0; i < bars.length; i++) {
            const bar = barsRef.current[i]
            if (bar) {
              let height = 6
              if (state === "listening" && dataArrayRef.current) {
                const [startBin, endBin] = getLogBinRange(i, bars.length, bufferLength, sampleRate);
                let max = 0;
                for (let j = startBin; j < endBin; j++) {
                  if (j < bufferLength) {
                    const v = dataArrayRef.current[j] || 0;
                    if (v > max) max = v;
                  }
                }
                const emphasized = Math.pow(max / 255, 1.2);
                height = 6 + emphasized * 24;
                lastHeights[i] = height;
              } else if (state === "loading") {
                height = lastHeights[i];
              }
              bar.style.height = `${height}px`;
            }
          }
          animationRef.current = requestAnimationFrame(animate);
        }
        animate();
      }).catch(() => {
        animationRef.current = window.setInterval(() => {
          barsRef.current.forEach((bar) => {
            if (bar) {
              const newHeight = Math.random() * 12 + 6
              bar.style.height = `${newHeight}px`
            }
          })
        }, 150) as unknown as number
      })
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current as number)
        clearInterval(animationRef.current as number)
        animationRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      barsRef.current.forEach((bar) => {
        if (bar) {
          bar.style.height = "6px"
        }
      })
    }
    return () => {
      cancelled = true
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current as number)
        clearInterval(animationRef.current as number)
        animationRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [state])

  if (state !== "listening" && state !== "loading") {
    return null
  }

  return (
    <div className="flex items-center gap-1 h-5">
      {bars.map((_bar, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) barsRef.current[index] = el
          }}
          className="w-[2px] bg-white rounded-full transition-all duration-150"
          style={{ height: "6px" }}
        />
      ))}
    </div>
  )
}
