import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/react";
import { login } from "../utils/auth"; // Use your auth utility
import Logo from "./Logo"; // Adjust path if needed
import { ThemeToggle } from "./ThemeSwitcher";
import {  IconBrandGoogleFilled } from '@tabler/icons-react';
import { ThemedImage } from "./ThemedImage";

//------- HeroUI --------
import { EyeIcon, EyeSlashIcon,  } from "@heroicons/react/24/solid";
import { Button, Link, Form, Image } from "@heroui/react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate(); // Use react-router-dom's navigate

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    await login(formData.email, formData.password, navigate); // Pass navigate for redirection
  };

  const handleGoogleLogin = () => {
    console.log("Attempted Google Login (Not Implemented)");
    addToast({
      title: "Feature Coming Soon",
      description: "Google Login is not available yet",
      color: "warning",
    });
  };

  return (
    <div className="min-h-screen flex flex-row bg-black p-2 gap-1">
      {/* Left Side - Form */}
      <div className="flex flex-col w-full justify-center items-center p-6 sm:p-12 bg-gradient-to-b from-base-100 to-base-200 rounded-3xl">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo and Title */}
          <div className="flex flex-col text-center items-center gap-6">
            <div className="flex w-fit h-fit">
              <Logo className="text-brand-500" size={80} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-content">Welcome Back</h1>
              <p className="mt-2 text-sm text-base-content/60">
                Sign in to your account
              </p>
            </div>
          </div>

          {/* Form */}
          <Form onSubmit={handleSubmit} className="w-full ">
            {/* Email Input */}
                <input
                  type="email"
                  required
                  className="input input-bordered h-14 w-full pl-3 pr-3 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

            {/* Sign In Button */}
            <Button
              type="submit"
              className="btn w-full h-14 bg-brand-600 shadow-inner shadow-brand-500 text-white border-none rounded-2xl py-2.5 text-base font-semibold mt-2 "
            >
              Sign in
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
              startContent={<IconBrandGoogleFilled />}
              type="button"
              onPress={handleGoogleLogin}
              className="bg-base-content h-14 btn btn-outline border-base-300 w-full flex items-center justify-center rounded-2xl py-2.5 text-sm font-semibold text-base-100"
            >
              Continue with Google
            </Button>
          </div>

          {/* Signup Link */}
          <div className="text-center text-sm">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link 
                className="text-brand-color font-semibold hover:text-brand-500"
                showAnchorIcon 
                href="/signup">
                 Create account
              </Link>
            </p>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle className="absolute bottom-4 left-4" />
        </div>
      </div>
      {/* Right Side - Image */}
      <div className="w-full h-full">
        <ThemedImage 
        lightSrc="/whitelogin.jpg"
        darkSrc="/blacklogin.jpg"
        alt="Decorative background"
        className="absolute insert-0 w-full h-full object-cover rounded-3xl"
      />
      </div>
        <div className="absolute bottom-4 right-4 text-xs text-gray-200 bg-black/20 px-1 rounded">V1.0</div>
      </div>
    
  );
};

export default LoginPage;
