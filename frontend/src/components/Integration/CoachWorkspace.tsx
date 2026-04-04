import { useMemo } from 'react';

const normalizePath = (path: string): string => {
  const normalized = path.replace(/\/+$/, '');
  return normalized.length > 0 ? normalized : '/';
};

const resolveCoachSrc = (): string => {
  const explicitCoachUrl = (import.meta.env.VITE_AGENTIC_COACH_URL as string | undefined)?.trim();
  const agenticApiOrigin = (import.meta.env.VITE_AGENTIC_API_ORIGIN as string | undefined)?.trim();

  if (explicitCoachUrl) {
    return explicitCoachUrl;
  }

  if (agenticApiOrigin) {
    return `${agenticApiOrigin.replace(/\/+$/, '')}/coach/`;
  }

  return '/coach/';
};

const CoachWorkspace = () => {
  const coachSrc = useMemo(() => {
    const resolved = resolveCoachSrc();

    try {
      const url = new URL(resolved, window.location.origin);
      const sameOrigin = url.origin === window.location.origin;
      const samePath = normalizePath(url.pathname) === normalizePath(window.location.pathname);

      if (sameOrigin && samePath) {
        return null;
      }
    } catch {
      return resolved;
    }

    return resolved;
  }, []);

  return (
    <div className="h-screen w-full bg-gray-50">
      <div className="h-14 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-wide text-gray-700">AI Coach Workspace</h1>
        <span className="text-xs text-gray-500">Powered by Agentic LLM Orchestrator</span>
      </div>
      {coachSrc ? (
        <iframe
          title="AI Coach"
          src={coachSrc}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 56px)' }}
        />
      ) : (
        <div className="h-[calc(100vh-56px)] w-full px-6 py-8 text-sm text-gray-700">
          Unable to load AI Coach because the current route points back to itself. Configure either
          VITE_AGENTIC_COACH_URL or VITE_AGENTIC_API_ORIGIN for this frontend deployment.
        </div>
      )}
    </div>
  );
};

export default CoachWorkspace;
