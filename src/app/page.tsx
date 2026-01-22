import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-foreground p-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo.png"
          alt="CIR Logo"
          width={120}
          height={120}
          priority
        />
        <h1 className="text-3xl font-bold tracking-tight">
          CIR Work Management System
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Comprehensive Work & Responsibility Management - Track assignments, 
          submit work, and verify completions efficiently.
        </p>
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        <div className="p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm border">
          <h3 className="font-semibold mb-1">📋 Assign Work</h3>
          <p className="text-xs text-muted-foreground">
            Managers assign responsibilities to staff members
          </p>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm border">
          <h3 className="font-semibold mb-1"> Submit Work</h3>
          <p className="text-xs text-muted-foreground">
            Staff submit their completed work for review
          </p>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm border">
          <h3 className="font-semibold mb-1">✅ Verify</h3>
          <p className="text-xs text-muted-foreground">
            Managers verify and approve submissions
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow hover:bg-primary/90 transition-colors"
        >
          Sign In to Continue
        </Link>
      </div>
    </div>
  );
}
