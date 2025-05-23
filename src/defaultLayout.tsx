import Navbar from "./components/h-nav";
import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <>
      <Navbar />
      <main>
       <Outlet /> 
      </main>
    </>
  );
}