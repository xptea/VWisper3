import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SiteHeader } from "@/components/dashboard/sheader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [inputType, setInputType] = useState("text");
  const [settingsPath, setSettingsPath] = useState<string | null>(null);

  useEffect(() => {
    invoke("get_settings").then((settings: any) => {
      setApiKey(settings.groq_api_key || "");
      setLoading(false);
    });
    invoke("get_settings_path").then((path) => {
      setSettingsPath(path as string);
    });
  }, []);

  const handleSave = async () => {
    setSaved(false);
    await invoke("save_settings", { groqApiKey: apiKey });
    setSaved(true);
    setInputType("password");
  };

  const handleReset = async () => {
    setSaved(false);
    await invoke("reset_settings");
    setApiKey("");
    setSaved(true);
    setInputType("text");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setInputType("text");
    setSaved(false);
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;


  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
              </div>
              <Separator className="my-4" />
              
              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">Groq API Key</Label>
                      <Input
                        id="api-key"
                        type={inputType}
                        value={apiKey}
                        onChange={handleInputChange}
                        placeholder="Enter your Groq API key"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1">
                        Save
                      </Button>
                      <Button onClick={handleReset} variant="outline" className="flex-1">
                        Reset
                      </Button>
                    </div>
                    {saved && (
                      <div className="text-sm text-green-600 font-medium">Settings saved successfully!</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Settings Information</CardTitle>
                  <CardDescription>
                    Your API key is securely saved in the app's local settings file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {settingsPath && (
                      <>
                        <div>
                          <span className="font-medium">File Path:</span>{" "}
                          <code className="bg-muted px-1 py-0.5 rounded">{settingsPath}</code>
                        </div>
                      </>
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