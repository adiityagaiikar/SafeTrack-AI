import { useEffect } from "react";

const SCRIPT_ID = "elevenlabs-convai-script";
const AGENT_ID  = "agent_0001kqadab82epksm82pdnq6wa96";

export default function VoiceCopilot() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return; // already injected

    const script = document.createElement("script");
    script.id    = SCRIPT_ID;
    script.src   = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    script.type  = "text/javascript";
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById(SCRIPT_ID);
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* eslint-disable-next-line */}
      <elevenlabs-convai agent-id={AGENT_ID} />
    </div>
  );
}
