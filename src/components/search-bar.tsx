"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  return (
    <div className="relative w-64">
      {/* Search Icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      {/* Input */}
      <Input
        placeholder="Search..."
        className="
          rounded-full pl-10 pr-12 
          bg-background border 
          text-sm
        "
      />

      {/* ⌘K Hint */}
      <kbd
        className="
          absolute right-3 top-1/2 -translate-y-1/2 
          text-xs text-muted-foreground rounded 
          px-1.5 py-0.5 bg-muted
        "
      >
        ⌘K
      </kbd>
    </div>
  )
}
