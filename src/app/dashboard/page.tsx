import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SiteHeader } from "@/components/dashboard/sheader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartAreaInteractive } from "@/components/dashboard/chart";
import { DataTable } from "@/components/dashboard/table";
import { format } from "date-fns";

export default function DashboardPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke("get_transcription_history").then((value) => {
      const entries = value as any[];
      const mapped = entries.map((entry) => ({
        id: entry.id,
        header: entry.text.slice(0, 32) + (entry.text.length > 32 ? "..." : ""),
        type: entry.source || "audio",
        status: entry.status || "-",
        round_trip_ms: entry.round_trip_ms || null,
        wav_path: entry.wav_path,
        timestamp: entry.timestamp,
        date: entry.timestamp ? format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss") : "-",
        text: entry.text,
      }));
      mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(mapped);
      setLoading(false);
    });
  }, []);

  // Compute card values
  const totalTranscriptions = history.length

  // Audio Hours: try to estimate from wav_path file size if available (assuming 16kHz, 16bit mono PCM)
  function estimateAudioDuration(wavPath: string | undefined): number {
    // 16,000 samples/sec * 2 bytes/sample = 32,000 bytes/sec
    // duration = fileSize / 32000
    if (!wavPath) return 0
    try {
      // @ts-ignore
      const fs = window.require ? window.require('fs') : undefined
      if (fs) {
        const stats = fs.statSync(wavPath)
        return stats.size / 32000
      }
    } catch {}
    return 0
  }
  // We can't access file size from browser, so just show '-' for now
  const audioHours = '-'

  const successCount = history.filter(h => h.status === "success").length
  const successRate = totalTranscriptions > 0 ? Math.round((successCount / totalTranscriptions) * 100) : 0
  const apiAvg = totalTranscriptions > 0 ? Math.round(history.reduce((sum, h) => sum + (h.round_trip_ms || 0), 0) / totalTranscriptions) : 0

  // Calculate total words and avg words per min (assume 1 min per transcription)
  const totalWords = history.reduce((sum, h) => sum + (h.text ? h.text.split(/\s+/).filter(Boolean).length : 0), 0)
  const totalMinutes = history.length // Placeholder: 1 min per transcription
  const avgWordsPerMin = totalMinutes > 0 ? Math.round(totalWords / totalMinutes) : 0

  // Compute chart data: group by day, sum words per day
  const chartData = (() => {
    const map = new Map<string, { date: string, words: number }>()
    history.forEach(h => {
      if (!h.timestamp) return
      const date = new Date(h.timestamp).toISOString().slice(0, 10)
      const words = h.text ? h.text.split(/\s+/).filter(Boolean).length : 0
      if (!map.has(date)) map.set(date, { date, words: 0 })
      map.get(date)!.words += words
    })
    // Fill last 30 days
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      days.push({
        date,
        words: map.get(date)?.words || 0,
        mobile: map.get(date)?.words || 0, // For chart compatibility
        desktop: 0 // Not used
      })
    }
    return days
  })()

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">VWisper Dashboard</h2>
              </div>
              <Separator className="my-4" />

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>1. Set Groq API Key</CardTitle>
                    <CardDescription>
                      Enter your Groq API key in the settings to enable transcription.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>2. Open Any Text Box</CardTitle>
                    <CardDescription>
                      Click into any text box in the app where you want to insert your transcription.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>3. Hold Right Ctrl & Talk</CardTitle>
                    <CardDescription>
                      Hold down <span className="font-semibold">Right Ctrl</span>, speak, then release to paste your speech into the text box.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transcriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalTranscriptions}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Words Per Min</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgWordsPerMin}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{successRate}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg API Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{apiAvg} ms</div>
                  </CardContent>
                </Card>
              </div>

              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Transcription Activity</CardTitle>
                    <CardDescription>
                      Daily transcription activity over the last 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ChartAreaInteractive data={chartData} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Transcription History</CardTitle>
                  <CardDescription>
                    View and manage all your transcription files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input placeholder="Search transcriptions..." className="max-w-sm" />
                      <Button variant="outline">Filter</Button>
                    </div>
                    {loading ? (
                      <div>Loading...</div>
                    ) : (
                      <DataTable data={history} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 