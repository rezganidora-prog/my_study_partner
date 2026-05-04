import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type Course = {
  id: string;
  title: string;
  subject: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

type Screen = 'select_course' | 'generating' | 'quiz' | 'result';

export default function QuizScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [screen, setScreen] = useState<Screen>('select_course');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('courses')
        .select('id, title, subject')
        .eq('user_id', user.id);
      if (data) setCourses(data);
    } catch {
      // silent
    } finally {
      setLoadingCourses(false);
    }
  };

  const generateQuiz = async (course: Course) => {
    setSelectedCourse(course);
    setScreen('generating');

    try {
      const prompt =
        `Génère 5 questions QCM en français sur ce cours : ${course.title} - ${course.subject}.\n` +
        `Retourne UNIQUEMENT un JSON valide, sans texte avant ou après, comme ceci :\n` +
        `[{ "question": "...", "options": ["A","B","C","D"], "correct_index": 0 }]`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:8081',
          'X-Title': 'Study Partner',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

      const data = await response.json();
      const rawText: string = data.choices?.[0]?.message?.content || '';

      // Strip potential markdown code blocks
      const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed: QuizQuestion[] = JSON.parse(jsonText);

      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Format invalide');

      setQuestions(parsed);
      setCurrentQuestion(0);
      setScore(0);
      setSelectedAnswer(null);
      setAnswered(false);
      setScreen('quiz');
    } catch {
      Alert.alert('Erreur', 'Impossible de générer les questions. Réessaie.');
      setScreen('select_course');
    }
  };

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);

    if (index === questions[currentQuestion].correct_index) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
      } else {
        setScreen('result');
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setScreen('select_course');
    setSelectedCourse(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  // ── Écran : sélection du cours ───────────────────────────────────────────
  if (screen === 'select_course') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Défis de Magie 🏆</Text>
          <Text style={styles.subtitle}>Choisis un cours pour générer ton quiz</Text>
        </View>

        {loadingCourses ? (
          <ActivityIndicator size="large" color="#8BAF76" style={{ marginTop: 50 }} />
        ) : courses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>Aucun cours trouvé</Text>
            <Text style={styles.emptyText}>
              Ajoute d'abord des cours dans ta bibliothèque pour générer un quiz.
            </Text>
          </View>
        ) : (
          <View style={styles.coursesList}>
            {courses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => generateQuiz(course)}
              >
                <View style={styles.courseIconBox}>
                  <Ionicons name="journal" size={24} color="#8BAF76" />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                  <Text style={styles.courseSubject}>{course.subject}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C4A882" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // ── Écran : génération en cours ──────────────────────────────────────────
  if (screen === 'generating') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8BAF76" />
        <Text style={styles.generatingTitle}>Génération du quiz... ✨</Text>
        <Text style={styles.generatingSubtitle}>L'IA prépare 5 questions sur</Text>
        <Text style={styles.generatingCourse}>"{selectedCourse?.title}"</Text>
      </View>
    );
  }

  // ── Écran : résultat ─────────────────────────────────────────────────────
  if (screen === 'result') {
    const perfect = score === questions.length;
    const good = score >= Math.ceil(questions.length / 2);
    return (
      <View style={[styles.container, styles.resultContainer]}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {perfect ? '✨🧙‍♂️' : good ? '🌱' : '📖'}
          </Text>
          <Text style={styles.resultTitle}>Défi Terminé !</Text>
          <Text style={styles.resultCourse}>{selectedCourse?.title}</Text>
          <Text style={styles.resultScore}>{score} / {questions.length}</Text>
          <Text style={styles.resultMsg}>
            {perfect
              ? 'Félicitations, tu maîtrises parfaitement ce cours !'
              : good
              ? 'Bon travail ! Continue à réviser pour progresser.'
              : 'La connaissance fleurit avec le temps. Révise et réessaie !'}
          </Text>

          <TouchableOpacity style={styles.retryBtn} onPress={() => generateQuiz(selectedCourse!)}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryBtnText}>Rejouer ce cours</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={resetQuiz}>
            <Text style={styles.backBtnText}>Choisir un autre cours</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Écran : question en cours ────────────────────────────────────────────
  const q = questions[currentQuestion];

  return (
    <View style={[styles.container, styles.quizContainer]}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressCourse} numberOfLines={1}>{selectedCourse?.title}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Question {currentQuestion + 1} / {questions.length}
          </Text>
          <View style={styles.scoreChip}>
            <Ionicons name="star" size={12} color="#C4A882" />
            <Text style={styles.scoreChipText}>{score} pts</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentQuestion / questions.length) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {q.options.map((option, idx) => {
          const isCorrect = idx === q.correct_index;
          const isSelected = idx === selectedAnswer;

          let bgColor = '#fff';
          let borderColor = '#F0E6D2';
          let letterBg = '#FDF6E3';
          let letterColor = '#8BAF76';

          if (answered) {
            if (isCorrect) {
              bgColor = '#E8F5E9';
              borderColor = '#8BAF76';
              letterBg = '#8BAF76';
              letterColor = '#fff';
            } else if (isSelected) {
              bgColor = '#FFEBEE';
              borderColor = '#D48C8C';
              letterBg = '#D48C8C';
              letterColor = '#fff';
            }
          }

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
              onPress={() => handleAnswer(idx)}
              disabled={answered}
              activeOpacity={0.7}
            >
              <View style={[styles.optionLetter, { backgroundColor: letterBg }]}>
                {answered && isCorrect ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : answered && isSelected && !isCorrect ? (
                  <Ionicons name="close" size={16} color="#fff" />
                ) : (
                  <Text style={[styles.letterText, { color: letterColor }]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                )}
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
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  quizContainer: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  resultContainer: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },

  header: { marginBottom: 30 },
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#4A3728',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: { fontSize: 14, color: '#8BAF76', fontWeight: '600', marginTop: 4 },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 35,
    alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3728', marginBottom: 10 },
  emptyText: { textAlign: 'center', color: '#8B735B', lineHeight: 22 },

  coursesList: { gap: 12 },
  courseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F0E6D2',
  },
  courseIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FDF6E3', justifyContent: 'center', alignItems: 'center',
  },
  courseTitle: { fontSize: 15, fontWeight: 'bold', color: '#4A3728' },
  courseSubject: { fontSize: 12, color: '#8BAF76', marginTop: 3 },

  generatingTitle: { fontSize: 20, fontWeight: 'bold', color: '#4A3728', marginTop: 25 },
  generatingSubtitle: { fontSize: 14, color: '#8B735B', marginTop: 10 },
  generatingCourse: {
    fontSize: 15, fontWeight: '600', color: '#8BAF76',
    marginTop: 6, textAlign: 'center', paddingHorizontal: 30,
  },

  progressHeader: { marginBottom: 20 },
  progressCourse: { fontSize: 12, fontWeight: '600', color: '#8BAF76', marginBottom: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#8B735B' },
  scoreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FDF6E3', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20,
  },
  scoreChipText: { fontSize: 12, color: '#C4A882', fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: '#E8D9C0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8BAF76' },

  questionCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 25,
    marginBottom: 20, borderWidth: 1, borderColor: '#F0E6D2',
  },
  questionText: { fontSize: 17, fontWeight: 'bold', color: '#4A3728', lineHeight: 26 },

  optionsContainer: { gap: 10 },
  optionBtn: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
  optionLetter: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  letterText: { fontWeight: 'bold', fontSize: 14 },
  optionLabel: { fontSize: 14, color: '#4A3728', flex: 1, lineHeight: 20 },

  resultCard: {
    backgroundColor: '#fff', borderRadius: 30, padding: 35,
    alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2',
  },
  resultEmoji: { fontSize: 60, marginBottom: 10 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#4A3728', marginBottom: 5 },
  resultCourse: { fontSize: 13, color: '#8BAF76', fontWeight: '600', marginBottom: 15 },
  resultScore: { fontSize: 48, fontWeight: 'bold', color: '#8BAF76', marginBottom: 10 },
  resultMsg: { textAlign: 'center', color: '#8B735B', lineHeight: 22, marginBottom: 30 },
  retryBtn: {
    backgroundColor: '#8BAF76', height: 52, width: '100%', borderRadius: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn: {
    height: 48, width: '100%', borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8D9C0',
  },
  backBtnText: { color: '#8B735B', fontSize: 15, fontWeight: '600' },
});
