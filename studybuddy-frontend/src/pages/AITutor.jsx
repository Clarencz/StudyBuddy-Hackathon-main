import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  MessageSquare,
  BookOpen,
  FileQuestion,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AITutor = () => {
  const { apiCall } = useAuth();

  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const [availableModels, setAvailableModels] = useState({});
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [flashcards, setFlashcards] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");

  // Fetch available models and data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get available models
        const modelsRes = await apiCall("/ai/models", { method: "GET" });
        setAvailableModels(modelsRes.models || {});
        setSelectedModel(modelsRes.default_model || "gpt-3.5-turbo");

        // Get conversations
        const convRes = await apiCall("/ai/conversations", { method: "GET" });
        setConversations(convRes.conversations || []);

        // Get flashcards
        const flashRes = await apiCall("/ai/flashcards", { method: "GET" });
        setFlashcards(flashRes.flashcards || []);

        // Get practice tests
        const testRes = await apiCall("/ai/practice-tests", { method: "GET" });
        setPracticeTests(testRes.practice_tests || []);
      } catch (err) {
        console.error("Failed to fetch AI data:", err);
      }
    };
    fetchData();
  }, []);

  // Load conversation messages when conversation is selected
  useEffect(() => {
    if (currentConversation) {
      loadConversationMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const loadConversationMessages = async (conversationId) => {
    try {
      const res = await apiCall(
        `${
          import.meta.env.VITE_API_URL
        }/ai/conversations/${conversationId}/messages`,
        { method: "GET" }
      );
      setMessages(res.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await apiCall("/ai/conversations", {
        method: "POST",
        body: JSON.stringify({
          type: "qa",
          title: "New Chat",
          model: selectedModel,
        }),
      });

      if (res?.conversation) {
        const newConv = res.conversation;
        setConversations((prev) => [newConv, ...prev]);
        setCurrentConversation(newConv);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
      alert("Failed to create new conversation");
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    let conversation = currentConversation;

    // Create new conversation if none exists
    if (!conversation) {
      try {
        const res = await apiCall("/ai/conversations", {
          method: "POST",
          body: JSON.stringify({
            type: "qa",
            title: question.substring(0, 50) + "...",
            model: selectedModel,
          }),
        });
        conversation = res.conversation;
        setCurrentConversation(conversation);
        setConversations((prev) => [conversation, ...prev]);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        alert("Failed to create conversation");
        return;
      }
    }

    setLoading(true);

    try {
      const msgRes = await apiCall(
        `${import.meta.env.VITE_API_URL}/ai/conversations/${
          conversation.id
        }/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content: question }),
        }
      );

      if (msgRes?.user_message && msgRes?.ai_message) {
        setMessages((prev) => [
          ...prev,
          msgRes.user_message,
          msgRes.ai_message,
        ]);
        setQuestion("");
      }
    } catch (err) {
      console.error("AI Tutor request failed:", err);
      alert(err.message || "Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChat = async () => {
    if (!question.trim()) return;
    setLoading(true);

    try {
      const res = await apiCall("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: question,
          model: selectedModel,
        }),
      });

      setAnswers((prev) => [
        ...prev,
        {
          question: res.message,
          answer: res.response,
          model: res.model,
        },
      ]);
      setQuestion("");
    } catch (err) {
      console.error("Quick chat failed:", err);
      alert(err.message || "Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    const text = prompt("Enter text to generate flashcards from:");
    if (!text) return;

    try {
      const res = await apiCall("/ai/generate-flashcards", {
        method: "POST",
        body: JSON.stringify({
          text: text,
          count: 5,
          model: selectedModel,
        }),
      });
      setFlashcards(res.flashcards || []);
    } catch (err) {
      console.error("Flashcard generation failed:", err);
      alert(err.message || "Failed to generate flashcards");
    }
  };

  const handleGeneratePracticeTest = async () => {
    const text = prompt("Enter text to generate practice test from:");
    if (!text) return;

    try {
      const res = await apiCall("/ai/generate-practice-test", {
        method: "POST",
        body: JSON.stringify({
          text: text,
          question_count: 5,
          model: selectedModel,
        }),
      });
      if (res.practice_test) {
        setPracticeTests((prev) => [res.practice_test, ...prev]);
      }
    } catch (err) {
      console.error("Practice test generation failed:", err);
      alert(err.message || "Failed to generate practice test");
    }
  };

  const updateConversationModel = async (conversationId, newModel) => {
    try {
      await apiCall(
        `${
          import.meta.env.VITE_API_URL
        }/ai/conversations/${conversationId}/model`,
        {
          method: "PUT",
          body: JSON.stringify({ model: newModel }),
        }
      );

      // Update the conversation in state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, model: newModel } : conv
        )
      );

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) => ({ ...prev, model: newModel }));
      }
    } catch (err) {
      console.error("Failed to update model:", err);
      alert("Failed to update model");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Bot className="h-8 w-8 mr-2" /> AI Tutor
        </h1>

        {/* Model Selector */}
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select AI Model" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(availableModels).map(([key, model]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-gray-500">
                      {model.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        {[
          { id: "chat", label: "Chat", icon: MessageSquare },
          { id: "flashcards", label: "Flashcards", icon: BookOpen },
          { id: "tests", label: "Practice Tests", icon: FileQuestion },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversations</CardTitle>
                <Button
                  onClick={createNewConversation}
                  size="sm"
                  className="w-full"
                >
                  New Chat
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setCurrentConversation(conv)}
                    className={`p-2 rounded cursor-pointer text-sm ${
                      currentConversation?.id === conv.id
                        ? "bg-blue-100 border border-blue-300"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium truncate">{conv.title}</div>
                    <div className="text-xs text-gray-500">
                      {conv.model} • {conv.message_count} messages
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    {currentConversation
                      ? currentConversation.title
                      : "AI Chat"}
                  </CardTitle>
                  {currentConversation && (
                    <Select
                      value={currentConversation.model || selectedModel}
                      onValueChange={(model) =>
                        updateConversationModel(currentConversation.id, model)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(availableModels).map(([key, model]) => (
                          <SelectItem key={key} value={key}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-100 ml-auto max-w-[80%]"
                          : "bg-gray-100 mr-auto max-w-[80%]"
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">
                        {msg.role === "user" ? "You" : "AI Tutor"}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAsk();
                      }
                    }}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAsk}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? "Thinking..." : "Send"}
                    </Button>
                    <Button
                      onClick={handleQuickChat}
                      disabled={loading}
                      variant="outline"
                    >
                      Quick Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Chat Results */}
            {answers.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Quick Chat Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {answers.map((qa, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="font-semibold text-sm text-gray-600 mb-1">
                        Model: {qa.model}
                      </div>
                      <div className="font-semibold mb-2">Q: {qa.question}</div>
                      <div className="whitespace-pre-wrap">A: {qa.answer}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Flashcards Tab */}
      {activeTab === "flashcards" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" /> Flashcards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateFlashcards} className="w-full">
              Generate Flashcards with{" "}
              {availableModels[selectedModel]?.name || selectedModel}
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card) => (
                <div key={card.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="font-semibold mb-2">Q: {card.question}</div>
                  <div className="text-gray-700 mb-2">A: {card.answer}</div>
                  <div className="text-xs text-gray-500">
                    Difficulty: {card.difficulty} | Category: {card.category}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice Tests Tab */}
      {activeTab === "tests" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileQuestion className="h-5 w-5 mr-2" /> Practice Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGeneratePracticeTest} className="w-full">
              Generate Practice Test with{" "}
              {availableModels[selectedModel]?.name || selectedModel}
            </Button>
            <div className="space-y-4">
              {practiceTests.map((test) => (
                <div key={test.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="font-semibold mb-2">{test.title}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    Questions: {test.total_questions} |
                    {test.score && ` Score: ${test.score}% |`}
                    Created: {new Date(test.created_at).toLocaleDateString()}
                  </div>
                  {test.questions && (
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">
                        View Questions
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-white p-2 rounded">
                        {typeof test.questions === "string"
                          ? test.questions
                          : JSON.stringify(test.questions, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AITutor;
