import React, { useState, useEffect } from "react";
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
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
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
  User,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Lock,
  BookOpen,
  Link,
  Download,
  Upload,
  Trash2,
  Plus,
  X,
  Crown,
  Zap,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSettings, setProfileSettings] = useState(null);
  const [lmsIntegrations, setLmsIntegrations] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  // Form states
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    bio: "",
    learning_goals: "",
    preferred_subjects: [],
    social_links: {},
    timezone: "UTC",
    language_preference: "en",
  });

  const [privacySettings, setPrivacySettings] = useState({
    is_public: false,
    show_email: false,
    show_study_stats: true,
    show_badges: true,
    show_streak: true,
    show_study_rooms: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    study_reminders: true,
    room_invites: true,
    achievement_alerts: true,
  });

  // LMS Integration state
  const [showLmsDialog, setShowLmsDialog] = useState(false);
  const [selectedLms, setSelectedLms] = useState("");
  const [lmsCredentials, setLmsCredentials] = useState({
    lms_username: "",
    server_url: "",
    api_key: "",
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update form data
        setFormData({
          first_name: data.user.first_name || "",
          last_name: data.user.last_name || "",
          username: data.user.username || "",
          email: data.user.email || "",
          bio: data.profile_settings.bio || "",
          learning_goals: data.profile_settings.learning_goals || "",
          preferred_subjects: data.profile_settings.preferred_subjects || [],
          social_links: data.profile_settings.social_links || {},
          timezone: data.profile_settings.timezone || "UTC",
          language_preference:
            data.profile_settings.language_preference || "en",
        });

        // Update privacy settings
        setPrivacySettings({
          is_public: data.profile_settings.is_public || false,
          show_email: data.profile_settings.show_email || false,
          show_study_stats: data.profile_settings.show_study_stats || true,
          show_badges: data.profile_settings.show_badges || true,
          show_streak: data.profile_settings.show_streak || true,
          show_study_rooms: data.profile_settings.show_study_rooms || true,
        });

        // Update notification settings
        setNotificationSettings(
          data.profile_settings.notification_preferences || {
            email_notifications: true,
            push_notifications: true,
            study_reminders: true,
            room_invites: true,
            achievement_alerts: true,
          }
        );

        setProfileSettings(data.profile_settings);
      } else {
        throw new Error("Failed to fetch profile data");
      }

      // Fetch LMS integrations
      await fetchLmsIntegrations();

      // Fetch user activity
      await fetchUserActivity();
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLmsIntegrations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/lms/integrations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLmsIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error("Error fetching LMS integrations:", error);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/activity?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserActivity(data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching user activity:", error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const updateData = {
        ...formData,
        ...privacySettings,
        notification_preferences: notificationSettings,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully!");
        // Update auth context if user data changed
        if (updateUser) {
          updateUser(data.user);
        }
        fetchProfileData();
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectLms = async () => {
    if (!selectedLms) {
      toast.error("Please select an LMS type");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/lms/connect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            lms_type: selectedLms,
            ...lmsCredentials,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("LMS integration created successfully!");
        setShowLmsDialog(false);
        setSelectedLms("");
        setLmsCredentials({ lms_username: "", server_url: "", api_key: "" });
        fetchLmsIntegrations();
      } else {
        throw new Error(data.error || "Failed to connect LMS");
      }
    } catch (error) {
      console.error("Error connecting LMS:", error);
      toast.error(error.message);
    }
  };

  const handleDisconnectLms = async (integrationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/profile/lms/${integrationId}/disconnect`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("LMS integration disconnected successfully!");
        fetchLmsIntegrations();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect LMS");
      }
    } catch (error) {
      console.error("Error disconnecting LMS:", error);
      toast.error(error.message);
    }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ format: "json" }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Create and download file
        const blob = new Blob([JSON.stringify(data.export_data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `studybuddy-profile-export-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Profile data exported successfully!");
      } else {
        throw new Error(data.error || "Failed to export data");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error(error.message);
    }
  };

  const addSubject = (subject) => {
    if (subject && !formData.preferred_subjects.includes(subject)) {
      setFormData((prev) => ({
        ...prev,
        preferred_subjects: [...prev.preferred_subjects, subject],
      }));
    }
  };

  const removeSubject = (subject) => {
    setFormData((prev) => ({
      ...prev,
      preferred_subjects: prev.preferred_subjects.filter((s) => s !== subject),
    }));
  };

  const supportedLms = [
    { id: "canvas", name: "Canvas LMS" },
    { id: "blackboard", name: "Blackboard Learn" },
    { id: "moodle", name: "Moodle" },
    { id: "google_classroom", name: "Google Classroom" },
    { id: "teams_education", name: "Microsoft Teams for Education" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your account settings, privacy preferences, and integrations
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learning_goals">Learning Goals</Label>
                  <Textarea
                    id="learning_goals"
                    placeholder="What are your learning objectives?"
                    value={formData.learning_goals}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        learning_goals: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preferred Subjects</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.preferred_subjects.map((subject, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {subject}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeSubject(subject)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a subject..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addSubject(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        const input =
                          e.target.parentElement.querySelector("input");
                        addSubject(input.value);
                        input.value = "";
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, timezone: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">
                          Eastern Time
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time
                        </SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language_preference}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          language_preference: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your profile and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Public Profile</Label>
                    <p className="text-sm text-gray-500">
                      Make your profile visible to other users
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.is_public}
                    onCheckedChange={(checked) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        is_public: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Email</Label>
                    <p className="text-sm text-gray-500">
                      Display your email address on your public profile
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_email}
                    onCheckedChange={(checked) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        show_email: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Study Statistics</Label>
                    <p className="text-sm text-gray-500">
                      Display your study time and progress
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_study_stats}
                    onCheckedChange={(checked) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        show_study_stats: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Badges</Label>
                    <p className="text-sm text-gray-500">
                      Display your achievements and badges
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_badges}
                    onCheckedChange={(checked) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        show_badges: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Study Streak</Label>
                    <p className="text-sm text-gray-500">
                      Display your current study streak
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_streak}
                    onCheckedChange={(checked) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        show_streak: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Study Rooms</Label>
                    <p className="text-sm text-gray-500">
                      Display the study rooms you've joined
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_study_rooms}
                    onCheckedChange={(checked) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        show_study_rooms: checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        email_notifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Study Reminders</Label>
                    <p className="text-sm text-gray-500">
                      Get reminded about your study sessions
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.study_reminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        study_reminders: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Room Invites</Label>
                    <p className="text-sm text-gray-500">
                      Notifications when invited to study rooms
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.room_invites}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        room_invites: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Achievement Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Notifications for badges and milestones
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.achievement_alerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        achievement_alerts: checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LMS Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Link className="h-5 w-5 mr-2" />
                      LMS Integrations
                    </CardTitle>
                    <CardDescription>
                      Connect your Learning Management Systems
                    </CardDescription>
                  </div>

                  <Dialog open={showLmsDialog} onOpenChange={setShowLmsDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Integration
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect LMS</DialogTitle>
                        <DialogDescription>
                          Connect your Learning Management System to sync
                          courses and assignments
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>LMS Type</Label>
                          <Select
                            value={selectedLms}
                            onValueChange={setSelectedLms}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select your LMS" />
                            </SelectTrigger>
                            <SelectContent>
                              {supportedLms.map((lms) => (
                                <SelectItem key={lms.id} value={lms.id}>
                                  {lms.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input
                            placeholder="Your LMS username"
                            value={lmsCredentials.lms_username}
                            onChange={(e) =>
                              setLmsCredentials((prev) => ({
                                ...prev,
                                lms_username: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {selectedLms === "moodle" && (
                          <div className="space-y-2">
                            <Label>Server URL</Label>
                            <Input
                              placeholder="https://your-moodle-site.com"
                              value={lmsCredentials.server_url}
                              onChange={(e) =>
                                setLmsCredentials((prev) => ({
                                  ...prev,
                                  server_url: e.target.value,
                                }))
                              }
                            />
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowLmsDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleConnectLms}>Connect</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {lmsIntegrations.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No LMS integrations
                    </h3>
                    <p className="text-gray-600">
                      Connect your Learning Management System to sync your
                      courses
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lmsIntegrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {supportedLms.find(
                                (lms) => lms.id === integration.lms_type
                              )?.name || integration.lms_type}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Connected as {integration.lms_username}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                variant={
                                  integration.sync_status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {integration.sync_status}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                Last sync:{" "}
                                {new Date(
                                  integration.last_sync
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectLms(integration.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>
                  Export your profile data and activity history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Download your data</p>
                    <p className="text-sm text-gray-500">
                      Export all your profile information, study history, and
                      settings
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent actions and account changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No recent activity
                    </h3>
                    <p className="text-gray-600">
                      Your account activity will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {activity.activity_type === "profile_update" && (
                            <Settings className="h-4 w-4 text-blue-600" />
                          )}
                          {activity.activity_type === "lms_connection" && (
                            <Link className="h-4 w-4 text-blue-600" />
                          )}
                          {activity.activity_type === "data_export" && (
                            <Download className="h-4 w-4 text-blue-600" />
                          )}
                          {![
                            "profile_update",
                            "lms_connection",
                            "data_export",
                          ].includes(activity.activity_type) && (
                            <User className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {activity.activity_type
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                          {activity.ip_address && (
                            <p className="text-xs text-gray-400">
                              From {activity.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
