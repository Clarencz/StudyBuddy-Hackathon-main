import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  Bot,
  Zap,
  Clock,
  Trophy,
  ArrowRight,
  BookOpen,
  Target,
  TrendingUp,
  CreditCard,
  Settings,
  RefreshCw,
  Calendar,
  Star,
  Activity,
  BarChart3,
} from "lucide-react";

const Dashboard = () => {
  const { user, apiCall } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudyTime: 0,
    roomsJoined: 0,
    documentsUploaded: 0,
    flashcardsCreated: 0,
    practiceTestsTaken: 0,
    aiConversations: 0,
    recentActivity: [],
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dynamic stats from backend
  const fetchDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      // Fetch all dashboard data in parallel
      const [
        userStatsRes,
        roomsRes,
        docsRes,
        flashcardsRes,
        practiceTestsRes,
        conversationsRes,
        subscriptionRes,
        activityRes,
      ] = await Promise.allSettled([
        apiCall("/api/users/stats", { method: "GET" }),
        apiCall("/api/rooms/user-rooms", { method: "GET" }),
        apiCall("/api/documents", { method: "GET" }),
        apiCall("/api/ai/flashcards", { method: "GET" }),
        apiCall("/api/ai/practice-tests", { method: "GET" }),
        apiCall("/api/ai/conversations", { method: "GET" }),
        apiCall("/api/payment/status", { method: "GET" }),
        apiCall("/api/users/activity", { method: "GET" }),
      ]);

      // Process results safely
      const userStats =
        userStatsRes.status === "fulfilled" ? userStatsRes.value : {};
      const rooms = roomsRes.status === "fulfilled" ? roomsRes.value : {};
      const docs = docsRes.status === "fulfilled" ? docsRes.value : {};
      const flashcards =
        flashcardsRes.status === "fulfilled" ? flashcardsRes.value : {};
      const practiceTests =
        practiceTestsRes.status === "fulfilled" ? practiceTestsRes.value : {};
      const conversations =
        conversationsRes.status === "fulfilled" ? conversationsRes.value : {};
      const subscription =
        subscriptionRes.status === "fulfilled" ? subscriptionRes.value : {};
      const activity =
        activityRes.status === "fulfilled" ? activityRes.value : {};

      setStats({
        totalStudyTime:
          userStats.total_study_time || user?.total_study_time || 0,
        roomsJoined:
          (rooms.owned_rooms?.length || 0) + (rooms.joined_rooms?.length || 0),
        documentsUploaded: docs.documents?.length || 0,
        flashcardsCreated: flashcards.flashcards?.length || 0,
        practiceTestsTaken: practiceTests.practice_tests?.length || 0,
        aiConversations: conversations.conversations?.length || 0,
        recentActivity: activity.activities || [],
      });

      setSubscriptionStatus(subscription);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: "Create Study Room",
      description: "Start a new collaborative study session",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      action: () => navigate("/study-rooms"),
      premium: false,
    },
    {
      title: "Upload Document",
      description: "Add PDFs and create flipbooks",
      icon: FileText,
      color: "from-green-500 to-emerald-500",
      action: () => navigate("/documents"),
      premium: false,
    },
    {
      title: "Ask AI Tutor",
      description: "Get instant help with your studies",
      icon: Bot,
      color: "from-purple-500 to-pink-500",
      action: () => navigate("/ai-tutor"),
      premium: false,
    },
    {
      title: "View Analytics",
      description: "Track your learning progress",
      icon: BarChart3,
      color: "from-orange-500 to-red-500",
      action: () => navigate("/analytics"),
      premium: true,
    },
  ];

  const achievements = [
    {
      name: "First Steps",
      description: "Created your first study room",
      earned: stats.roomsJoined >= 1,
      icon: Users,
    },
    {
      name: "Knowledge Seeker",
      description: "Uploaded 5 documents",
      earned: stats.documentsUploaded >= 5,
      icon: FileText,
    },
    {
      name: "Streak Master",
      description: "Maintain a 7-day study streak",
      earned: (user?.streak_count || 0) >= 7,
      icon: Zap,
    },
    {
      name: "Collaborator",
      description: "Join 10 study rooms",
      earned: stats.roomsJoined >= 10,
      icon: Users,
    },
    {
      name: "AI Enthusiast",
      description: "Generate 50 flashcards",
      earned: stats.flashcardsCreated >= 50,
      icon: Bot,
    },
    {
      name: "Test Master",
      description: "Complete 10 practice tests",
      earned: stats.practiceTestsTaken >= 10,
      icon: Target,
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {getGreeting()}, {user?.first_name || user?.username}! 👋
              </h1>
              <p className="text-blue-100 text-base md:text-lg mb-4 lg:mb-0">
                Ready to continue your learning journey?
              </p>
              {subscriptionStatus && (
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    className={`${
                      subscriptionStatus.is_active
                        ? "bg-yellow-500 text-yellow-900"
                        : "bg-gray-500 text-gray-100"
                    }`}
                  >
                    {subscriptionStatus.is_active ? "Premium" : "Free"}
                  </Badge>
                  {subscriptionStatus.is_active &&
                    subscriptionStatus.days_remaining > 0 && (
                      <span className="text-sm text-blue-100">
                        {subscriptionStatus.days_remaining} days remaining
                      </span>
                    )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <div className="text-center">
                <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
                  <Zap className="h-5 w-5 text-yellow-300" />
                  <span className="font-bold text-lg">
                    {user?.streak_count || 0}
                  </span>
                </div>
                <p className="text-sm text-blue-100 mt-1">Day Streak</p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Study Time"
          value={formatStudyTime(stats.totalStudyTime)}
          icon={Clock}
          color="blue"
        />
        <StatCard
          label="Study Rooms"
          value={stats.roomsJoined}
          icon={Users}
          color="green"
        />
        <StatCard
          label="Documents"
          value={stats.documentsUploaded}
          icon={FileText}
          color="purple"
        />
        <StatCard
          label="Flashcards"
          value={stats.flashcardsCreated}
          icon={BookOpen}
          color="orange"
        />
        <StatCard
          label="Practice Tests"
          value={stats.practiceTestsTaken}
          icon={Target}
          color="red"
        />
        <StatCard
          label="AI Chats"
          value={stats.aiConversations}
          icon={Bot}
          color="indigo"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Quick Actions</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const isPremiumRequired =
              action.premium && !subscriptionStatus?.is_active;

            return (
              <Card
                key={index}
                className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50 ${
                  isPremiumRequired ? "opacity-75" : ""
                }`}
                onClick={() => {
                  if (isPremiumRequired) {
                    navigate("/subscription");
                  } else {
                    action.action();
                  }
                }}
              >
                <CardContent className="p-4 md:p-6">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${action.color} mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base md:text-lg font-semibold group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    {action.premium && (
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {action.description}
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    {isPremiumRequired ? "Upgrade Required" : "Get Started"}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest study activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity
                  .slice(0, 5)
                  .map((activity, index) => (
                    <ActivityItem key={index} activity={activity} />
                  ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    No recent activity yet.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Start studying to see your activity here!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Trophy className="h-5 w-5 mr-2" />
              Achievements
            </CardTitle>
            <CardDescription>
              {achievements.filter((a) => a.earned).length} of{" "}
              {achievements.length} earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <AchievementItem key={index} achievement={achievement} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Target className="h-5 w-5 mr-2" />
            Weekly Study Goal
          </CardTitle>
          <CardDescription>
            Track your progress towards your weekly study target
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Study Time This Week</span>
              <span className="text-sm text-gray-500">
                {formatStudyTime(stats.totalStudyTime)} / 20h goal
              </span>
            </div>
            <Progress
              value={Math.min((stats.totalStudyTime / (20 * 60)) * 100, 100)}
              className="h-3"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {Math.max(0, 20 * 60 - stats.totalStudyTime) > 0
                  ? `${formatStudyTime(
                      Math.max(0, 20 * 60 - stats.totalStudyTime)
                    )} remaining`
                  : "Goal achieved! 🎉"}
              </span>
              <span>
                {Math.round((stats.totalStudyTime / (20 * 60)) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      {subscriptionStatus && !subscriptionStatus.is_active && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-yellow-800">
              <CreditCard className="h-5 w-5 mr-2" />
              Upgrade to Premium
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Unlock advanced features and unlimited access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <p className="text-sm text-yellow-800 mb-2">
                  Premium features include:
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Unlimited study rooms and documents</li>
                  <li>• Advanced AI tutor with GPT-4</li>
                  <li>• Detailed analytics and insights</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <Button
                onClick={() => navigate("/subscription")}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Subcomponents
const StatCard = ({ label, value, icon: Icon, color }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600">{label}</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
    </CardContent>
  </Card>
);

const ActivityItem = ({ activity }) => {
  const icons = {
    study: <Clock className="h-4 w-4" />,
    document: <FileText className="h-4 w-4" />,
    ai: <Bot className="h-4 w-4" />,
    room: <Users className="h-4 w-4" />,
    flashcard: <BookOpen className="h-4 w-4" />,
    test: <Target className="h-4 w-4" />,
  };

  const colors = {
    study: "bg-blue-100 text-blue-600",
    document: "bg-green-100 text-green-600",
    ai: "bg-purple-100 text-purple-600",
    room: "bg-orange-100 text-orange-600",
    flashcard: "bg-indigo-100 text-indigo-600",
    test: "bg-red-100 text-red-600",
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div
        className={`p-2 rounded-full ${colors[activity.type] || colors.study}`}
      >
        {icons[activity.type] || icons.study}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {activity.description}
        </p>
        <p className="text-xs text-gray-500">{activity.time}</p>
      </div>
    </div>
  );
};

const AchievementItem = ({ achievement }) => {
  const Icon = achievement.icon || Trophy;

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div
        className={`p-2 rounded-full ${
          achievement.earned
            ? "bg-yellow-100 text-yellow-600"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            achievement.earned ? "text-gray-900" : "text-gray-500"
          }`}
        >
          {achievement.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {achievement.description}
        </p>
      </div>
      {achievement.earned && (
        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Earned</Badge>
      )}
    </div>
  );
};

export default Dashboard;
