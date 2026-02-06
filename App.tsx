import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LearningStyle, MessageRole, UserSettings } from './types';
import SettingsPanel from './components/SettingsPanel';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { generateLessonContent, generateLessonVisual, generateLessonAudio } from './services/geminiService';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: "**Welcome to NeuroLearn!** \n\nI'm your AI tutor specialized in Machine Learning. I can explain concepts visually, auditory, mathematically, or with code.\n\nTry asking: *\"How does Gradient Descent work?\"*",
      timestamp: Date.now()
    }
  ]);
  
  const [settings, setSettings] = useState<UserSettings>({
    learningStyle: LearningStyle.VISUAL,
    autoAudio: false,
    autoVisual: true,
    apiKey: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Prepare placeholder for model response
    const modelMsgId = (Date.now() + 1).toString();
    const modelPlaceholder: ChatMessage = {
      id: modelMsgId,
      role: MessageRole.MODEL,
      text: '',
      timestamp: Date.now(),
      isLoading: true
    };
    setMessages(prev => [...prev, modelPlaceholder]);

    try {
      // 1. Generate Text content
      const textResponse = await generateLessonContent(text, settings.learningStyle);
      
      // Update with text first
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId ? { ...msg, text: textResponse || "I couldn't generate a response.", isLoading: false } : msg
      ));

      // 2. Parallel Generation for Multi-modal assets if enabled or style dictates
      const promises = [];
      let visualData: string | null = null;
      let audioData: ArrayBuffer | null = null;

      // Force visuals if style is VISUAL or autoVisual is on
      const shouldGenVisual = settings.learningStyle === LearningStyle.VISUAL || settings.autoVisual;
      // Force audio if style is AUDITORY or autoAudio is on
      const shouldGenAudio = settings.learningStyle === LearningStyle.AUDITORY || settings.autoAudio;

      if (shouldGenVisual) {
        // Use the user prompt as the concept seed usually, or extract it. 
        // For simplicity, we use the user prompt.
        promises.push(generateLessonVisual(text).then(data => visualData = data));
      }

      if (shouldGenAudio && textResponse) {
        promises.push(generateLessonAudio(textResponse).then(data => audioData = data));
      }

      if (promises.length > 0) {
         // Wait for multimodal content
         await Promise.all(promises);
         
         // Update message with assets
         setMessages(prev => prev.map(msg => 
          msg.id === modelMsgId ? { 
            ...msg, 
            relatedImage: visualData || msg.relatedImage, 
            relatedAudio: audioData || msg.relatedAudio 
          } : msg
        ));
      }

    } catch (error) {
      console.error("Interaction failed", error);
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId ? { ...msg, text: "Sorry, I encountered an error connecting to the AI tutor.", isLoading: false } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Desktop Sidebar */}
      <SettingsPanel settings={settings} onUpdateSettings={setSettings} />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
             <div className="flex justify-end p-4">
               <button onClick={() => setMobileMenuOpen(false)}><X size={24} className="text-slate-500"/></button>
             </div>
             <SettingsPanel settings={settings} onUpdateSettings={setSettings} />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
          <div className="font-bold text-slate-800">NeuroLearn AI</div>
          <button onClick={() => setMobileMenuOpen(true)} className="text-slate-600">
            <Menu size={24} />
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
           <div className="max-w-4xl mx-auto w-full">
             {messages.map(msg => (
               <MessageBubble key={msg.id} message={msg} />
             ))}
             <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Input Area */}
        <InputArea onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default App;
