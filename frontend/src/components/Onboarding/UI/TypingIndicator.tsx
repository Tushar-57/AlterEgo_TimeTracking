const TypingIndicator: React.FC = () => {
  return (
    <div className="mr-auto mb-4 max-w-[80%] rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5" aria-label="Assistant is typing">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
};

export default TypingIndicator;
