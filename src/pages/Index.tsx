import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Brain, TrendingUp, CheckCircle, MessageSquare, Code } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "Behavioral Interview Practice",
      description: "Master HR-style questions like 'Tell me about yourself' with AI-powered feedback",
    },
    {
      icon: Code,
      title: "Technical Interview Prep",
      description: "Practice Java, DBMS, OS, and DSA questions with instant evaluation",
    },
    {
      icon: Mic,
      title: "Voice-Powered Practice",
      description: "Use speech-to-text for natural conversation flow and realistic practice",
    },
    {
      icon: Brain,
      title: "AI Feedback & Analysis",
      description: "Get detailed feedback on tone, clarity, technical correctness, and more",
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your improvement with detailed analytics and score tracking",
    },
    {
      icon: CheckCircle,
      title: "Personalized Tips",
      description: "Receive tailored suggestions to improve your interview performance",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-glow rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Ace Your Next Interview
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              Practice with AI-powered coaching for behavioral and technical interviews. 
              Get instant feedback, improve your skills, and land your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 bg-white/10 backdrop-blur-sm text-primary-foreground border-primary-foreground/30 hover:bg-white/20"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI Interview Coach combines cutting-edge technology with proven interview techniques
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-2 hover:border-primary/40 transition-all hover:shadow-card group"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Start practicing in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Interview Type</h3>
              <p className="text-muted-foreground">
                Select between behavioral or technical interviews based on what you want to practice
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Answer Questions</h3>
              <p className="text-muted-foreground">
                Respond using voice or text. Our AI listens and analyzes your answers in real-time
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Instant Feedback</h3>
              <p className="text-muted-foreground">
                Receive detailed feedback, scores, and personalized tips to improve your performance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Interview Skills?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of job seekers who have improved their interview performance with AI coaching
          </p>
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-12 bg-white text-primary hover:bg-white/90"
          >
            Start Practicing Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2025 AI Interview Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
