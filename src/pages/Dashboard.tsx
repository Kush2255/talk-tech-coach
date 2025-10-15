import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Brain, MessageSquare, LogOut, TrendingUp, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SessionStats {
  totalSessions: number;
  averageScore: number;
  behavioralSessions: number;
  technicalSessions: number;
  recentSessions: any[];
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    averageScore: 0,
    behavioralSessions: 0,
    technicalSessions: 0,
    recentSessions: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadStats(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async (userId: string) => {
    try {
      const { data: sessions, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (sessions) {
        const completedSessions = sessions.filter(s => s.score !== null);
        const avgScore = completedSessions.length > 0
          ? completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions.length
          : 0;

        setStats({
          totalSessions: sessions.length,
          averageScore: Math.round(avgScore),
          behavioralSessions: sessions.filter(s => s.interview_type === "behavioral").length,
          technicalSessions: sessions.filter(s => s.interview_type === "technical").length,
          recentSessions: sessions.slice(0, 5),
        });
      }
    } catch (error: any) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/");
  };

  const startInterview = (type: "behavioral" | "technical") => {
    navigate(`/interview/${type}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-primary-foreground text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Interview Coach
          </h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!</h2>
          <p className="text-muted-foreground">Ready to practice your interview skills?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-3xl">{stats.totalSessions}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {stats.averageScore}%
                <TrendingUp className="w-5 h-5 text-accent" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription>Behavioral</CardDescription>
              <CardTitle className="text-3xl">{stats.behavioralSessions}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription>Technical</CardDescription>
              <CardTitle className="text-3xl">{stats.technicalSessions}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Start Interview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
                onClick={() => startInterview("behavioral")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Behavioral Interview</CardTitle>
              <CardDescription>
                Practice HR and soft skills questions like "Tell me about yourself" and "Describe a challenge you faced"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="gradient" className="w-full">
                Start Behavioral Practice
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all cursor-pointer group"
                onClick={() => startInterview("technical")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle>Technical Interview</CardTitle>
              <CardDescription>
                Practice technical topics: Java, DBMS, Operating Systems, and Data Structures & Algorithms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="gradient" className="w-full">
                Start Technical Practice
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        {stats.recentSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">{session.interview_type}</span>
                        {session.technical_topic && (
                          <span className="text-sm text-muted-foreground">
                            ({session.technical_topic.toUpperCase()})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {session.score !== null && (
                      <div className="flex items-center gap-3">
                        <Progress value={session.score} className="w-24" />
                        <span className="text-lg font-semibold w-12 text-right">{session.score}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
