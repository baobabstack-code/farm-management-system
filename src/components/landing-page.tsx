"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-600">
                🌱 FarmFlow
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/sign-in"
                className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Grow Your Farm with{" "}
                <span className="text-green-600">Smart Management</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your farming operations with our comprehensive
                management system. Track crops, manage tasks, log activities,
                and boost your productivity with data-driven insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-white rounded-2xl p-6">
                  <div className="text-6xl mb-4 text-center">👨‍🌾</div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-100 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">🌽</div>
                      <div className="text-xs text-green-700 font-medium">
                        Corn
                      </div>
                    </div>
                    <div className="bg-red-100 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">🍅</div>
                      <div className="text-xs text-red-700 font-medium">
                        Tomatoes
                      </div>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">🥕</div>
                      <div className="text-xs text-orange-700 font-medium">
                        Carrots
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600 font-medium">
                    Happy Farming! 😊
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Farm
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From crop planning to harvest tracking, our platform provides all
              the tools modern farmers need to succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Crop Management
              </h3>
              <p className="text-gray-600">
                Track your crops from planting to harvest with detailed growth
                stages and status updates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Task Planning
              </h3>
              <p className="text-gray-600">
                Organize daily and seasonal farming activities with
                priority-based task management.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <span className="text-3xl">💧</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Activity Logging
              </h3>
              <p className="text-gray-600">
                Log irrigation, fertilization, pest control, and harvest
                activities with detailed records.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analytics &amp; Reports
              </h3>
              <p className="text-gray-600">
                Get insights into your farm&apos;s performance with
                comprehensive analytics and reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Farmers Testimonial Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Happy Farmers Worldwide
            </h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Join thousands of farmers who have transformed their operations
              with FarmFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl transform hover:scale-105 transition-transform duration-300">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">👨‍🌾</div>
                <h4 className="text-xl font-semibold text-gray-900">
                  John Martinez
                </h4>
                <p className="text-gray-600">Organic Vegetable Farm</p>
              </div>
              <p className="text-gray-700 italic">
                &quot;FarmFlow has revolutionized how I manage my 50-acre
                vegetable farm. The task scheduling and crop tracking features
                have increased my productivity by 40%!&quot;
              </p>
              <div className="flex justify-center mt-4">
                <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl transform hover:scale-105 transition-transform duration-300">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">👩‍🌾</div>
                <h4 className="text-xl font-semibold text-gray-900">
                  Sarah Chen
                </h4>
                <p className="text-gray-600">Fruit Orchard Owner</p>
              </div>
              <p className="text-gray-700 italic">
                &quot;The analytics dashboard gives me incredible insights into
                my orchard&apos;s performance. I can now make data-driven
                decisions that have boosted my harvest quality!&quot;
              </p>
              <div className="flex justify-center mt-4">
                <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl transform hover:scale-105 transition-transform duration-300">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">👨‍🌾</div>
                <h4 className="text-xl font-semibold text-gray-900">
                  Mike Thompson
                </h4>
                <p className="text-gray-600">Grain Farm Manager</p>
              </div>
              <p className="text-gray-700 italic">
                &quot;Managing multiple crops across 200 acres used to be
                overwhelming. FarmFlow&apos;s comprehensive system keeps
                everything organized and efficient!&quot;
              </p>
              <div className="flex justify-center mt-4">
                <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crop Showcase Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Manage Any Type of Crop
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From vegetables to fruits, grains to herbs - our system adapts to
              your farming needs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {[
              { emoji: "🌽", name: "Corn", color: "bg-yellow-100" },
              { emoji: "🍅", name: "Tomatoes", color: "bg-red-100" },
              { emoji: "🥕", name: "Carrots", color: "bg-orange-100" },
              { emoji: "🥬", name: "Lettuce", color: "bg-green-100" },
              { emoji: "🍓", name: "Strawberries", color: "bg-pink-100" },
              { emoji: "🥔", name: "Potatoes", color: "bg-amber-100" },
              { emoji: "🌶️", name: "Peppers", color: "bg-red-100" },
              { emoji: "🥒", name: "Cucumbers", color: "bg-green-100" },
            ].map((crop, index) => (
              <div
                key={index}
                className={`${crop.color} rounded-2xl p-6 text-center hover:scale-110 transition-transform duration-300 cursor-pointer`}
              >
                <div className="text-4xl mb-2">{crop.emoji}</div>
                <div className="text-sm font-medium text-gray-700">
                  {crop.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How FarmFlow Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, powerful tools designed specifically for modern farming
              operations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                📱 Dashboard Overview
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Get a complete view of your farm operations at a glance. Monitor
                crop health, track task completion, and view key performance
                metrics all in one place.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Real-time farm statistics and KPIs
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Weather integration and alerts
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Upcoming tasks and deadlines
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Farm Dashboard</h4>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-sm text-gray-600">Active Crops</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">8</div>
                    <div className="text-sm text-gray-600">Tasks Today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-green-100 to-yellow-100 rounded-2xl p-8 order-2 lg:order-1">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Crop Management</h4>
                  <span className="text-2xl">🌱</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">🍅 Tomatoes</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">🌽 Corn</span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      Growing
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">🥕 Carrots</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Planted
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Smart Crop Monitoring
              </h3>
              <p className="text-gray-600 mb-6">
                Track your crops' health, growth stages, and harvest readiness
                with our intelligent monitoring system. Get real-time insights
                and recommendations to maximize your yield.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of farmers who are already using FarmFlow to increase
            productivity and reduce costs. Start your free trial today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-semibold"
              >
                Sign In Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold text-green-400">
                  🌱 FarmFlow
                </span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering farmers with smart technology to grow better, manage
                efficiently, and harvest success. Your partner in modern
                agriculture.
              </p>
              <div className="flex space-x-4">
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">
                  📧
                </span>
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">
                  📱
                </span>
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">
                  🌐
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Crop Management</li>
                <li>Task Planning</li>
                <li>Activity Logging</li>
                <li>Analytics & Reports</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Documentation</li>
                <li>Community</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FarmFlow. Made with ❤️ for farmers worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
