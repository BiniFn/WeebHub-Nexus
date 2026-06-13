"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { nightTokyo } from "@/utils/fonts";

export default function SignIn() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-950/80 z-10" />
        <div className="absolute w-[500px] h-[500px] -top-20 -left-20 bg-[#92b7fc30] blur-[150px] rounded-full z-0" />
        <div className="absolute w-[600px] h-[600px] -bottom-40 -right-20 bg-[#57668340] blur-[150px] rounded-full z-0" />
      </div>

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-md p-8 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center text-center mx-4">
        
        {/* Logo and Branding */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative w-32 h-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <Image
              src="/images/logo.png"
              alt="WeebHub Nexus Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className={`${nightTokyo.className} text-4xl text-white tracking-wider`}>
            WeebHub Nexus
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Login with your AniList account to track your watching progress, create custom lists, and sync across devices.
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={() => signIn("AniListProvider", { callbackUrl: "/" })}
          className="group relative flex items-center justify-center gap-3 w-full bg-[#02A9FF]/10 hover:bg-[#02A9FF]/20 text-[#02A9FF] font-semibold py-4 px-6 rounded-xl border border-[#02A9FF]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(2,169,255,0.3)] hover:-translate-y-1"
        >
          {/* AniList SVG Icon */}
          <svg 
            viewBox="0 0 64 64" 
            fill="currentColor" 
            className="w-6 h-6 transition-transform group-hover:scale-110"
          >
            <path d="M49.208 41.523l-3.321-10.493-9.585-29.03h-8.084l-14.735 44.5h8.04l2.844-9.31h13.916l1.24 3.965-7.799-.044.022 5.39h17.308l.154.022zM27.202 31.054l4.577-14.893 4.887 14.893h-9.464z"/>
          </svg>
          Login with AniList
        </button>

        {/* Disclaimer */}
        <p className="text-slate-500 text-xs mt-6">
          By logging in, you allow WeebHub Nexus to read and update your AniList watching status.
        </p>

      </div>
    </div>
  );
}
