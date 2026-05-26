import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, RefreshCw, HelpCircle, Brain, Flame, Target } from "lucide-react";
import api from "../api/axios.js";
import Markdown from "./Markdown.jsx";

const SUGGESTIONS = [
  {
    icon: Flame,
    title: "Overcoming broken streaks",
    question: "How do I recover when my habit streak breaks and I feel demotivated?",
    desc: "Behavior science approach to comebacks.",
  },
  {
    icon: Target,
    title: "Scientific Morning Routine",
    question: "How do I design a highly effective, friction-free morning routine using habits?",
    desc: "Optimize your first hour of the day.",
  },
  {
    icon: Brain,
    title: "The science of habit loops",
    question: "How do I build a habit loop (cue, routine, reward) for drinking water?",
    desc: "Neurological triggers that drive consistency.",
  },
  {
    icon: HelpCircle,
    title: "Consistency vs Intensity",
    question: "Why is consistency more important than intensity when starting a habit?",
    desc: "The 2-minute rule explained.",
  },
];

export default function LandingAIChatBoard() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your AI Habit Coach. 🌟\n\nI specialize in helping you build science-backed routines that stick. Go ahead and ask me any question about habit loops, streak recovery, environment design, or morning structures — or just click one of the suggestions on the left!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/public-chat", { question: q });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.data.content },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered a connection issue. Once you register for an account, you will unlock full, robust access to our premium AI coaches! Let's get started today.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-brand-500/5 to-transparent border border-brand-500/20 shadow-xl rounded-2xl max-w-5xl mx-auto my-12">
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.15), transparent 45%), radial-gradient(circle at 0% 100%, rgba(236, 72, 153, 0.1), transparent 45%)",
        }}
      />

      <div className="relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 chip mb-3 bg-brand-500/15 text-brand-700 dark:text-brand-300">
            <Sparkles size={12} className="animate-pulse" />
            Try it live
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Consult the AI Habit Coach
          </h2>
          <p className="mt-2.5 text-soft text-sm md:text-base leading-relaxed">
            Get personalized advice on how to build atomic routines and overcome mental friction. Click a card to chat instantly or write your own.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Left panel - Suggestions */}
          <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1 hidden lg:block">
              Suggested topics to ask
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {SUGGESTIONS.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => send(item.question)}
                    disabled={loading}
                    className="group text-left p-4 rounded-xl border border-[var(--surface-border)] glass hover:bg-brand-500/5 hover:border-brand-500/30 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex gap-3.5 items-start"
                  >
                    <span className="p-2 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform">
                      <IconComp size={16} />
                    </span>
                    <div>
                      <div className="font-semibold text-xs md:text-sm text-soft group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted mt-0.5 leading-snug">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel - Chat board */}
          <div className="lg:col-span-7 flex flex-col h-[420px] md:h-[450px] rounded-2xl glass border border-[var(--surface-border)] overflow-hidden shadow-lg bg-white/20 dark:bg-black/20">
            {/* Console Header */}
            <div className="px-4 py-3.5 border-b divider flex items-center justify-between bg-white/10 dark:bg-black/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-500/30">
                  <Sparkles size={14} className="animate-spin-slow" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-soft">
                    AI Habit Coach
                  </div>
                  <div className="text-[10px] text-muted flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Preview Mode (No login required)
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable messages container */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  } animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs md:text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-tr-md shadow-md shadow-brand-500/20"
                        : "glass bg-white/40 dark:bg-black/40 rounded-tl-md border border-[var(--surface-border)] text-soft"
                    }`}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <Markdown>{m.content}</Markdown>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="glass bg-white/40 dark:bg-black/40 rounded-2xl rounded-tl-md px-4 py-3 text-xs md:text-sm text-soft flex items-center gap-2 border border-[var(--surface-border)]">
                    <RefreshCw size={12} className="animate-spin text-brand-600 dark:text-brand-400" />
                    Coach is compiling insights...
                  </div>
                </div>
              )}
            </div>

            {/* Form Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="p-3 border-t divider flex gap-2 bg-white/10 dark:bg-black/10"
            >
              <input
                className="input text-xs md:text-sm"
                placeholder="Ask about habit building or scientific routines..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-primary px-4 shrink-0 transition-transform active:scale-95 duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !input.trim()}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
