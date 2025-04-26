import { motion } from 'framer-motion';
import { Button } from '../Calendar_updated/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const QuoteComponent = ({
  currentQuote,
  setCurrentQuote,
  quotes,
}: {
  currentQuote: { text: string; author: string };
  setCurrentQuote: (quote: { text: string; author: string }) => void;
  quotes: { text: string; author: string }[];
}) => {
  const quoteVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const authorVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' } },
  };

  return (
    <div
      className="relative flex items-center justify-between gap-4 bg-[#FAF9F6] dark:bg-[#2D2D2D] rounded-lg p-6 mb-6 max-w-4xl mx-auto border border-[#F8C8DC]/30 shadow-[0_4px_12px_rgba(248,200,220,0.2)]"
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(24, 25, 21, 0.9) 0%, rgba(245,245,244,0.9) 100%), url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27400%27 viewBox=%270 0 400 400%27%3E%3Cg fill=%27%23F8C8DC%27 fill-opacity=%270.1%27%3E%3Cpath d=%27M0 0h400v400H0z%27/%3E%3Cpath d=%27M150 50c40 0 70 30 70 70s-30 70-70 70-70-30-70-70 30-70 70-70zm0 20c-27.6 0-50 22.4-50 50s22.4 50 50 50 50-22.4 50-50-22.4-50-50-50z%27/%3E%3Cpath d=%27M300 200c30 0 50 20 50 50s-20 50-50 50-50-20-50-50 20-50 50-50zm0 20c-16.5 0-30 13.5-30 30s13.5 30 30 30 30-13.5 30-30-13.5-30-30-30z%27/%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: 'cover',
      }}
    >
      <div className="flex-1">
        <motion.div
          className="text-xl md:text-2xl italic font-playfair text-[#1A202C] dark:text-[#E2E8F0]"
          variants={quoteVariants}
          initial="hidden"
          animate="visible"
          key={currentQuote.text}
          style={{ textShadow: '0 1px 2px rgba(248, 200, 220, 0.2)' }}
        >
          "{currentQuote.text}"
        </motion.div>
        <motion.div
          className="mt-2 text-base font-semibold font-inter text-[#A3BFFA]"
          variants={authorVariants}
          initial="hidden"
          animate="visible"
          key={currentQuote.author}
        >
          — {currentQuote.author}
        </motion.div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-[#A3BFFA] hover:bg-[#F8C8DC]/20 hover:shadow-sm transition-all"
        onClick={() => setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])}
      >
        <RefreshCw className="h-5 w-5" />
      </Button>
    </div>
  );
};