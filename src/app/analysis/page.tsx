'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Bot, User, Loader2, BarChart3, TrendingUp, AlertTriangle, Wifi, Phone, Tv, Zap, Home as HomeIcon, Database, Search, Brain } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DashboardData {
  cabinSwitch: {
    online: number;
    offline: number;
    onlineCrew: number;
    offlineCrew: number;
    onlinePax: number;
    offlinePax: number;
  };
  wifi: {
    online: number;
    offline: number;
    onlineCabinCrew: number;
    offlineCabinCrew: number;
    onlineCabinPax: number;
    offlineCabinPax: number;
    onlinePublicCrew: number;
    offlinePublicCrew: number;
    onlinePublicPax: number;
    offlinePublicPax: number;
  };
  pbx: {
    online: number;
    offline: number;
    onlineCabinCrew: number;
    offlineCabinCrew: number;
    onlineCabinPax: number;
    offlineCabinPax: number;
    onlinePublicCrew: number;
    offlinePublicCrew: number;
    onlinePublicPax: number;
    offlinePublicPax: number;
  };
  tv: {
    online: number;
    offline: number;
    onlineCrew: number;
    offlineCrew: number;
    onlinePax: number;
    offlinePax: number;
  };
  totalOffline: number;
  lastUpdated?: string;
}

export default function AnalysisPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Claude, your intelligent ship systems analyst. I can help you analyze WiFi, PBX phone systems, CCTV field cables, and TV systems with deep reasoning and insights. What would you like to know about your ship's systems?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch dashboard data for reference
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          // Use demo data if API fails
          setDashboardData({
            cabinSwitch: { online: 45, offline: 5, onlineCrew: 20, offlineCrew: 2, onlinePax: 25, offlinePax: 3 },
            wifi: { online: 180, offline: 20, onlineCabinCrew: 80, offlineCabinCrew: 8, onlineCabinPax: 70, offlineCabinPax: 7, onlinePublicCrew: 15, offlinePublicCrew: 2, onlinePublicPax: 15, offlinePublicPax: 3 },
            pbx: { online: 85, offline: 15, onlineCabinCrew: 40, offlineCabinCrew: 5, onlineCabinPax: 35, offlineCabinPax: 6, onlinePublicCrew: 5, offlinePublicCrew: 2, onlinePublicPax: 5, offlinePublicPax: 2 },
            tv: { online: 120, offline: 10, onlineCrew: 50, offlineCrew: 3, onlinePax: 70, offlinePax: 7 },
            totalOffline: 50,
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Detect the system type based on keywords in the input
    const lowerInput = input.toLowerCase();
    let systemType = '';
    if (lowerInput.includes('cctv') || lowerInput.includes('camera') || lowerInput.includes('surveillance')) {
      systemType = 'CCTV';
    } else if (lowerInput.includes('wifi') || lowerInput.includes('wireless') || lowerInput.includes('network')) {
      systemType = 'WiFi';
    } else if (lowerInput.includes('pbx') || lowerInput.includes('phone') || lowerInput.includes('telephone') || lowerInput.includes('voip')) {
      systemType = 'PBX';
    } else if (lowerInput.includes('tv') || lowerInput.includes('television') || lowerInput.includes('entertainment')) {
      systemType = 'TV';
    }
    
    // Create focused instructions based on detected system type
    const tableInstructions = "Present any numerical data in table format with markdown. Start any direct answer with 'ANSWER:' and highlight key findings.";
    const locationInstructions = "If showing location or distribution data, use a structured table format.";
    const focusInstructions = "Highlight the direct answer to the question prominently. Keep explanations concise and directly relevant to the question.";
    
    let focusedInstructions = `${tableInstructions} ${locationInstructions} ${focusInstructions}`;
    
    // Add system-specific focus if a system was detected
    if (systemType) {
      focusedInstructions = `Focus ONLY on the ${systemType} system. ${focusedInstructions} Do not include information about other systems unless explicitly requested.`;
    }
    
    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    // Add user's message to the state
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      console.log('🎯 === FRONTEND: Sending request to /api/claude ===');
      console.log('🎯 Message:', input);
      console.log('🎯 SystemType detected:', systemType);
      console.log('🎯 Instructions:', focusedInstructions);
      
      // Call Claude API with enhanced instructions
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          queryType: 'analysis',
          systemType: systemType,
          instructions: focusedInstructions
        }),
      });
      
      console.log('🎯 Response status:', response.status);
      console.log('🎯 Response ok:', response.ok);

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content || "I couldn't generate a response. Please try again.",
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response from Claude API');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const determineQueryType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('wifi')) return 'wifi_analysis';
    if (lowerMessage.includes('phone') || lowerMessage.includes('pbx')) return 'pbx_analysis';
    if (lowerMessage.includes('cctv') || lowerMessage.includes('cable')) return 'cctv_analysis';
    if (lowerMessage.includes('tv') || lowerMessage.includes('television')) return 'tv_analysis';
    
    return 'system_overview';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick questions removed as requested
  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const formatAIResponse = (content: string) => {
    // Check for table markers
    const hasMarkdownTable = content.includes('|') && content.includes('---');
    
    if (hasMarkdownTable) {
      return formatMarkdownTables(content);
    }
    
    // Split content into lines for normal formatting
    const lines = content.split('\n');
    const formattedLines = lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle direct answers (highlighted prominently)
      if (trimmedLine.includes('ANSWER:') || trimmedLine.includes('RESULT:') || trimmedLine.includes('TOTAL:') || trimmedLine.includes('SUMMARY:')) {
        return (
          <div key={index} className="font-bold text-xl text-amber-400 my-4 p-3 bg-slate-800 rounded-lg border-l-4 border-amber-500 shadow-lg">
            {trimmedLine}
          </div>
        );
      }
      
      // Handle section headers with emojis or system names
      if (trimmedLine.includes('📊') || trimmedLine.includes('📹') || trimmedLine.includes('📞') || 
          trimmedLine.includes('🌐') || trimmedLine.includes('📈') || trimmedLine.includes('CCTV') ||
          trimmedLine.includes('Analysis') || trimmedLine.includes('Breakdown') || trimmedLine.includes('WiFi System') ||
          trimmedLine.includes('PBX Phone System') || trimmedLine.includes('TV System')) {
        return (
          <div key={index} className="font-bold text-lg text-blue-400 mt-4 mb-3 pb-2 border-b border-blue-500">
            {trimmedLine}
          </div>
        );
      }
      
      // Handle subsection headers
      if (trimmedLine.includes('Insights:') || trimmedLine.includes('Recommendations:') || trimmedLine.includes('Status:') ||
          trimmedLine.includes('Installation Status:') || trimmedLine.includes('Cabin Analysis:') || trimmedLine.includes('Priority Issues:') ||
          trimmedLine.includes('Distribution:') || trimmedLine.includes('Locations:')) {
        return (
          <div key={index} className="font-semibold text-md text-blue-300 mt-3 mb-2">
            {trimmedLine}
          </div>
        );
      }
      
      // Handle bullet points with key-value pairs
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
        const parts = trimmedLine.split(':');
        const bulletChar = trimmedLine.startsWith('•') ? '•' : '- ';
        
        if (parts.length === 2) {
          const key = parts[0].replace(bulletChar, '').trim();
          const value = parts[1].trim();
          
          // Check if value is a number or contains numbers
          if (/\d/.test(value)) {
            return (
              <div key={index} className="flex justify-between items-center py-3 border-b border-slate-600 hover:bg-slate-600 transition-colors rounded px-2">
                <span className="text-slate-300 font-medium">{key}</span>
                <span className="font-bold text-white text-lg bg-slate-700 px-3 py-1 rounded">{value}</span>
              </div>
            );
          } else {
            return (
              <div key={index} className="flex justify-between items-center py-3 border-b border-slate-600 hover:bg-slate-600 transition-colors rounded px-2">
                <span className="text-slate-300">{key}</span>
                <span className="font-semibold text-white bg-slate-700 px-3 py-1 rounded">{value}</span>
              </div>
            );
          }
        }
        
        // Handle bullet points without colons
        return (
          <div key={index} className="py-2 pl-4 border-l-2 border-slate-600 ml-2">
            <span className="text-slate-200">{trimmedLine.replace(bulletChar, '').trim()}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      if (/^\d+\./.test(trimmedLine)) {
        return (
          <div key={index} className="py-2 pl-4 border-l-2 border-green-500 ml-2">
            <span className="text-slate-200">{trimmedLine}</span>
          </div>
        );
      }
      
      // Handle lines that look like metadata
      if (trimmedLine.includes('Based on') || trimmedLine.includes('Overall') || trimmedLine.includes('For more')) {
        return (
          <div key={index} className="text-xs text-slate-400 italic py-2 bg-slate-800 rounded px-2">
            {trimmedLine}
          </div>
        );
      }
      
      // Handle regular text
      if (trimmedLine) {
        return (
          <div key={index} className="py-1">
            <span className="text-slate-200">{trimmedLine}</span>
          </div>
        );
      }
      
      return null;
    });
    
    return <div className="space-y-1">{formattedLines}</div>;
  };
  
  // Helper function to format markdown tables
  const formatMarkdownTables = (content: string) => {
    // Split content by sections
    const sections = content.split('\n\n');
    
    // Process each section
    const processedSections = sections.map((section, sectionIndex) => {
      // Check if this section contains a table
      if (section.includes('|') && section.includes('---')) {
        // Split the table section into lines
        const lines = section.split('\n');
        const tableLines: React.ReactElement[] = [];
        const otherLines: string[] = [];
        
        let isTable = false;
        let tableHeaders: string[] = [];
        
        // Process each line to separate table and non-table content
        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
            isTable = true;
            
            // Extract table row data
            const cells = trimmedLine
              .split('|')
              .filter(cell => cell !== '')
              .map(cell => cell.trim());
            
            // Check if this is a header separator row
            const isSeparator = cells.every(cell => cell.startsWith('-') && cell.endsWith('-'));
            
            if (!isSeparator) {
              // If it's the first non-separator row, it's likely headers
              if (tableHeaders.length === 0) {
                tableHeaders = cells;
              } else {
                // It's data row
                tableLines.push(
                  <tr key={`row-${lineIndex}`} className="hover:bg-slate-700">
                    {cells.map((cell, cellIndex) => (
                      <td key={`cell-${lineIndex}-${cellIndex}`} className="border border-slate-600 p-2 text-slate-200">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              }
            }
          } else {
            // Not a table line
            otherLines.push(trimmedLine);
          }
        });
        
        // If we found a table
        if (isTable && tableHeaders.length > 0) {
          return (
            <div key={`section-${sectionIndex}`} className="my-4">
              {/* Render any text before the table */}
              {otherLines.length > 0 && (
                <div className="mb-3">
                  {otherLines.map((line, idx) => {
                    // Format any headers in the text
                    if (line.includes('ANSWER:') || line.includes('RESULT:') || line.includes('TOTAL:')) {
                      return (
                        <div key={`text-${idx}`} className="font-bold text-xl text-amber-400 my-4 p-3 bg-slate-800 rounded-lg border-l-4 border-amber-500 shadow-lg">
                          {line}
                        </div>
                      );
                    }
                    
                    if (line.includes('Analysis') || line.includes('Breakdown')) {
                      return (
                        <div key={`text-${idx}`} className="font-bold text-lg text-blue-400 mt-4 mb-3 pb-2 border-b border-blue-500">
                          {line}
                        </div>
                      );
                    }
                    
                    return line ? <p key={`text-${idx}`} className="text-slate-200 my-2">{line}</p> : null;
                  })}
                </div>
              )}
              
              {/* Render the table */}
              <div className="overflow-x-auto rounded-lg border border-slate-600 shadow-lg">
                <table className="w-full bg-slate-800">
                  <thead className="bg-slate-700">
                    <tr>
                      {tableHeaders.map((header, idx) => (
                        <th key={`header-${idx}`} className="border border-slate-500 p-2 text-left text-white font-bold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableLines}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
      }
      
      // If not a table section, process it as plain text
      return (
        <div key={`section-${sectionIndex}`} className="space-y-1">
          {section.split('\n').map((line, idx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;
            
            // Format any headers in the text
            if (trimmedLine.includes('ANSWER:') || trimmedLine.includes('RESULT:') || trimmedLine.includes('TOTAL:')) {
              return (
                <div key={`line-${idx}`} className="font-bold text-xl text-amber-400 my-4 p-3 bg-slate-800 rounded-lg border-l-4 border-amber-500 shadow-lg">
                  {trimmedLine}
                </div>
              );
            }
            
            if (trimmedLine.includes('Analysis') || trimmedLine.includes('Breakdown')) {
              return (
                <div key={`line-${idx}`} className="font-bold text-lg text-blue-400 mt-4 mb-3 pb-2 border-b border-blue-500">
                  {trimmedLine}
                </div>
              );
            }
            
            return <p key={`line-${idx}`} className="text-slate-200 my-2">{trimmedLine}</p>;
          })}
        </div>
      );
    });
    
    return <div className="space-y-2">{processedSections}</div>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
              <HomeIcon className="h-5 w-5" />
              <span>Home</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Claude AI Analysis</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Claude AI Analysis</h1>
          </div>
          <p className="text-slate-300 text-lg">
            Get intelligent insights and reasoning about your ship's systems using Claude 3.5 Sonnet
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Claude Assistant Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-[600px] flex flex-col">
              {/* Claude Assistant Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Claude Assistant</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">Ask me anything about your ship's systems</p>
              </div>

              {/* Quick Questions section removed */}
              <div className="flex-1 overflow-y-auto mb-4">
                {/* Question cards removed as requested */}
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-700 pt-4">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Claude about your ship's systems..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    rows={2}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                
                {isLoading && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Claude is analyzing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Claude Responses Display */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 rounded-lg border border-slate-700 h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Claude Analysis Results</h3>
                    <p className="text-sm text-slate-400">View intelligent insights and reasoning from Claude</p>
                  </div>
                </div>
              </div>

              {/* Messages Display */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 1 && messages[0].role === 'assistant' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-400">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg">Start a conversation with Claude</p>
                      <p className="text-sm mt-2">Use the quick questions or type your own query</p>
                    </div>
                  </div>
                ) : (
                  messages.slice(1).map((message) => (
                    <div
                      key={message.id}
                      className={`${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {message.role === 'user' && (
                        <div className="inline-block bg-purple-500 text-white p-3 rounded-lg max-w-[80%] mb-2">
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className="text-xs mt-2 text-purple-100">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      )}
                      
                      {message.role === 'assistant' && (
                        <div className="bg-slate-700 text-slate-200 p-6 rounded-lg border-l-4 border-purple-500 shadow-lg">
                          <div className="text-sm leading-relaxed">
                            {formatAIResponse(message.content)}
                          </div>
                          <div className="text-xs mt-4 text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-600">
                            <Brain className="h-3 w-3" />
                            Claude • {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="bg-slate-700 text-slate-200 p-4 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Claude is analyzing your request...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
