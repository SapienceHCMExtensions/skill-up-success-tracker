import * as React from "react"
import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/ThemeToggle"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { pathname } = location

  const segment = pathname.startsWith("/admin")
    ? pathname
        .slice("/admin".length)
        .split("/")
        .filter(Boolean)[0]
    : undefined

  const labels: Record<string, string> = {
    roles: "Roles & Permissions",
    "audit-logs": "Audit Trail",
    "org-settings": "Organization Settings",
    "email-templates": "Email Templates",
    "workflow-observability": "Workflow Observability",
    "gemini-config": "Gemini AI Configuration",
  }

  const currentLabel = segment ? labels[segment] ?? segment : "Admin"

  useEffect(() => {
    // Canonical tag for SEO
    const href = `${window.location.origin}${pathname}`
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement("link")
      link.setAttribute("rel", "canonical")
      document.head.appendChild(link)
    }
    link.setAttribute("href", href)

    // Set a reasonable default title/description for Admin root
    if (!segment) {
      document.title = "Admin | System Settings"
      const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (meta) meta.setAttribute("content", "Admin panel to manage roles, audit logs, settings, and email templates")
    }
  }, [pathname, segment])

  return (
    <div className="space-y-4">
      <header className="pt-1 flex items-center justify-between">
        <nav aria-label="Breadcrumbs">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {segment ? (
                  <BreadcrumbLink asChild>
                    <Link to="/admin">Admin</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>Admin</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {segment && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </nav>
        <ThemeToggle />
      </header>

      <main>{children}</main>
    </div>
  )
}
