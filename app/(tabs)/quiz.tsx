import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
};

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    question: "Quelle est la durée classique d'une session de focus dans la méthode Pomodoro ?",
    options: ["15 minutes", "25 minutes", "45 minutes", "1 heure"],
    correct: 1,
  },
  {
    question: "Que signifie le mode 'Grande Pause' dans l'étude ?",
    options: ["Arrêter d'étudier pour la journée", "Une pause de 15-30 min après 4 sessions", "Dormir 2 heures", "Regarder un film"],
    correct: 1,
  },
  {
    question: "Quel outil est le plus efficace pour mémoriser sur le long terme ?",
    options: ["Lire son cours 10 fois", "L'auto-évaluation (Quiz)", "Surligner tout le texte", "Écouter de la musique"],
    correct: 1,
  },
];

export default function QuizScreen() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('question, options, correct_index')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(data.map(row => ({
          question: row.question,
          options: row.options as string[],
          correct: row.correct_index,
        })));
      } else {
        setQuestions(FALLBACK_QUESTIONS);
      }
    } catch {
      setQuestions(FALLBACK_QUESTIONS);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);

    if (index === questions[currentQuestion].correct) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
      } else {
        setShowResult(true);
      }
    }, 900);
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  if (loadingQuestions) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8BAF76" />
        <Text style={{ marginTop: 15, color: '#8B735B' }}>Chargement des questions...</Text>
      </View>
    );
  }

  if (!quizStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Défis de Magie 🏆</Text>
          <Text style={styles.subtitle}>Teste tes connaissances et progresse !</Text>
        </View>

        <View style={styles.introCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="ribbon-outline" size={40} color="#8BAF76" />
          </View>
          <Text style={styles.introTitle}>Prêt pour le défi ?</Text>
          <Text style={styles.introText}>
            {"Réponds aux questions pour valider tes sessions d'étude et gagner des points d'expérience."}
          </Text>

          <View style={styles.levelsRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{questions.length} questions</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: '#FDF6E3' }]}>
              <Text style={[styles.levelText, { color: '#C4A882' }]}>QCM</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={() => setQuizStarted(true)}>
            <Text style={styles.startBtnText}>Commencer le Quiz</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showResult) {
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{score === questions.length ? "✨🧙‍♂️" : "🌱"}</Text>
          <Text style={styles.resultTitle}>Défi Terminé !</Text>
          <Text style={styles.resultScore}>{score} / {questions.length}</Text>
          <Text style={styles.resultMsg}>
            {score === questions.length
              ? "Félicitations, tu es un véritable maître de l'étude !"
              : "Continue tes efforts, la connaissance fleurit avec le temps."}
          </Text>

          <TouchableOpacity style={styles.startBtn} onPress={resetQuiz}>
            <Text style={styles.startBtnText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const q = questions[currentQuestion];

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>Question {currentQuestion + 1} / {questions.length}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {q.options.map((option, idx) => {
          let btnStyle = styles.optionBtn;
          let letterStyle = styles.optionLetter;
          if (answered && idx === q.correct) {
            btnStyle = { ...styles.optionBtn, backgroundColor: '#E8F5E9', borderColor: '#8BAF76' };
            letterStyle = { ...styles.optionLetter, backgroundColor: '#8BAF76' };
          } else if (answered && idx === selectedAnswer && idx !== q.correct) {
            btnStyle = { ...styles.optionBtn, backgroundColor: '#FFEBEE', borderColor: '#D48C8C' };
            letterStyle = { ...styles.optionLetter, backgroundColor: '#D48C8C' };
          }
          return (
            <TouchableOpacity key={idx} style={btnStyle} onPress={() => handleAnswer(idx)} disabled={answered}>
              <View style={letterStyle}>
                <Text style={[styles.letterText, answered && (idx === q.correct || idx === selectedAnswer) && { color: '#fff' }]}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={styles.optionLabel}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4A3728', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 14, color: '#8BAF76', fontWeight: '600' },

  introCard: { backgroundColor: '#fff', borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  introTitle: { fontSize: 22, fontWeight: 'bold', color: '#4A3728', marginBottom: 10 },
  introText: { textAlign: 'center', color: '#8B735B', lineHeight: 22, marginBottom: 25 },
  levelsRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  levelBadge: { backgroundColor: '#8BAF76', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 12 },
  levelText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#8BAF76', height: 55, width: '100%', borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  progressHeader: { marginBottom: 30 },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#8B735B', marginBottom: 10 },
  progressBar: { height: 8, backgroundColor: '#E8D9C0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8BAF76' },

  questionCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: '#F0E6D2' },
  questionText: { fontSize: 18, fontWeight: 'bold', color: '#4A3728', lineHeight: 26 },

  optionsContainer: { gap: 12 },
  optionBtn: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FDF6E3', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  letterText: { fontWeight: 'bold', color: '#8BAF76' },
  optionLabel: { fontSize: 15, color: '#4A3728', flex: 1 },

  resultCard: { backgroundColor: '#fff', borderRadius: 30, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  resultEmoji: { fontSize: 60, marginBottom: 10 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#4A3728', marginBottom: 5 },
  resultScore: { fontSize: 40, fontWeight: 'bold', color: '#8BAF76', marginBottom: 15 },
  resultMsg: { textAlign: 'center', color: '#8B735B', lineHeight: 22, marginBottom: 30 },
});
