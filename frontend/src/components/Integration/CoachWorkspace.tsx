const CoachWorkspace = () => {
  return (
    <div className="h-screen w-full bg-gray-50">
      <div className="h-14 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-wide text-gray-700">AI Coach Workspace</h1>
        <span className="text-xs text-gray-500">Powered by Agentic LLM Orchestrator</span>
      </div>
      <iframe
        title="AI Coach"
        src="/coach/"
        className="w-full border-0"
        style={{ height: 'calc(100vh - 56px)' }}
      />
    </div>
  );
};

export default CoachWorkspace;
