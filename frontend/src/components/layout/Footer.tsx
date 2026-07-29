import Link from "next/link";
import { Code2 } from "lucide-react";
import { Logo } from "./Logo";
import { APP_DESCRIPTION, GITHUB_URL } from "@/lib/constants";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Why DeepShield AI", href: "#why" },
    { label: "About", href: "#about" },
  ],
  Platform: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Sign In", href: "/login" },
    { label: "Create Account", href: "/register" },
  ],
  Resources: [
    { label: "Documentation", href: GITHUB_URL, external: true },
    { label: "Source Code", href: GITHUB_URL, external: true },
    { label: "Report an Issue", href: `${GITHUB_URL}/issues`, external: true },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {APP_DESCRIPTION}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-cyan/40 hover:text-cyan"
                aria-label="View DeepShield AI on GitHub"
              >
                <Code2 className="size-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-sm font-semibold text-foreground">{heading}</p>
              <ul className="mt-4 space-y-3">
                {links.map((link) =>
                  "external" in link && link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted transition-colors hover:text-cyan"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-cyan"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DeepShield AI. Built for educational and research purposes.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by pre-trained AI detection models.
          </p>
        </div>
      </div>
    </footer>
  );
}
