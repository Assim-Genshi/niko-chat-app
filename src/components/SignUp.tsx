import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/react";
import { signUp } from "../utils/auth";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeSwitcher";
import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { supabase } from "../supabase/supabaseClient";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { Button, Link, Form } from "@heroui/react";
import { ThemedImage } from "./ThemedImage";

const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      addToast({ title: "Error", description: "Passwords do not match!", color: "danger" });
      return;
    }
    if (!formData.username.trim()) {
        addToast({ title: "Error", description: "Username cannot be empty.", color: "danger" });
        return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
        addToast({ title: "Invalid Username", description: "Username can only contain letters, numbers, dots, underscores, or hyphens.", color: "danger"});
        return;
    }

    setLoading(true);
    try {
      const { data: generatedId, error: idError } = await supabase.rpc(
        'generate_unique_chatamata_id',
        { base_username: formData.username.trim() }
      );

      if (idError) throw idError;
      if (!generatedId) throw new Error("Could not generate Chatamata ID.");

      await signUp(
        formData.fullName.trim(),
        formData.username.trim(),
        generatedId,
        formData.email.trim(),
        formData.password,
        navigate
      );
    } catch (error: any) {
      if (!error.message.includes("Sign Up Failed")) {
        addToast({
            title: "Signup Process Error",
            description: error.message || "Failed to complete signup.",
            color: "danger"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    addToast({
      title: "Feature Coming Soon",
      description: "Google Signup is not available yet",
      color: "warning",
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black p-0 sm:p-2 gap-1">
      <div className="flex flex-col h-full justify-center items-center p-6 sm:p-12 bg-gradient-to-b from-base-100 to-base-200 rounded-t-2xl sm:rounded-3xl overflow-scroll">
        <div className="w-full max-w-sm space-y-6 ">
          <div className="flex flex-col text-center items-center gap-6">
            <div className="flex w-fit h-fit">
              <Logo className="text-brand-500" size={80} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-content">Create Account</h1>
              <p className="mt-2 text-sm text-base-content/60">
                Sign up to continue
              </p>
            </div>
          </div>

          <Form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="fullName" className="sr-only">Full Name</label>
                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        placeholder="Fullname"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="h-14 w-full pl-3 pr-3 bg-base-300 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="username" className="sr-only">Username</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        className="h-14 w-full pl-3 pr-3 bg-base-300 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="w-full">
                <label htmlFor="email" className="w-full sr-only">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-14 w-full pl-3 bg-base-300 pr-3 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
                    disabled={loading}
                />
            </div>

            <div className="w-full">
              <label htmlFor="password_signup" className="sr-only">Password</label>
              <div className="relative w-full">
                <input
                  id="password_signup"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input input-bordered bg-base-300 h-14 w-full pl-3 pr-10 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/60 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="w-full">
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <div className="relative w-full">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="input input-bordered bg-base-300 h-14 w-full pl-3 pr-10 py-2 border border-base-300 rounded-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 transition-colors duration-300 ease-in-out"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label="Toggle confirm password visibility"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/60 hover:text-base-content"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="btn w-full h-14 bg-brand-600 shadow-inner shadow-brand-500 text-white border-none rounded-2xl py-2.5 text-base font-semibold mt-2"
            >
              Sign Up
            </Button>
          </Form>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-base-content/40"></div>
            <span className="mx-4 text-base-content/60 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-base-content/40"></div>
          </div>

          <div className="space-y-3">
            <Button
              startContent={<IconBrandGoogleFilled />}
              type="button"
              onPress={handleGoogleSignup}
              className="bg-base-content h-14 btn btn-outline border-base-300 w-full flex items-center justify-center rounded-2xl py-2.5 text-sm font-semibold text-base-100"
              disabled={loading}
            >
              Continue with Google
            </Button>
          </div>

          <div className="text-center text-sm">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link 
                className="cursor-pointer text-brand-color font-semibold hover:text-brand-500"
                showAnchorIcon 
                onPress={() => navigate('/login')}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
          {/* Theme Toggle */}
          <div className="absolute bottom-4 left-4">
            <ThemeToggle />
          </div>
      </div>

      <div className="hidden lg:block w-full relative bg-base-100 rounded-3xl z-4">
        <ThemedImage
          lightSrc="/whitelogin.jpg"
          darkSrc="/blacklogin.jpg"
          alt="Themed image"
          className="absolute w-full h-full object-cover rounded-3xl z-5"
        />
        <div className="absolute bottom-4 right-4 text-xs text-gray-200 bg-black/20 px-1 rounded">V1.0</div>
      </div>
    </div>
  );
};

export default SignupPage;  