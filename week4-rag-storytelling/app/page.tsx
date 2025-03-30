import Header from "@/app/components/header";
import { ChatSection } from "./components/chat-section";
import CharacterExtractor from "./components/CharacterExtractor";
import { CharacterProvider } from "./context/CharacterContext";

export default function Home() {
  return (
    <CharacterProvider>
      <main className="h-screen w-screen flex justify-center items-center background-gradient">
        <div className="space-y-2 lg:space-y-10 w-[90%] lg:w-[60rem]">
          <Header />
          <div className="h-[65vh] flex flex-col gap-4">
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
