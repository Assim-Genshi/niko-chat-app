import Navbar from "../components/h-nav";
import ProfilePage from "./profile/ProfilePage";

const Chat = () => {
    return (
      <div className="flex flex-row min-h-screen bg-base-100">
            <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <ProfilePage />
        </main>
      </div>
    );
  };
  
  export default Chat;