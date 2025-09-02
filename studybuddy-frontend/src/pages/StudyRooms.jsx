import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  PlusCircle,
  Users,
  Lock,
  Globe,
  Crown,
  UserPlus,
  UserMinus,
  Calendar,
  Clock,
  BookOpen,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const StudyRooms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState({});
  const [leaving, setLeaving] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    max_participants: 10,
    is_private: false,
  });

  useEffect(() => {
    fetchRooms();
    fetchMyRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      } else {
        throw new Error("Failed to fetch rooms");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to load study rooms");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/my-rooms`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMyRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Error fetching my rooms:", error);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Study room created successfully!");
        setShowCreateDialog(false);
        setFormData({
          name: "",
          description: "",
          subject: "",
          max_participants: 10,
          is_private: false,
        });
        fetchRooms();
        fetchMyRooms();
      } else {
        throw new Error(data.error || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    setJoining((prev) => ({ ...prev, [roomId]: true }));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Successfully joined the room!");
        fetchRooms();
        fetchMyRooms();
      } else {
        throw new Error(data.error || "Failed to join room");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error(error.message);
    } finally {
      setJoining((prev) => ({ ...prev, [roomId]: false }));
    }
  };

  const handleLeaveRoom = async (roomId) => {
    setLeaving((prev) => ({ ...prev, [roomId]: true }));

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

      const data = await response.json();

      if (response.ok) {
        toast.success("Successfully left the room!");
        fetchRooms();
        fetchMyRooms();
      } else {
        throw new Error(data.error || "Failed to leave room");
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error(error.message);
    } finally {
      setLeaving((prev) => ({ ...prev, [roomId]: false }));
    }
  };

  const handleEnterRoom = (roomId) => {
    navigate(`/study-rooms/${roomId}`);
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.subject?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;
    if (filterType === "public") return matchesSearch && !room.is_private;
    if (filterType === "private") return matchesSearch && room.is_private;
    if (filterType === "joined") return matchesSearch && room.is_member;

    return matchesSearch;
  });

  const isRoomMember = (room) => {
    return myRooms.some((myRoom) => myRoom.id === room.id);
  };

  const getRoomRole = (room) => {
    const myRoom = myRooms.find((myRoom) => myRoom.id === room.id);
    return myRoom?.my_role || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading study rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Study Rooms
            </h1>
            <p className="text-gray-600">
              Join collaborative study sessions or create your own
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateRoom}>
                <DialogHeader>
                  <DialogTitle>Create Study Room</DialogTitle>
                  <DialogDescription>
                    Set up a new collaborative study space for you and your
                    peers.
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Room Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter room name"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      placeholder="e.g., Mathematics, Physics, History"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe what this room is for..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="max_participants">Max Participants</Label>
                    <Select
                      value={formData.max_participants.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          max_participants: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 25, 50].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} participants
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_private"
                      checked={formData.is_private}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_private: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="is_private" className="text-sm">
                      Make this room private
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Room"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search rooms by name, subject, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="public">Public Rooms</SelectItem>
              <SelectItem value="private">Private Rooms</SelectItem>
              <SelectItem value="joined">Joined Rooms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">
              All Rooms ({filteredRooms.length})
            </TabsTrigger>
            <TabsTrigger value="my-rooms">
              My Rooms ({myRooms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No study rooms found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Be the first to create a study room!"}
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="hover:shadow-lg transition-shadow duration-300 border-blue-200"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {room.name}
                          </CardTitle>
                          {room.subject && (
                            <Badge
                              variant="secondary"
                              className="mb-2 bg-blue-100 text-blue-700"
                            >
                              {room.subject}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {room.is_private ? (
                            <Lock className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Globe className="h-4 w-4 text-green-500" />
                          )}
                          {room.owner_id === user?.id && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>

                      {room.description && (
                        <CardDescription className="text-sm text-gray-600 line-clamp-2">
                          {room.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="pb-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>
                            {room.member_count || 0}/{room.max_participants}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {new Date(room.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {isRoomMember(room) && (
                        <div className="flex items-center mb-4">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-green-600 font-medium">
                            You are a {getRoomRole(room)}
                          </span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-0">
                      <div className="flex w-full gap-2">
                        {isRoomMember(room) ? (
                          <>
                            <Button
                              onClick={() => handleEnterRoom(room.id)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Enter Room
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleLeaveRoom(room.id)}
                              disabled={leaving[room.id]}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              {leaving[room.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserMinus className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleJoinRoom(room.id)}
                            disabled={
                              joining[room.id] ||
                              room.member_count >= room.max_participants
                            }
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {joining[room.id] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Joining...
                              </>
                            ) : room.member_count >= room.max_participants ? (
                              "Room Full"
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Join Room
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-rooms">
            {myRooms.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No rooms yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create or join study rooms to see them here
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Room
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="hover:shadow-lg transition-shadow duration-300 border-blue-200"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {room.name}
                          </CardTitle>
                          {room.subject && (
                            <Badge
                              variant="secondary"
                              className="mb-2 bg-blue-100 text-blue-700"
                            >
                              {room.subject}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {room.is_private ? (
                            <Lock className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Globe className="h-4 w-4 text-green-500" />
                          )}
                          <Badge
                            variant={
                              room.my_role === "owner" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {room.my_role}
                          </Badge>
                        </div>
                      </div>

                      {room.description && (
                        <CardDescription className="text-sm text-gray-600 line-clamp-2">
                          {room.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="pb-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>
                            {room.member_count || 0}/{room.max_participants}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {room.last_seen
                              ? `Active ${new Date(
                                  room.last_seen
                                ).toLocaleDateString()}`
                              : "Never active"}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0">
                      <div className="flex w-full gap-2">
                        <Button
                          onClick={() => handleEnterRoom(room.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Enter Room
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleLeaveRoom(room.id)}
                          disabled={leaving[room.id]}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {leaving[room.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudyRooms;
