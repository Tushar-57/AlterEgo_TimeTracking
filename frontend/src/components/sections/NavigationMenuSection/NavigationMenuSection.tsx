import { ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
// NavigationMenuSection.tsx
export const NavigationMenuSection = ({ 
  currentDate,
  onDateChange
}: { 
  currentDate: Date;
  onDateChange: (date: Date) => void;
}) => {
  // Add date navigation handlers
  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  return (
    // Update the header section
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1">
        <div className="text-white">
          {currentDate.toLocaleString('default', { month: 'long' })}
        </div>
        <div className="text-red-500">
          {currentDate.getFullYear()}
        </div>
      </div>
      <div className="flex">
        <button onClick={handlePreviousMonth}>
          <ChevronLeftIcon className="w-6 h-6 text-white" />
        </button>
        <button onClick={handleNextMonth}>
          <ChevronRightIcon className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};