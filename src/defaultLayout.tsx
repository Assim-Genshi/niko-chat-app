import Navbar from "./components/h-nav";
import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <>
    <div className="flex flex-row w-full max-h-screen min-h-screen bg-base-200 py-2 pr-2">
      <Navbar  />
      <div className="flex w-full justify-center bg-base-100 border border-base-300 rounded-lg overflow-scroll">
        <main>
          <Outlet /> 
        </main>
      </div>
    </div>
    </>
  );
}