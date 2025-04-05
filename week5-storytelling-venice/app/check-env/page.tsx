export default function CheckEnvPage() {
  // This will only be visible in the server-side rendered HTML
  // and won't expose your API key to clients
  const openaiKeyAvailable = !!process.env.OPENAI_API_KEY;
  const veniceKeyAvailable = !!process.env.VENICE_API_KEY;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Environment Variable Check</h1>
      <div className="p-4 border rounded space-y-4">
        <div>
          <p>
            OpenAI API Key:{" "}
            {openaiKeyAvailable ? "✅ Available" : "❌ Not available"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {openaiKeyAvailable
              ? "Your OpenAI API key is configured."
              : "Not required if using OpenRouter."}
          </p>
        </div>

        <div>
          <p>
            OpenRouter API Key:{" "}
            {veniceKeyAvailable ? "✅ Available" : "❌ Not available"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {veniceKeyAvailable
              ? "Your Venice API key is configured correctly."
              : "Please add VENICE_API_KEY to your .env.local file and restart the server."}
          </p>
        </div>
      </div>
    </div>
  );
}
