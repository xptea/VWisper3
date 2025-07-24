import { SiteHeader } from "@/components/sheader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartAreaInteractive } from "@/components/chart";
import { DataTable } from "@/components/table";
import data from "./data.json";

export default function DashboardPage() {
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
                    <div className="text-2xl font-bold">-</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Audio Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">API Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
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
                    <ChartAreaInteractive />
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
                    <DataTable data={data} />
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