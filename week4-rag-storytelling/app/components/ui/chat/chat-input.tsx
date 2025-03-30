"use client";

import { ChatInput, useChatUI, useFile } from "@llamaindex/chat-ui";
import { DocumentInfo, ImagePreview } from "@llamaindex/chat-ui/widgets";
import { LlamaCloudSelector } from "./custom/llama-cloud-selector";
import { useClientConfig } from "./hooks/use-config";
import { useCharacters } from '@/app/context/CharacterContext';
import { useEffect } from 'react';
import "./styles.css";

export default function CustomChatInput() {
  const { requestData, isLoading, input, setInput } = useChatUI();
  const { backend } = useClientConfig();
  const {
    imageUrl,
    setImageUrl,
    uploadFile,
    files,
    removeDoc,
    reset,
    getAnnotations,
  } = useFile({ uploadAPI: `${backend}/api/chat/upload` });
  const { characters } = useCharacters();

  /**
   * Handles file uploads. Overwrite to hook into the file upload behavior.
   * @param file The file to upload
   */
  const handleUploadFile = async (file: File) => {
    // There's already an image uploaded, only allow one image at a time
    if (imageUrl) {
      alert("You can only upload one image at a time.");
      return;
    }

    try {
      // Upload the file and send with it the current request data
      await uploadFile(file, requestData);
    } catch (error: any) {
      // Show error message if upload fails
      alert(error.message);
    }
  };

  // Get references to the upload files in message annotations format
  const annotations = getAnnotations();

  // Create character context for story generation
  const characterContext = characters.length > 0
    ? `\n\nAvailable characters for the story:\n${characters.map(char => 
        `- ${char.name}: ${char.description}. Personality: ${char.personality}`
      ).join('\n')}\n\nPlease use these characters in your story, maintaining their personalities and characteristics.`
    : '';

  // Add character context to the input when it changes
  useEffect(() => {
    if (characters.length > 0) {
      const newInput = !input.trim()
        ? `Let's create a story with these characters:\n${characterContext}`
        : !input.includes('Available characters for the story:')
          ? input + characterContext
          : input;
      setInput(newInput);
    }
  }, [characters, characterContext, setInput, input]);

  return (
    <ChatInput
      className="shadow-xl rounded-xl w-full"
      resetUploadedFiles={reset}
      annotations={annotations}
    >
      <div>
        {/* Image preview section */}
        {imageUrl && (
          <ImagePreview url={imageUrl} onRemove={() => setImageUrl(null)} />
        )}
        {/* Document previews section */}
        {files.length > 0 && (
          <div className="flex gap-4 w-full overflow-auto py-2">
            {files.map((file) => (
              <DocumentInfo
                key={file.id}
                document={{ url: file.url, sources: [] }}
                className="mb-2 mt-2"
                onRemove={() => removeDoc(file)}
              />
            ))}
          </div>
        )}
      </div>
      <ChatInput.Form className="w-full">
        <div className="flex w-full gap-2 items-end">
          <div className="flex-1">
            <ChatInput.Field className="auto-resize-textarea w-full" />
          </div>
          <div className="flex items-center gap-2 px-2">
            <ChatInput.Upload onUpload={handleUploadFile} />
            <LlamaCloudSelector />
            <ChatInput.Submit
              disabled={
                isLoading || (!input.trim() && files.length === 0 && !imageUrl)
              }
            />
          </div>
        </div>
      </ChatInput.Form>
    </ChatInput>
  );
}
