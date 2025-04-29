import { ArrowLeft } from "lucide-react";

export const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button 
      onClick={onClick}
      className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
  