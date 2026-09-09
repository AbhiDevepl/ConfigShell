/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BackgroundTexture } from './components/BackgroundTexture';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HandsIllustration } from './components/HandsIllustration';
import { TrustedBy } from './components/TrustedBy';
import { GetInTouchModal } from './components/GetInTouchModal';
import { AuthModal } from './components/AuthModal';
import { NavInfoModal } from './components/NavInfoModal';

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login',
  });
  const [selectedNav, setSelectedNav] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen w-full bg-[#ece9e2] text-black overflow-x-hidden flex flex-col justify-between selection:bg-black selection:text-white font-sans antialiased">
      {/* Authentic halftone and screen tone grain overlay */}
      <BackgroundTexture />

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        {/* Navigation Bar */}
        <Header
          onOpenLogin={() => setAuthModal({ isOpen: true, mode: 'login' })}
          onOpenTryNow={() => setAuthModal({ isOpen: true, mode: 'signup' })}
          onSelectNav={(item) => setSelectedNav(item)}
        />

        {/* Hero Section */}
        <main className="flex-1 flex flex-col justify-start">
          <Hero onGetInTouch={() => setIsContactOpen(true)} />
          <HandsIllustration />
        </main>

        {/* Social Proof / Logos */}
        <footer className="w-full">
          <TrustedBy />
        </footer>
      </div>

      {/* Interactive Modals */}
      <GetInTouchModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
      />

      <NavInfoModal
        section={selectedNav}
        onClose={() => setSelectedNav(null)}
        onGetInTouch={() => {
          setSelectedNav(null);
          setIsContactOpen(true);
        }}
      />
    </div>
  );
}
