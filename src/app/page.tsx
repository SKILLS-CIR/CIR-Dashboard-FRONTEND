import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#f7f7f7] overflow-hidden">
      
      {/* Background Illustration */}
      <Image
        src="/subtle-prism.svg" // illustration-style background (line art)
        alt="Amrita Background"
        fill
        priority
        className="object-cover opacity-90"
      />

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Amrita Logo"
          width={220}
          height={60}
          priority
        />

        {/* Tagline */}
        <p className="mt-4 text-sm tracking-wide text-gray-700 uppercase">
          Your window to employee management services
        </p>

        {/* Divider */}
        <div className="mt-4 h-px w-20 bg-[#7A1F5C]" />

        {/* Login Button */}
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#7A1F5C] px-8 py-3 text-[#7A1F5C] font-medium hover:bg-[#7A1F5C] hover:text-white transition-colors"
        >
          LOGIN
          {/* <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C9972B] text-white">
            →
          </span> */}
        </Link>
      </div>
    </div>
  )
}
