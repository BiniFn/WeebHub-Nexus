"use client"
import Image from "next/image"
import { useSession } from 'next-auth/react';
import { useEffect, useState } from "react";
import clsx from "clsx";
import Dropdown from "./Dropdown";
import { nightTokyo } from "@/utils/fonts";


const Profile = () => {
  const { data, status } = useSession();

  const [isToggled, setIsToggled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoggedIn(true);
    }
    else {
      setIsLoggedIn(false);
    }
  }, [status])


  return (
    <div className="relative">

      <div onClick={() => setIsToggled(prev => !prev)} className="cursor-pointer">
        {isLoggedIn ? (
          <Image
            src={data?.user?.image?.medium || data?.user?.image?.large || "/images/logo.png"}
            alt="profile"
            width={50}
            height={50}
            className="h-10 w-10 rounded-lg object-cover hover:rounded-2xl duration-100"
          />
        ) : (
          <button className={`${nightTokyo.className} text-white text-lg tracking-wider px-3 py-1 rounded-lg border border-white/20 hover:bg-white/10 transition-all duration-200`}>
            Login
          </button>
        )}
      </div>

      {isToggled && <Dropdown data={data} isLoggedIn={isLoggedIn} />}


    </div>
  )
}

export default Profile