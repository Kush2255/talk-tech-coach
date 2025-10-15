import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const Interview = () => {
  const { type } = useParams<{ type: "behavioral" | "technical" }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      createSession(session.user.id);
    };
    checkUser();
  }, [navigate, type]);

  const createSession = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: userId,
          interview_type: type as "behavioral" | "technical",
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
      
      if (type === "behavioral") {
        generateQuestion();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateQuestion = async () => {
    if (type === "technical" && !selectedTopic) {
      toast({
        title: "Select a topic",
        description: "Please select a technical topic first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-question", {
        body: {
          type,
          topic: selectedTopic || null,
        },
      });

      if (error) throw error;
      setCurrentQuestion(data.question);
      setFeedback(null);
      setUserAnswer("");
    } catch (error: any) {
      toast({
        title: "Error generating question",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        
        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
        });

        if (error) throw error;
        setUserAnswer(data.text);
      };
    } catch (error: any) {
      toast({
        title: "Transcription failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !sessionId) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: {
          question: currentQuestion,
          answer: userAnswer,
          type,
          topic: selectedTopic || null,
        },
      });

      if (error) throw error;
      
      setFeedback(data.feedback);
      
      await supabase
        .from("interview_questions")
        .insert({
          session_id: sessionId,
          question: currentQuestion,
          user_answer: userAnswer,
          ai_feedback: data.feedback,
          score: data.score,
        });

      toast({
        title: "Answer evaluated!",
        description: `Score: ${data.score}%`,
      });
    } catch (error: any) {
      toast({
        title: "Evaluation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const endSession = async () => {
    if (sessionId) {
      await supabase
        .from("interview_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId);
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={endSession}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold capitalize">{type} Interview</h1>
          <Button variant="destructive" onClick={endSession}>
            End Session
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {type === "technical" && !currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select a Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a technical topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="dbms">Database Management Systems</SelectItem>
                  <SelectItem value="os">Operating Systems</SelectItem>
                  <SelectItem value="dsa">Data Structures & Algorithms</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                className="w-full mt-4" 
                onClick={generateQuestion}
                disabled={!selectedTopic || isProcessing}
                variant="gradient"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Question"}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentQuestion && (
          <>
            <Card className="mb-6 bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{currentQuestion}</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Answer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer or use voice input..."
                  className="min-h-[150px]"
                  disabled={isRecording || isProcessing}
                />
                <div className="flex gap-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      variant="outline"
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="flex-1"
                    >
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                  <Button
                    onClick={submitAnswer}
                    disabled={!userAnswer.trim() || isProcessing}
                    variant="gradient"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Answer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {feedback && (
              <Card className="mb-6 border-accent/30">
                <CardHeader>
                  <CardTitle className="text-lg text-accent">AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{feedback}</p>
                  <Button
                    onClick={generateQuestion}
                    className="mt-4"
                    variant="gradient"
                    disabled={isProcessing}
                  >
                    Next Question
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Interview;
