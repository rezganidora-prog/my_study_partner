-- ==========================================
-- CONFIGURATION SUPABASE POUR STUDY PARTNER
-- ==========================================

-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name text,
    username text UNIQUE,
    avatar_url text,
    goals text,
    subjects text,
    streak integer DEFAULT 0,
    study_hours integer DEFAULT 0,
    xp integer DEFAULT 0,
    level integer DEFAULT 1
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger : créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Table des cours (Bibliothèque)
CREATE TABLE IF NOT EXISTS public.courses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    subject text,
    file_url text,
    is_external boolean DEFAULT false,
    external_link text
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own courses" ON public.courses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courses" ON public.courses
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" ON public.courses
FOR DELETE USING (auth.uid() = user_id);

-- 3. Table des messages (chat en temps réel)
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id text NOT NULL,
    username text,
    content text,
    media_url text,
    media_type text
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages lisibles par tous" ON public.messages;
CREATE POLICY "Messages lisibles par tous"
ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent envoyer des messages" ON public.messages;
CREATE POLICY "Utilisateurs authentifiés peuvent envoyer des messages"
ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Activer le Realtime sur messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 5. Storage : bucket "chat-media"
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Chat media public read" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can upload chat media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

-- 6. Storage : bucket "study-docs"
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-docs', 'study-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "Users can only see their own documents" ON storage.objects
FOR SELECT USING (bucket_id = 'study-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'study-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 7. Storage : bucket "avatars"
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Avatars public read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 8. Table des tâches (Timeline / Planning)
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT timezone('utc'::text, now()),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    date date NOT NULL,
    duration integer DEFAULT 60,
    category text DEFAULT 'Mathématiques',
    completed boolean DEFAULT false
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their tasks" ON public.tasks;
CREATE POLICY "Users can manage their tasks"
ON public.tasks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. Storage : bucket "courses" (upload de PDF depuis Bibliothèque)
INSERT INTO storage.buckets (id, name, public)
VALUES ('courses', 'courses', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their courses" ON storage.objects;
CREATE POLICY "Users can upload their courses" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'courses' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view their courses" ON storage.objects;
CREATE POLICY "Users can view their courses" ON storage.objects
FOR SELECT USING (bucket_id = 'courses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their courses" ON storage.objects;
CREATE POLICY "Users can delete their courses" ON storage.objects
FOR DELETE USING (bucket_id = 'courses' AND (storage.foldername(name))[1] = auth.uid()::text);
