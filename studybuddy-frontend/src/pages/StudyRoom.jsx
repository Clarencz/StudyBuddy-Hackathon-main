import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  ArrowLeft,
  Users,
  Crown,
  UserMinus,
  UserPlus,
  Palette,
  Eraser,
  Download,
  Upload,
  Share2,
  FileText,
  Trash2,
  Settings,
  MessageSquare,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

const StudyRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("whiteboard");

  // Whiteboard state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState("pen");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [whiteboardData, setWhiteboardData] = useState(null);
  const [savingWhiteboard, setSavingWhiteboard] = useState(false);

  // Document sharing state
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [sharingDocument, setSharingDocument] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Member management state
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [memberAction, setMemberAction] = useState({});

  // Real-time updates
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (roomId) {
      fetchRoomData();
      fetchMembers();
      fetchDocuments();
      fetchWhiteboard();

      // Set up periodic updates for real-time collaboration
      const interval = setInterval(() => {
        updatePresence();
        fetchMembers();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [roomId]);

  const fetchRoomData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
      } else if (response.status === 404) {
        setError("Room not found");
      } else if (response.status === 403) {
        setError("Access denied. You are not a member of this room.");
      } else {
        throw new Error("Failed to fetch room data");
      }
    } catch (error) {
      console.error("Error fetching room data:", error);
      setError("Failed to load room data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/documents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchWhiteboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/whiteboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWhiteboardData(data.whiteboard_session);
        if (data.whiteboard_session?.session_data) {
          loadWhiteboardData(data.whiteboard_session.session_data);
        }
      }
    } catch (error) {
      console.error("Error fetching whiteboard:", error);
    }
  };

  const updatePresence = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/presence`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Left the room successfully");
        navigate("/study-rooms");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave room");
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error(error.message);
    }
  };

  // Whiteboard functions
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
  };

  const startDrawing = (e) => {
    if (currentTool === "pen" || currentTool === "eraser") {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);

    if (currentTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize * 2;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
    }

    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveWhiteboardData();
    }
  };

  const clearWhiteboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/whiteboard/clear`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        toast.success("Whiteboard cleared");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear whiteboard");
      }
    } catch (error) {
      console.error("Error clearing whiteboard:", error);
      toast.error(error.message);
    }
  };

  const saveWhiteboardData = async () => {
    if (savingWhiteboard) return;

    setSavingWhiteboard(true);
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL();

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/whiteboard`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_data: {
              image_data: imageData,
              last_modified: new Date().toISOString(),
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save whiteboard");
      }
    } catch (error) {
      console.error("Error saving whiteboard:", error);
    } finally {
      setSavingWhiteboard(false);
    }
  };

  const loadWhiteboardData = (sessionData) => {
    if (!sessionData?.image_data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    img.src = sessionData.image_data;
  };

  // Document sharing functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        await shareDocumentInRoom(data.document.id);
        setSelectedFile(null);
        toast.success("Document uploaded and shared successfully");
      } else {
        throw new Error("Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(error.message);
    } finally {
      setUploadingDocument(false);
    }
  };

  const shareDocumentInRoom = async (documentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/documents/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            document_id: documentId,
            permissions: "read",
          }),
        }
      );

      if (response.ok) {
        fetchDocuments();
      } else {
        throw new Error("Failed to share document in room");
      }
    } catch (error) {
      console.error("Error sharing document:", error);
      throw error;
    }
  };

  const handleKickMember = async (memberId) => {
    setMemberAction((prev) => ({ ...prev, [memberId]: true }));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/kick/${memberId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Member kicked successfully");
        fetchMembers();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to kick member");
      }
    } catch (error) {
      console.error("Error kicking member:", error);
      toast.error(error.message);
    } finally {
      setMemberAction((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
    }
  }, [currentColor, brushSize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading study room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate("/study-rooms")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Study Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = room?.owner_id === user?.id;
  const isModerator =
    members.find((m) => m.id === user?.id)?.role === "moderator";
  const canManageMembers = isOwner || isModerator;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-blue-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/study-rooms")}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {room?.name}
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  {room?.subject && (
                    <Badge className="bg-blue-100 text-blue-700">
                      {room.subject}
                    </Badge>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{members.length} members</span>
                  </div>
                  {isOwner && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Crown className="h-3 w-3 mr-1" />
                      Owner
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowMemberDialog(true)}
                className="border-blue-200 hover:bg-blue-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Members ({members.length})
              </Button>

              <Button
                variant="outline"
                onClick={handleLeaveRoom}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Leave Room
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="whiteboard">Whiteboard</TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* Whiteboard Tab */}
          <TabsContent value="whiteboard" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Collaborative Whiteboard</CardTitle>
                  <div className="flex items-center space-x-2">
                    {savingWhiteboard && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Saving...
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearWhiteboard}
                      disabled={!canManageMembers}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Whiteboard Tools */}
                <div className="flex items-center space-x-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={currentTool === "pen" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentTool("pen")}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={currentTool === "eraser" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentTool("eraser")}
                    >
                      <Eraser className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Color:</label>
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => setCurrentColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Size:</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">{brushSize}px</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-auto bg-white cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Shared Documents</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                      className="hidden"
                      id="document-upload"
                    />
                    <label htmlFor="document-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                    {selectedFile && (
                      <Button
                        size="sm"
                        onClick={handleDocumentUpload}
                        disabled={uploadingDocument}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {uploadingDocument ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {selectedFile && (
                  <CardDescription>
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No documents shared
                    </h3>
                    <p className="text-gray-600">
                      Upload and share documents with room members
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {doc.original_filename}
                            </p>
                            <p className="text-sm text-gray-500">
                              Shared by {doc.shared_by.first_name}{" "}
                              {doc.shared_by.last_name} •{" "}
                              {new Date(doc.shared_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{doc.permissions}</Badge>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Room Chat</CardTitle>
                <CardDescription>
                  Communicate with other room members in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chat Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    Real-time chat functionality will be available in the next
                    update
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Members Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Room Members</DialogTitle>
            <DialogDescription>
              Manage members in this study room
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {member.first_name?.[0]}
                    {member.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          member.role === "owner" ? "default" : "secondary"
                        }
                      >
                        {member.role}
                      </Badge>
                      {member.is_online && (
                        <div className="flex items-center text-xs text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Online
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {canManageMembers &&
                  member.id !== user?.id &&
                  member.role !== "owner" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleKickMember(member.id)}
                      disabled={memberAction[member.id]}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {memberAction[member.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowMemberDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyRoom;
