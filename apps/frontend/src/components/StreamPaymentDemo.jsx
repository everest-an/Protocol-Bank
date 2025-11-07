import React, { useState, useEffect } from 'react';
import { Clock, Zap, TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';

const scenarios = [
  {
    id: 1,
    title: 'Payroll Streaming',
    description: 'Real-time salary payments per second',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    stats: [
      { label: 'Employees', value: '50K+' },
      { label: 'Frequency', value: 'Per Second' },
      { label: 'Delay', value: '0s' }
    ]
  },
  {
    id: 2,
    title: 'Subscription Billing',
    description: 'Continuous payment for SaaS services',
    icon: TrendingUp,
    color: 'from-purple-500 to-purple-600',
    stats: [
      { label: 'Subscribers', value: '100K+' },
      { label: 'Frequency', value: 'Per Minute' },
      { label: 'Uptime', value: '99.9%' }
    ]
  },
  {
    id: 3,
    title: 'Freelancer Payments',
    description: 'Hourly payments for remote workers',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    stats: [
      { label: 'Freelancers', value: '25K+' },
      { label: 'Frequency', value: 'Per Hour' },
      { label: 'Countries', value: '150+' }
    ]
  },
  {
    id: 4,
    title: 'Instant Settlements',
    description: 'Lightning-fast transaction finality',
    icon: Zap,
    color: 'from-orange-500 to-orange-600',
    stats: [
      { label: 'Volume', value: '$2.5B+' },
      { label: 'Speed', value: '<15s' },
      { label: 'Fee', value: '0.1%' }
    ]
  }
];

export default function StreamPaymentDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % scenarios.length);
        setIsAnimating(false);
      }, 500);
    }, 4000); // Switch every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const currentScenario = scenarios[currentIndex];
  const Icon = currentScenario.icon;

  return (
    <div className="mb-8">
      <div className={`bg-gradient-to-br ${currentScenario.color} rounded-3xl p-8 md:p-12 text-white shadow-2xl transition-all duration-500 ${
        isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}>
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            <Icon className="h-10 w-10 md:h-12 md:w-12" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">{currentScenario.title}</h3>
            <p className="text-base md:text-lg text-white/90">{currentScenario.description}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 bg-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          {currentScenario.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm md:text-base text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {scenarios.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-white' 
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to scenario ${index + 1}`}
            />
          ))}
        </div>

        {/* Learn More Link */}
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => window.location.hash = '#/stream-payment'}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
          >
            Learn more about stream payments
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
