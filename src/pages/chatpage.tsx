import Navbar from "../components/h-nav";

const Chat = () => {
    return (
      <div className="flex flex-row min-h-screen bg-base-100">
            <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-base-content">Welcome to Your App!</h1>
            {/* Your homepage content here */}
          </div>
        </main>
      </div>
    );
  };
  
  export default Chat;