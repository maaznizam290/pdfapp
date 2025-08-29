'use client';

import { useState } from 'react';
import PDFTools from '@/components/pdf-tools';
import HeroSection from '@/components/hero-section';
import FeaturesSection from '@/components/features-section';
import WorkflowSection from '@/components/workflow-section';
import PremiumSection from '@/components/premium-section';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'organize', name: 'Organize PDF' },
    { id: 'optimize', name: 'Optimize PDF' },
    { id: 'convert', name: 'Convert PDF' },
    { id: 'edit', name: 'Edit PDF' },
    { id: 'security', name: 'PDF Security' },
  ];

  return (
    <>
      <HeroSection />
      
      {/* Category Filter */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PDF Tools Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PDFTools selectedCategory={selectedCategory} />
        </div>
      </section>

      {/* Workflow Section */}
      <WorkflowSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Premium Section */}
      <PremiumSection />
    </>
  );
}
