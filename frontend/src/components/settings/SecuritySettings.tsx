"use client";

import { useState } from "react";
import { KeyRound, Laptop, ShieldQuestion } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";

export function SecuritySettings() {
  const { toast } = useToast();
  const [twoFactor, setTwoFactor] = useState(false);

  function notifyComingSoon(feature: string) {
    toast({
      title: "Coming soon",
      description: `${feature} will be available in a future phase.`,
      variant: "info",
    });
  }

  return (
    <Card id="security">
      <CardHeader>
        <div>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Protect access to your DeepShield AI account</CardDescription>
        </div>
      </CardHeader>

      <div className="divide-y divide-border">
        <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-cyan">
              <KeyRound className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="mt-0.5 text-xs text-muted">Change your account password</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => notifyComingSoon("Password management")}>
            Change
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-cyan">
              <ShieldQuestion className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                <StatusBadge tone="warning" dot={false}>Coming soon</StatusBadge>
              </div>
              <p className="mt-0.5 text-xs text-muted">Add an extra layer of protection at sign-in</p>
            </div>
          </div>
          <Switch
            checked={twoFactor}
            onCheckedChange={(checked) => {
              setTwoFactor(checked);
              notifyComingSoon("Two-factor authentication");
            }}
            disabled
            label="Two-factor authentication"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-3.5 last:pb-0">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-cyan">
              <Laptop className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Active sessions</p>
              <p className="mt-0.5 text-xs text-muted">This device is currently signed in</p>
            </div>
          </div>
          <StatusBadge tone="success">1 active</StatusBadge>
        </div>
      </div>
    </Card>
  );
}
