import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { AboutSettings } from "@/components/settings/AboutSettings";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Configure your DeepShield AI experience and account protection.
        </p>
      </div>

      <div className="space-y-6 scroll-mt-20">
        <ThemeSettings />
        <NotificationSettings />
        <SecuritySettings />
        <AboutSettings />
      </div>
    </div>
  );
}
