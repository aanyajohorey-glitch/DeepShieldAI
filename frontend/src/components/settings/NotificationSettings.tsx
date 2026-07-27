"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface NotificationPreferences {
  scanAlerts: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  scanAlerts: true,
  weeklyDigest: true,
  productUpdates: false,
};

const preferenceItems: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: "scanAlerts",
    label: "Scan result alerts",
    description: "Get notified as soon as a detection scan completes",
  },
  {
    key: "weeklyDigest",
    label: "Weekly security digest",
    description: "A weekly summary of activity across your workspace",
  },
  {
    key: "productUpdates",
    label: "Product updates",
    description: "News about new DeepShield AI features and phases",
  },
];

export function NotificationSettings() {
  const [preferences, setPreferences] = useLocalStorage<NotificationPreferences>(
    "deepshield:notification-preferences",
    DEFAULT_PREFERENCES
  );

  return (
    <Card id="notifications">
      <CardHeader>
        <div>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose what DeepShield AI keeps you informed about</CardDescription>
        </div>
      </CardHeader>

      <div className="divide-y divide-border">
        {preferenceItems.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="mt-0.5 text-xs text-muted">{description}</p>
            </div>
            <Switch
              checked={preferences[key]}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, [key]: checked }))
              }
              label={label}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Preferences are saved to this device.
      </p>
    </Card>
  );
}
