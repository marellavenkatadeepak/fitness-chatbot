"use client";

import React, { useState, useRef, useEffect } from "react";
import { generateFitnessReport } from "../utils/generateReport";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

const QUICK_PROMPTS = [
    "🏋️ Create a beginner workout plan",
    "🥗 Suggest a high-protein meal",
    "🏃 How to start running?",
    "💪 Best exercises for abs",
];

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 150) + "px";
        }
    }, [input]);

    const sendMessage = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: messageText,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const allMessages = [
                ...messages.map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: messageText },
            ];

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: allMessages }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get response");
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content:
                    error instanceof Error
                        ? error.message
                        : "Sorry, something went wrong. Please try again.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatMessage = (content: string) => {
        // Basic markdown-like formatting
        return content.split("\n").map((line, i) => {
            // Bold text
            let formatted = line.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="text-emerald-300 font-semibold">$1</strong>'
            );
            // Bullet points
            if (formatted.startsWith("- ") || formatted.startsWith("* ")) {
                formatted = `<span class="text-emerald-400 mr-2">•</span>${formatted.slice(2)}`;
                return (
                    <div key={i} className="flex items-start ml-2 my-0.5">
                        <span dangerouslySetInnerHTML={{ __html: formatted }} />
                    </div>
                );
            }
            // Numbered items
            const numberedMatch = formatted.match(/^(\d+)\.\s/);
            if (numberedMatch) {
                return (
                    <div key={i} className="flex items-start ml-2 my-0.5">
                        <span className="text-emerald-400 font-bold mr-2 min-w-[1.5rem]">
                            {numberedMatch[1]}.
                        </span>
                        <span
                            dangerouslySetInnerHTML={{
                                __html: formatted.slice(numberedMatch[0].length),
                            }}
                        />
                    </div>
                );
            }
            // Empty lines = spacing
            if (!formatted.trim()) return <div key={i} className="h-2" />;
            return (
                <div
                    key={i}
                    className="my-0.5"
                    dangerouslySetInnerHTML={{ __html: formatted }}
                />
            );
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        {/* Hero Icon */}
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse-slow">
                                <svg
                                    className="w-12 h-12 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                                    />
                                </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">✨</span>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            Hey there, champ! 💪
                        </h2>
                        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                            I&apos;m your personal AI fitness coach. Ask me about workouts,
                            nutrition, recovery, or anything health &amp; wellness related.
                        </p>

                        {/* Quick Prompts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {QUICK_PROMPTS.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => sendMessage(prompt)}
                                    className="group px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 hover:border-emerald-500/50 hover:bg-gray-800 text-sm text-gray-300 hover:text-emerald-400 transition-all duration-300 text-left backdrop-blur-sm"
                                >
                                    <span className="group-hover:translate-x-1 inline-block transition-transform duration-300">
                                        {prompt}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[75%] ${message.role === "user"
                                        ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-emerald-900/20"
                                        : "bg-gray-800/80 text-gray-200 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-700/50 backdrop-blur-sm"
                                        }`}
                                >
                                    {message.role === "assistant" && (
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700/50">
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                                <span className="text-[10px]">🔥</span>
                                            </div>
                                            <span className="text-xs font-medium text-emerald-400">
                                                FitCoach AI
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {message.role === "assistant"
                                            ? formatMessage(message.content)
                                            : message.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-gray-800/80 text-gray-200 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-700/50 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700/50">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                            <span className="text-[10px]">🔥</span>
                                        </div>
                                        <span className="text-xs font-medium text-emerald-400">
                                            FitCoach AI
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="typing-dot w-2 h-2 rounded-full bg-emerald-400" />
                                        <div className="typing-dot w-2 h-2 rounded-full bg-emerald-400 animation-delay-200" />
                                        <div className="typing-dot w-2 h-2 rounded-full bg-emerald-400 animation-delay-400" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-800 bg-gray-950/80 backdrop-blur-xl p-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-end gap-3 bg-gray-900 rounded-2xl border border-gray-700/50 focus-within:border-emerald-500/50 transition-colors duration-300 p-2">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about workouts, nutrition, or fitness goals..."
                            rows={1}
                            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none px-2 py-1.5 text-sm max-h-[150px]"
                        />
                        {/* Download Report Button */}
                        {messages.length > 0 && (
                            <button
                                onClick={() => generateFitnessReport(messages)}
                                title="Download Fitness Report"
                                className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/50 hover:border-emerald-500/50 rounded-xl text-gray-400 hover:text-emerald-400 transition-all duration-300 flex-shrink-0"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                    />
                                </svg>
                            </button>
                        )}
                        {/* Send Button */}
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-300 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/25 disabled:shadow-none flex-shrink-0"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                />
                            </svg>
                        </button>
                    </div>
                    <p className="text-xs text-gray-600 text-center mt-2">
                        FitCoach AI may make mistakes. Always consult a professional for medical advice.
                    </p>
                </div>
            </div>
        </div>
    );
}
