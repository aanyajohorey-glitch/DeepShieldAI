"use client";

import Link from "next/link";
import { Bell, Calendar, ChevronRight, Mail, Palette, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { formatDate, getInitials } from "@/lib/utils";

const settingsLinks = [
  { href: "/settings#security", label: "Security Settings", description: "Password and account protection", icon: ShieldCheck },
  { href: "/settings#notifications", label: "Notification Preferences", description: "Control what you're alerted about", icon: Bell },
  { href: "/settings#theme", label: "Theme Settings", description: "Switch between dark and light mode", icon: Palette },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) return <FullScreenSpinner />;

  const details = [
    { label: "Full Name", value: user.name, icon: UserIcon },
    { label: "Email Address", value: user.email, icon: Mail },
    { label: "Joined", value: formatDate(user.createdAt), icon: Calendar },
    { label: "Role", value: user.role, icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted">Manage your DeepShield AI account identity.</p>
      </div>

      <Card>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-strong to-purple-strong text-2xl font-semibold text-white shadow-[0_0_30px_-8px_var(--accent-cyan)]">
            {getInitials(user.name)}
          </span>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
              <StatusBadge tone="success">Active</StatusBadge>
            </div>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                title: "Coming soon",
                description: "Avatar uploads will be available in a future phase.",
                variant: "info",
              })
            }
          >
            Change Avatar
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your core identity information</CardDescription>
            </div>
          </CardHeader>
          <div className="divide-y divide-border">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-cyan">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="truncate text-sm font-medium capitalize text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Jump to a specific settings section</CardDescription>
            </div>
          </CardHeader>
          <div className="divide-y divide-border">
            {settingsLinks.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:text-cyan"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-cyan">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
