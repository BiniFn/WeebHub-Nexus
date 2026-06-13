import { nightTokyo } from "@/utils/fonts"
import styles from "./header.module.css"
import Link from "next/link"
import Image from "next/image"
import Links from "./Links"
import Search from "./Search"
import { PiBellRingingFill as Bell } from "react-icons/pi";
import Responsive from "./Responsive"
import Profile from "./Profile"
import NotificationBell from "./NotificationBell";


const Header = () => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>

        <div className={styles.left}>

          <Responsive />

          <Link href={"/"} className={`${nightTokyo.className} text-white flex items-center gap-2`}>
            <span className="text-3xl text-nowrap tracking-wider drop-shadow-md">WeebHub Nexus</span>
          </Link>

          {/* links */}
          <Links />

        </div>

        <div className={styles.right}>
          <Search />
          {/* notification */}
          <NotificationBell />

          {/* profile */}
          <Profile />

        </div>

      </div>
    </div>
  )
}

export default Header