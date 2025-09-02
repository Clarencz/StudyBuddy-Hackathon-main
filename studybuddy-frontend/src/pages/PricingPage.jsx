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
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Check,
  Crown,
  Zap,
  Shield,
  Users,
  BookOpen,
  BarChart3,
  Download,
  Sparkles,
  ArrowRight,
  Star,
  CreditCard,
  Loader2,
} from "lucide-react";

const PricingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    }
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payment/plans`
      );
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        throw new Error("Failed to fetch plans");
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setError("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payment/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    setSubscribing(true);
    setSelectedPlan(planId);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payment/create-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan_id: planId }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Redirect to IntaSend checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || "Failed to create payment");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      setError(error.message);
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const features = {
    free: [
      "Up to 3 study rooms",
      "Basic AI tutor",
      "5 document uploads",
      "Community support",
      "Basic analytics",
    ],
    premium: [
      "Unlimited study rooms",
      "Advanced AI tutor with GPT-4",
      "Unlimited document uploads",
      "Priority support",
      "Advanced analytics",
      "Custom branding for study rooms",
      "Export study data",
      "Offline access to documents",
      "Real-time whiteboard collaboration",
      "LMS integrations",
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-800/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Choose Your Learning Journey
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Unlock Your
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {" "}
                Potential
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Transform your learning experience with StudyBuddy's powerful
              collaboration tools, AI-powered tutoring, and seamless study
              management.
            </p>

            {subscriptionStatus?.is_active && (
              <Alert className="max-w-md mx-auto mb-8 border-green-200 bg-green-50">
                <Crown className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  You have an active Premium subscription until{" "}
                  {new Date(
                    subscriptionStatus.premium_expires
                  ).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="max-w-md mx-auto mb-8 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Free
              </CardTitle>
              <CardDescription className="text-gray-600">
                Perfect for getting started
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">KES 0</span>
                <span className="text-gray-600 ml-2">forever</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.free.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => navigate("/register")}
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plans */}
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                plan.plan_id === "premium_yearly"
                  ? "border-blue-500 bg-gradient-to-b from-blue-50 to-white shadow-lg scale-105"
                  : "border-blue-200 hover:border-blue-400"
              }`}
            >
              {plan.plan_id === "premium_yearly" && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    plan.plan_id === "premium_yearly"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700"
                      : "bg-blue-100"
                  }`}
                >
                  <Crown
                    className={`h-6 w-6 ${
                      plan.plan_id === "premium_yearly"
                        ? "text-white"
                        : "text-blue-600"
                    }`}
                  />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    KES {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{plan.duration_days === 365 ? "year" : "month"}
                  </span>
                  {plan.plan_id === "premium_yearly" && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Save 83% vs monthly
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full transition-all duration-300 ${
                    plan.plan_id === "premium_yearly"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  onClick={() => handleSubscribe(plan.plan_id)}
                  disabled={
                    subscribing ||
                    (subscriptionStatus?.is_active &&
                      plan.plan_id === "premium_yearly")
                  }
                >
                  {subscribing && selectedPlan === plan.plan_id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : subscriptionStatus?.is_active &&
                    plan.plan_id === "premium_yearly" ? (
                    "Current Plan"
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose StudyBuddy Premium?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlock advanced features designed to supercharge your learning
              journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: "AI-Powered Learning",
                description:
                  "Get personalized tutoring with advanced GPT-4 integration",
              },
              {
                icon: Users,
                title: "Unlimited Collaboration",
                description:
                  "Create unlimited study rooms with real-time whiteboard",
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description:
                  "Track your progress with detailed learning insights",
              },
              {
                icon: Shield,
                title: "Priority Support",
                description: "Get help when you need it with dedicated support",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "How does the payment process work?",
                answer:
                  "We use IntaSend for secure payment processing. You can pay using M-Pesa, bank transfer, or card payments. Your subscription activates immediately after successful payment.",
              },
              {
                question: "Can I cancel my subscription anytime?",
                answer:
                  "Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until your current billing period ends.",
              },
              {
                question: "What happens to my data if I cancel?",
                answer:
                  "Your study rooms, documents, and progress data remain accessible. You'll just lose access to premium features like advanced AI tutoring and unlimited rooms.",
              },
              {
                question: "Do you offer student discounts?",
                answer:
                  "Yes! Contact our support team with your student ID for special pricing options designed for students.",
              },
            ].map((faq, index) => (
              <Card key={index} className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already using StudyBuddy to
              achieve their academic goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => navigate("/register")}
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => navigate("/demo")}
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
