"use client"

import Link from "next/link"
import { useState } from "react"
import { Download, LogOut, Shield } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportAllDataToExcel } from "@/lib/export-excel"

type Props = {
  firstName: string
  lastName: string
  initials: string
  isOwner: boolean
}

export function AccountMenu({ firstName, lastName, initials, isOwner }: Props) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    try {
      setExporting(true)
      toast.loading("Preparing your Excel file...", { id: "export" })
      await exportAllDataToExcel(firstName)
      toast.success("Exported. Check your downloads.", { id: "export" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed"
      toast.error(message, { id: "export" })
    } finally {
      setExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary/10 font-semibold text-primary hover:bg-primary/15"
          aria-label="Account menu"
        >
          {initials || "?"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl">
        <DropdownMenuLabel className="truncate">
          {firstName} {lastName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            if (!exporting) void handleExport()
          }}
          disabled={exporting}
          className="cursor-pointer"
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export to Excel"}
        </DropdownMenuItem>

        {isOwner ? (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" /> Owner dashboard
            </Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action="/auth/logout" method="post" className="w-full">
            <button type="submit" className="flex w-full items-center">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
