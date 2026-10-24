import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Bot,
  User,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  Briefcase,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import { formatTimePKT } from '../../lib/locale/pakistan';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type AssistantMode = 'career' | 'recruiter' | 'interview';

const SYSTEM_INSTRUCTIONS: Record<AssistantMode, string> = {
  career:
    'You are NextStep AI Career Coach. You help software engineers, designers, product managers, and tech professionals build outstanding profiles, analyze job fit, optimize resumes for ATS screeners, negotiate offers, and plan career progression. Be encouraging, concise, actionable, and structured with bullet points where appropriate.',
  recruiter:
    'You are NextStep AI Recruiting Assistant. You assist hiring managers and technical recruiters in drafting high-converting candidate outreach emails, writing compelling job descriptions, structuring interview scorecards, and evaluating tech talent. Keep copy professional, crisp, and compelling.',
  interview:
    'You are NextStep AI Technical & Behavioral Interview Coach. Conduct mock interview simulations, suggest common technical questions for modern stacks (React, TypeScript, Go, Python, Distributed Systems), and evaluate candidate responses using the STAR method (Situation, Task, Action, Result).',
};

const SUGGESTED_PROMPTS: Record<AssistantMode, string[]> = {
  career: [
    'How do I make my React/TypeScript profile stand out in Pakistan?',
    'Review my experience bullet points for ATS impact',
    'How to negotiate PKR compensation + USD inflation protection',
    'Tips for transitioning from Senior to Staff Engineer',
  ],
  recruiter: [
    'Draft a personalized outreach to a Senior Full-Stack candidate in Lahore',
    'Write a PKR job description for a Staff FinTech Backend Engineer',
    'Key screening questions for a Distributed Systems Engineer',
    'How to pitch hybrid engineering culture to top talent in Pakistan',
  ],
  interview: [
    'Ask me a behavioral question about handling RAAST peak traffic',
    'Top 5 React 19 and TypeScript interview questions',
    'Simulate a System Design interview for a Realtime Messaging App',
    'How should I structure my answer using the STAR method?',
  ],
};

export const GeminiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('career');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Assalam-o-Alaikum! Welcome to **NextStep Career AI**.\n\nI can help you optimize your ATS resume, benchmark PKR tech salaries across Lahore, Karachi & Islamabad, draft recruiter outreach, or run mock interviews.',
      timestamp: formatTimePKT(new Date()),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      textareaRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: formatTimePKT(new Date()),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Multi-turn payload
      const payload = {
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        systemInstruction: SYSTEM_INSTRUCTIONS[mode],
        model: 'gemini-3.8-flash',
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.text || 'I could not generate a response. Please try again.',
        timestamp: formatTimePKT(new Date()),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content:
          "I'm currently unable to connect to the AI service. Please try again in a few moments.",
        timestamp: formatTimePKT(new Date()),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. Switched to **${mode === 'career' ? 'Career Coach' : mode === 'recruiter' ? 'Recruiting Assistant' : 'Interview Prep'}** mode. What would you like help with?`,
        timestamp: formatTimePKT(new Date()),
      },
    ]);
  };

  // Render markdown-like bold and bullet formatting simply
  const renderFormattedText = (content: string) => {
    return content.split('\n').map((line, idx) => {
      // Format bold text **text**
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s+/, '') }}
          />
        );
      }
      if (/^\d+\.\s+/.test(line)) {
        return (
          <li
            key={idx}
            className="ml-4 list-decimal my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s+/, '') }}
          />
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p
          key={idx}
          className="my-1 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="no-print fixed bottom-20 md:bottom-5 right-4 md:right-5 z-40 flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full shadow-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/50"
          aria-label="Open NextStep AI Assistant"
        >
          <Sparkles className="w-4 h-4 text-blue-100" />
          <span className="font-semibold text-xs sm:text-sm tracking-tight whitespace-nowrap">NextStep AI</span>
        </button>
      )}

      {/* Floating Chat Drawer / Popover */}
      {isOpen && (
        <div
          className={`no-print fixed z-50 transition-all duration-200 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl overflow-hidden ${
            isExpanded
              ? 'bottom-4 right-4 w-[680px] max-w-[calc(100vw-2rem)] h-[720px] max-h-[calc(100vh-2rem)]'
              : 'bottom-20 md:bottom-6 right-4 md:right-6 w-[420px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-6rem)]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                <Sparkles className="w-4 h-4 text-blue-100" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">NextStep AI</h3>
                <p className="text-[11px] text-blue-100">
                  Career &amp; Recruiting Assistant · PKT
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={handleClear}
                title="Reset conversation"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => {
                setMode('career');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                mode === 'career'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Career Coach</span>
            </button>
            <button
              onClick={() => {
                setMode('recruiter');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                mode === 'recruiter'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Recruiter Co-Pilot</span>
            </button>
            <button
              onClick={() => {
                setMode('interview');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                mode === 'interview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Interview Prep</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-gray-50/50 dark:bg-gray-950/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-xs ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{renderFormattedText(m.content)}</div>

                  <div
                    className={`mt-1.5 flex items-center justify-between gap-3 text-[10px] ${
                      m.role === 'user' ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                        title="Copy message"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestion Chips */}
          <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 overflow-x-auto flex gap-1.5 text-[11px] no-scrollbar">
            {SUGGESTED_PROMPTS[mode].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700 text-left shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="relative flex items-end bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${mode === 'career' ? 'Career Coach' : mode === 'recruiter' ? 'Recruiting Co-Pilot' : 'Interview Prep'}... (Enter to send)`}
                rows={1}
                className="w-full bg-transparent resize-none border-none outline-none text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-2 py-1 max-h-24 min-h-[36px]"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className={`p-2 rounded-lg transition-all shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-1.5">
              NextStep AI can make mistakes. Verify critical career and hiring details.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
