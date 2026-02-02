// app/(auth)/login/page.tsx
import Image from "next/image"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[60%_40%]">
      
      {/* LEFT : Illustration */}
      <div className="relative hidden lg:flex items-center justify-center ">
        <Image
          src="/amma.jpg" // <-- use your second image illustration
          alt="Login Illustration"
          fill
          priority
          className="object-cover "
        />
      </div>

      {/* RIGHT : Login */}
      <div className="flex items-center justify-center bg-white px-10">
        <LoginForm />
      </div>

    </div>
  )
}
