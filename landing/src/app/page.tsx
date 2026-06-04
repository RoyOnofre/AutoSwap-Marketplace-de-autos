import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import FeaturedListings from '@/components/FeaturedListings';
import Benefits from '@/components/Benefits';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <Features />
      <FeaturedListings />
      <Benefits />
      <CTA />
      <Footer />
    </main>
  );
}
