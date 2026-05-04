-- ==========================================
-- CONFIGURATION SUPABASE POUR STUDY PARTNER
-- ==========================================

-- 1. Création de la table des messages (pour le mode Social)
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id text NOT NULL,
    username text,
    content text, -- Optionnel si c'est une image/vidéo
    media_url text, -- Lien vers l'image ou la vidéo dans le Storage
    media_type text -- 'image' ou 'video'
);

-- 1.bis. Création du Bucket de Stockage (À faire dans l'interface Supabase)
-- Nom du bucket : "chat-media"
-- Politique : Autoriser l'accès public en lecture et l'upload pour les authentifiés.

-- 2. Activation de la Sécurité (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Politiques de Sécurité (Policies)
-- Autoriser tout le monde à lire les messages des salons
DROP POLICY IF EXISTS "Tout le monde peut lire les messages" ON public.messages;
CREATE POLICY "Tout le monde peut lire les messages" 
ON public.messages FOR SELECT 
USING (true);

-- Autoriser les utilisateurs authentifiés à envoyer des messages
DROP POLICY IF EXISTS "Tout le monde peut envoyer des messages" ON public.messages;
CREATE POLICY "Tout le monde peut envoyer des messages" 
ON public.messages FOR INSERT 
WITH CHECK (true);

-- 4. Publication en temps réel (Realtime)
-- Pour que les messages s'affichent instantanément sans rafraîchir
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
