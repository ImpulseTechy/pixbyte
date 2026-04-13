'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import Footer from '@/components/Footer';
import { animations } from '@/data/animations';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('loaders');
  const [activeSize, setActiveSize] = useState<32 | 48 | 64>(64);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnimation, setSelectedAnimation] = useState(animations[0]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg text-text selection:bg-accent/30 selection:text-text">
      <Navbar />
      
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <LeftPanel 
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          activeSize={activeSize}
          setActiveSize={setActiveSize}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedAnimation={selectedAnimation}
          setSelectedAnimation={setSelectedAnimation}
        />
        <RightPanel 
          animation={selectedAnimation}
          size={activeSize}
        />
      </main>

      <Footer />
    </div>
  );
}
