import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/react";
import { signUp } from "../utils/auth"; // Use your auth utility
import Logo from "./Logo"; // Adjust path if needed
import { ThemeToggle } from "./ThemeSwitcher";

//----heroUI----
import { EyeIcon, EyeSlashIcon, GlobeAltIcon } from "@heroicons/react/24/solid";
import { Button, Image, Link, Form } from "@heroui/react";
import { ThemedImage } from "./ThemedImage";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate(); // Use react-router-dom's navigate

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    await signUp(formData.name, formData.email, formData.password, navigate); // Pass navigate for redirection
  };

  const handleGoogleSignup = () => {
    console.log("Attempted Google Signup (Not Implemented)");
    addToast({
      title: "Feature Coming Soon",
      description: "Google Signup is not available yet",
      color: "warning",
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black p-2 gap-1">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-gradient-to-b from-base-100 to-base-200 rounded-3xl">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo and Title */}
          <div className="flex flex-col text-center items-center gap-6">
            <div className="flex w-fit h-fit">
              <Logo className="text-brand-500" size={80} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-content">Create Account</h1>
              <p className="mt-2 text-sm text-base-content/60">
                Sign up to start your journey
              </p>
            </div>
          </div>

          {/* Form */}
          <Form onSubmit={handleSubmit} className="w-full ">
            {/* Name Input */}
            <input
              type="text"
              required
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-14 w-full pl-3 pr-3 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
            />

            {/* Email Input */}
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className=" h-14 w-full pl-3 pr-3 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
            />

            {/* Password Input */}
            <div className="form-control w-full">
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input input-bordered h-14 w-full pl-3 pr-3 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/60 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              className="btn w-full h-14 bg-brand-600 shadow-inner shadow-brand-500 text-white border-none rounded-2xl py-2.5 text-base font-semibold mt-4 "
            >
              Sign Up
            </Button>
          </Form>

          {/* OR Separator */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-base-content/40"></div>
            <span className="mx-4 text-base-content/60 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-base-content/40"></div>
          </div>

          {/* Alternative Logins */}
          <div className="space-y-3">
            <Button
              startContent={<GlobeAltIcon className="h-5 w-5 mr-2" />}
              type="button"
              onPress={handleGoogleSignup}
              className="bg-base-content h-14 btn btn-outline border-base-300 w-full flex items-center justify-center rounded-2xl py-2.5 text-sm font-semibold text-base-100"
            >
              Continue with Google
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center text-sm">
            <p className="text-base-content/60">
              Already have an account?{" "}
              
              <Link 
                className="text-brand-color font-semibold hover:text-brand-500"
                showAnchorIcon 
                href="/login">
                 Login
              </Link>
            </p>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle className="absolute bottom-4 left-4" />
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block w-full relative bg-base-100 rounded-3xl">
        <Image
          alt="Themed banner"
          src="/white-log.jpg"
          className="absolute inset-0 w-full h-full object-cover rounded-3xl"
        />
        <div className="absolute bottom-4 right-4 text-xs text-gray-200 bg-black/20 px-1 rounded">V1.0</div>
      </div>
    </div>
  );
};

export default SignupPage;
