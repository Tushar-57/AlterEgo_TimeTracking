import { motion } from 'framer-motion';
import { Button } from '../ui';
import { RefreshCw } from 'lucide-react';

export const QuoteComponent = ({
  currentQuote,
  setCurrentQuote,
  quotes,
}: {
  currentQuote: { text: string; author: string };
  setCurrentQuote: (quote: { text: string; author: string }) => void;
  quotes: { text: string; author: string }[];
}) => (
  <div className="flex items-center justify-center gap-4">
    <motion.div
      className="text-center text-lg italic font-merriweather text-gray-600 dark:text-gray-400 text-shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={currentQuote.text}
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
    >
      "{currentQuote.text}" — {currentQuote.author}
    </motion.div>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])}
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  </div>
);