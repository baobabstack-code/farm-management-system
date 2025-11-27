"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation - Mobile Optimized */}
      {/* Navigation - Floating & Centered */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="w-full max-w-5xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl rounded-full border border-white/20 ring-1 ring-black/5 px-6 py-3 transition-all duration-300 hover:shadow-green-500/10 dark:hover:shadow-green-900/20">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <span className="text-2xl transform group-hover:rotate-12 transition-transform duration-300">
                🌱
              </span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                FarmerFlow AI
              </span>
            </div>

            {/* Desktop Nav Links - Centered */}
            <div className="hidden md:flex items-center gap-8">
              {["Features", "Solutions", "Resources", "Pricing"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 dark:bg-green-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-4 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link href="/dashboard">
                <Button className="rounded-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="text-center lg:text-left space-y-6 sm:space-y-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Grow Your Farm with{" "}
                <span className="text-green-600 dark:text-green-400">
                  Smart Management
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Transform your farming operations with our comprehensive
                management system. Track crops, manage tasks, log activities,
                and boost your productivity with data-driven insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/sign-in" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-800 focus:ring-green-500"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image - Mobile Optimized */}
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl transform hover:rotate-0 transition-transform duration-300">
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 text-center">
                    👨‍🌾
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-xl sm:text-2xl mb-1">🌽</div>
                      <div className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 font-medium">
                        Corn
                      </div>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-xl sm:text-2xl mb-1">🍅</div>
                      <div className="text-[10px] sm:text-xs text-red-700 dark:text-red-300 font-medium">
                        Tomatoes
                      </div>
                    </div>
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-xl sm:text-2xl mb-1">🥕</div>
                      <div className="text-[10px] sm:text-xs text-orange-700 dark:text-orange-300 font-medium">
                        Carrots
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                    Happy Farming! 😊
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section
        id="features"
        className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Everything You Need to Manage Your Farm
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
              From crop planning to harvest tracking, our platform provides all
              the tools modern farmers need to succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300 p-4 sm:p-0">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                <span className="text-2xl sm:text-3xl">🌱</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Crop Management
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-2">
                Track your crops from planting to harvest with detailed growth
                stages and status updates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300 p-4 sm:p-0">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                <span className="text-2xl sm:text-3xl">📋</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Task Planning
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-2">
                Organize daily and seasonal farming activities with
                priority-based task management.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300 p-4 sm:p-0">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                <span className="text-2xl sm:text-3xl">💧</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Activity Logging
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-2">
                Log irrigation, fertilization, pest control, and harvest
                activities with detailed records.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300 p-4 sm:p-0">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/40 transition-colors">
                <span className="text-2xl sm:text-3xl">📈</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Analytics &amp; Reports
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-2">
                Get insights into your farm&apos;s performance with
                comprehensive analytics and reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Mobile Optimized */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Trusted by Happy Farmers Worldwide
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-green-100 max-w-3xl mx-auto px-4">
              Join thousands of farmers who have transformed their operations
              with FarmerFlow AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl transform hover:scale-105 transition-transform duration-300">
              <div className="text-center mb-4 sm:mb-6">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">👨‍🌾</div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  John Martinez
                </h4>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Organic Vegetable Farm
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 italic leading-relaxed">
                &quot;FarmerFlow AI has revolutionized how I manage my 50-acre
                vegetable farm. The task scheduling and crop tracking features
                have increased my productivity by 40%!&quot;
              </p>
              <div className="flex justify-center mt-3 sm:mt-4">
                <div className="flex text-yellow-400 text-lg sm:text-xl">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl transform hover:scale-105 transition-transform duration-300">
              <div className="text-center mb-4 sm:mb-6">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">👩‍🌾</div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Sarah Chen
                </h4>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Fruit Orchard Owner
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 italic leading-relaxed">
                &quot;The analytics dashboard gives me incredible insights into
                my orchard&apos;s performance. I can now make data-driven
                decisions that have boosted my harvest quality!&quot;
              </p>
              <div className="flex justify-center mt-3 sm:mt-4">
                <div className="flex text-yellow-400 text-lg sm:text-xl">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl transform hover:scale-105 transition-transform duration-300 md:col-span-2 lg:col-span-1">
              <div className="text-center mb-4 sm:mb-6">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">👨‍🌾</div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Mike Thompson
                </h4>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Grain Farm Manager
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 italic leading-relaxed">
                &quot;Managing multiple crops across 200 acres used to be
                overwhelming. FarmerFlow AI&apos;s comprehensive system keeps
                everything organized and efficient!&quot;
              </p>
              <div className="flex justify-center mt-3 sm:mt-4">
                <div className="flex text-yellow-400 text-lg sm:text-xl">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crop Showcase - Mobile Optimized */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Manage Any Type of Crop
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
              From vegetables to fruits, grains to herbs - our system adapts to
              your farming needs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 md:gap-6">
            {[
              {
                emoji: "🌽",
                name: "Corn",
                color: "bg-yellow-100 dark:bg-yellow-900/30",
              },
              {
                emoji: "🍅",
                name: "Tomatoes",
                color: "bg-red-100 dark:bg-red-900/30",
              },
              {
                emoji: "🥕",
                name: "Carrots",
                color: "bg-orange-100 dark:bg-orange-900/30",
              },
              {
                emoji: "🥬",
                name: "Lettuce",
                color: "bg-green-100 dark:bg-green-900/30",
              },
              {
                emoji: "🍓",
                name: "Strawberries",
                color: "bg-pink-100 dark:bg-pink-900/30",
              },
              {
                emoji: "🥔",
                name: "Potatoes",
                color: "bg-amber-100 dark:bg-amber-900/30",
              },
              {
                emoji: "🌶️",
                name: "Peppers",
                color: "bg-red-100 dark:bg-red-900/30",
              },
              {
                emoji: "🥒",
                name: "Cucumbers",
                color: "bg-green-100 dark:bg-green-900/30",
              },
            ].map((crop, index) => (
              <div
                key={index}
                className={`${crop.color} rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center hover:scale-110 transition-transform duration-300 cursor-pointer`}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">
                  {crop.emoji}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {crop.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Mobile Optimized */}
      <section
        id="pricing"
        className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Choose Your Plan
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
              Select the perfect plan for your farm management needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6 sm:p-8 relative">
              <div className="text-center space-y-3 sm:space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Basic Plan
                </h3>
                <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                  $25
                  <span className="text-base sm:text-lg font-normal text-gray-500">
                    /month
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Perfect for small farms
                </p>
              </div>

              <ul className="space-y-2 sm:space-y-3 my-6 sm:my-8">
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Up to 5 fields
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Basic crop tracking
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Weather updates
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Mobile access
                </li>
              </ul>

              <Link href="/dashboard" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-sm sm:text-base">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Premium Plan - Most Popular */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-xl border-2 border-green-500 p-6 sm:p-8 relative md:col-span-2 lg:col-span-1">
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                  Most Popular
                </span>
              </div>

              <div className="text-center space-y-3 sm:space-y-4 mt-2 sm:mt-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Premium Plan
                </h3>
                <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                  $50
                  <span className="text-base sm:text-lg font-normal text-gray-500">
                    /month
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  For growing operations
                </p>
              </div>

              <ul className="space-y-2 sm:space-y-3 my-6 sm:my-8">
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Unlimited fields
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Advanced analytics
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  AI recommendations
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Equipment tracking
                </li>
              </ul>

              <Link href="/dashboard" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-sm sm:text-base">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6 sm:p-8 relative md:col-span-2 lg:col-span-1">
              <div className="text-center space-y-3 sm:space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Enterprise
                </h3>
                <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                  $100
                  <span className="text-base sm:text-lg font-normal text-gray-500">
                    /month
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  For large operations
                </p>
              </div>

              <ul className="space-y-2 sm:space-y-3 my-6 sm:my-8">
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Everything in Premium
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Multi-farm management
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Custom integrations
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  Dedicated support
                </li>
                <li className="flex items-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-2 sm:mr-3">✓</span>
                  API access
                </li>
              </ul>

              <Link href="/dashboard" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-sm sm:text-base">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Mobile Optimized */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-green-100 leading-relaxed px-2">
            Join thousands of farmers who are already using FarmerFlow AI to
            increase productivity and reduce costs. Choose your plan and get
            started today!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-green-700 hover:bg-green-50 focus:ring-4 focus:ring-white/50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white"
              >
                Choose Your Plan
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-700 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              🌱 FarmerFlow AI
            </div>
            <p className="text-sm sm:text-base text-gray-400 px-4">
              Empowering farmers with smart management solutions
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link
                href="/dashboard"
                className="text-sm sm:text-base text-gray-400 hover:text-green-400 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/sign-in"
                className="text-sm sm:text-base text-gray-400 hover:text-green-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="text-sm sm:text-base text-gray-400 hover:text-green-400 transition-colors"
              >
                Get Started
              </Link>
            </div>
            <div className="text-gray-500 text-xs sm:text-sm pt-4 border-t border-gray-800">
              © 2024 FarmerFlow AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
