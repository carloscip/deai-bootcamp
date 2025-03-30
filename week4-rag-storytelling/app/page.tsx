import Header from "@/app/components/header";
import { ChatSection } from "./components/chat-section";
import CharacterExtractor from "./components/CharacterExtractor";
import { CharacterProvider } from "./context/CharacterContext";

export default function Home() {
  return (
    <CharacterProvider>
      <main className="min-h-screen w-screen flex flex-col items-center py-8 background-gradient overflow-x-hidden">
        <div className="w-[90%] lg:w-[60rem] space-y-4 lg:space-y-8 mb-16">
          <Header />
          <div className="flex flex-col gap-4">
            <div className="bg-white/100 backdrop-blur-sm rounded-lg p-4">
              <CharacterExtractor />
            </div>
            <div className="flex-1">
              <ChatSection />
            </div>
          </div>
        </div>
      </main>
    </CharacterProvider>
  );
}
