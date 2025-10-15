-- Create enum types for interview types and technical topics
CREATE TYPE interview_type AS ENUM ('behavioral', 'technical');
CREATE TYPE technical_topic AS ENUM ('java', 'dbms', 'os', 'dsa');
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'cancelled');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type interview_type NOT NULL,
  technical_topic technical_topic,
  status session_status DEFAULT 'in_progress' NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback JSONB,
  transcript TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Enable RLS on interview_sessions
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Interview sessions policies
CREATE POLICY "Users can view own sessions"
  ON public.interview_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.interview_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.interview_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create interview_questions table
CREATE TABLE public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  user_answer TEXT,
  ai_feedback TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on interview_questions
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Interview questions policies
CREATE POLICY "Users can view own questions"
  ON public.interview_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = interview_questions.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own questions"
  ON public.interview_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = interview_questions.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own questions"
  ON public.interview_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = interview_questions.session_id
      AND user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();