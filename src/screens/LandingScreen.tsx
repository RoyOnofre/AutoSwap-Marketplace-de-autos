import React from 'react';
import Navbar from '../../landing/src/components/Navbar';
import Hero from '../../landing/src/components/Hero';
import Features from '../../landing/src/components/Features';
import FeaturedListings from '../../landing/src/components/FeaturedListings';
import Benefits from '../../landing/src/components/Benefits';
import CTA from '../../landing/src/components/CTA';
import Footer from '../../landing/src/components/Footer';

export default function LandingScreen() {
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
