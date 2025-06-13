import HomeHeader from '@/components/home/HomeHeader';
import HeroSection from '@/components/home/HeroSection';
import TechBadges from '@/components/home/TechBadges';
import AIFeatures from '@/components/home/AIFeatures';
import CoreFeatures from '@/components/home/CoreFeatures';
import HomeFooter from '@/components/home/HomeFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 背景装饰 - 移动端简化 */}
      <div className="absolute inset-0 bg-grid-gradient opacity-30 sm:opacity-60"></div>
      <div className="hidden sm:block absolute inset-0 bg-grid-dots-blue opacity-40"></div>
      <div className="hidden lg:block absolute inset-0 bg-grid-animated opacity-30"></div>

      {/* 浮动装饰球 - 移动端减少 */}
      <div className="hidden sm:block absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="hidden sm:block absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="hidden md:block absolute top-1/2 left-0 w-64 h-64 bg-indigo-400/15 rounded-full blur-2xl animate-float"></div>
      <div className="hidden md:block absolute top-1/4 right-0 w-80 h-80 bg-cyan-400/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Header */}
      <HomeHeader />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <HeroSection />

        {/* Tech Badges */}
        <TechBadges />

        {/* AI Features */}
        <AIFeatures />

        {/* Core Features */}
        <CoreFeatures />
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}