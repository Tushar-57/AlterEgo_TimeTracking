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
    <motion.div
      className="relative flex items-center justify-between gap-4 bg-[#F7F7F7] dark:bg-[#2D3748] rounded-2xl p-8 mb-10 max-w-5xl mx-auto border border-[#D8BFD8]/30 shadow-inner"
      style={{
        background: 'linear-gradient(145deg, #F7F7F7, #E6E6FA)',
        boxShadow: 'inset 0 2px 4px rgba(216, 191, 216, 0.2), 0 4px 12px rgba(216, 191, 216, 0.1)',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex-1">
        <motion.div
          className="text-xl md:text-2xl italic font-serif text-[#2D3748] dark:text-[#E6E6FA]"
          variants={quoteVariants}
          initial="hidden"
          animate="visible"
          key={currentQuote.text}
          style={{ textShadow: '0 1px 2px rgba(216, 191, 216, 0.2)' }}
        >
          "{currentQuote.text}"
        </motion.div>
        <motion.div
          className="mt-3 text-base font-serif text-[#6B7280] dark:text-[#B0C4DE]"
          variants={authorVariants}
          initial="hidden"
          animate="visible"
          key={currentQuote.author}
        >
          — {currentQuote.author}
        </motion.div>
      </div>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#B0C4DE] hover:bg-[#D8BFD8]/20 hover:shadow-sm transition-all"
          onClick={() => setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            key={currentQuote.text}
          >
            <RefreshCw className="h-5 w-5" />
          </motion.div>
        </Button>
      </motion.div>
    </motion.div>
  );
};