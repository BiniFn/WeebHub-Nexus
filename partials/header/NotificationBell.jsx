"use client";
import { PiBellRingingFill as Bell } from "react-icons/pi";
import { toast } from "react-toastify";

export default function NotificationBell() {
  return (
    <div 
      className="text-2xl text-slate-200 cursor-pointer hover:text-white transition"
      onClick={() => toast.info("No new notifications!", { theme: "dark", autoClose: 2000 })}
    >
      <Bell />
    </div>
  );
}
