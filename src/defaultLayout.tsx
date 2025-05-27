// DefaultLayout.js
import Navbar from "./components/h-nav";
import MobileBottomNav from "./components/mobilenav";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

export default function DefaultLayout() {
  // Initialize isMobileView based on current window width
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024); // Or your preferred breakpoint

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 1024); // Update on resize
    };
    window.addEventListener("resize", handleResize);
    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  return (
    <>
      <div className="flex flex-row w-full max-h-auto sm:min-h-screen sm:max-h-screen bg-base-200 overflow-hidden">
        {!isMobileView && <Navbar />} {/* Desktop Sidebar */}
        <div className="flex w-full justify-center bg-base-100 sm:border-base-300 sm:border rounded-none sm:rounded-2xl overflow-hidden sm:overflow-scroll my-0 mr-0 sm:my-2 sm:mr-2"> {/* Changed to flex-1 and flex-col for main area */}
          <main className="flex justify-center w-full h-fit overflow-visible"> {/* Main content area with padding */}
            {/* Content will be rendered here by Outlet */}
            <Outlet />
          </main>
          {isMobileView && <MobileBottomNav />} {/* Mobile Bottom Nav, outside main scroll if main has its own scroll */}
        </div>
      </div>
    </>
  );
}