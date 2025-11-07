import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Clock, Globe, Zap, Shield, TrendingUp, Users } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-12">
        <div className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            The Future of Global Payments
          </span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
          Cross-Border Payments<br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reimagined
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Protocol Bank is a blockchain-based global payment network. Instant settlements, 90% lower fees, seamless integration with traditional banking systems.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl"
          >
            Get Started →
          </Button>
          <Button 
            variant="outline"
            className="px-8 py-6 text-lg rounded-xl border-2"
            onClick={() => window.open('https://github.com/everest-an/Protocol-Bank/blob/main/docs/design/protocol_bank_complete_whitepaper.md', '_blank')}
          >
            Read Whitepaper
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12">
          <div className="text-center">
            <div className="text-blue-600 dark:text-blue-400 mb-2">
              <TrendingUp className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">$2.5B+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Daily Volume</div>
          </div>
          <div className="text-center">
            <div className="text-blue-600 dark:text-blue-400 mb-2">
              <Users className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">500K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-blue-600 dark:text-blue-400 mb-2">
              <Globe className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">100+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-blue-600 dark:text-blue-400 mb-2">
              <TrendingUp className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">0.1%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Fee</div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Use Cases</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">Powering payments for businesses and individuals worldwide</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-12">
          <button className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Cross-Border E-commerce
          </button>
          <button className="px-6 py-3 rounded-xl bg-green-500 text-white font-medium shadow-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Real-Time Stream Payment
          </button>
          <button className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Users className="h-5 w-5" />
            Global Remittance
          </button>
        </div>

        {/* Stream Payment Card */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-12 text-white shadow-2xl">
          <div className="flex items-start gap-6 mb-8">
            <div className="bg-white/20 p-4 rounded-2xl">
              <Clock className="h-12 w-12" />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-2">Real-Time Stream Payment</h3>
              <p className="text-lg text-white/90">Per-second payroll with real-time fund flow, enhancing employee satisfaction</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">50K+</div>
              <div className="text-white/80">Employees</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">Per Second</div>
              <div className="text-white/80">Frequency</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">0s</div>
              <div className="text-white/80">Delay</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-3xl p-16 text-white text-center max-w-6xl mx-auto shadow-2xl">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Transform Your Payments?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
          Join thousands of businesses and individuals using Protocol Bank for fast, secure, and affordable global payments.
        </p>
        
        <div className="flex gap-4 justify-center mb-8">
          <Button 
            onClick={onGetStarted}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl font-semibold"
          >
            Start Free Trial →
          </Button>
          <Button 
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
          >
            Join Community
          </Button>
        </div>

        <div className="flex gap-8 justify-center text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            No Credit Card Required
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Free for First 1000 Transactions
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose Protocol Bank?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Built for the modern global economy
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lightning Settlement</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Built on Ethereum blockchain, transaction confirmation &lt;15 seconds, instant settlement worldwide
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ultra-Low Fees</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Fees as low as 0.1%, saving 90% compared to traditional SWIFT, no hidden charges
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bank-Grade Security</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Quantum-resistant encryption, multi-signature, hot/cold wallet separation, ensuring fund security
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Global Network</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connected to major payment networks including CHIPS, CHAPS, Fedwire, TARGET2, CIPS
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="bg-pink-100 dark:bg-pink-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Real-Time Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Visualized fund flow, smart financial reports, AI-driven payment optimization suggestions
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Automation</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Scheduled payments, batch payments, stream payments - full automation to free up your finance team
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
