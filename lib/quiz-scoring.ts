// lib/quiz-scoring.ts
import { QuestionType } from "@prisma/client";
import { MultipleChoiceDataType, PartialCreditRulesType } from "@/lib/schemas/quiz";

// Types for scoring
export interface QuestionData {
  id: string;
  questionType: QuestionType;
  answersData?: Record<string, unknown>; // JSON field containing multiple choice configuration
  options: Array<{
    id: string;
    correct: boolean;
  }>;
  correctOptionId?: string | null; // For backward compatibility with single choice
}

export interface ScoreResult {
  questionId: string;
  selectedAnswers: string | string[];
  correctAnswers: string | string[];
  isCorrect: boolean;
  score: number;
  maxScore: number;
  explanation?: string;
}

export interface QuizScoreResult {
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  correctQuestions: number;
  totalQuestions: number;
  questionResults: ScoreResult[];
}

/**
 * Calculate score for a single choice question
 */
function scoreSingleChoiceQuestion(
  question: QuestionData,
  selectedAnswer: string
): ScoreResult {
  const correctOptionId = question.correctOptionId;
  const isCorrect = selectedAnswer === correctOptionId;

  return {
    questionId: question.id,
    selectedAnswers: selectedAnswer,
    correctAnswers: correctOptionId || "",
    isCorrect,
    score: isCorrect ? 1 : 0,
    maxScore: 1,
  };
}

/**
 * Calculate score for a multiple choice question using ALL_OR_NOTHING method
 */
function scoreMultipleChoiceAllOrNothing(
  question: QuestionData,
  selectedAnswers: string[]
): ScoreResult {
  const correctOptions = question.options
    .filter(opt => opt.correct)
    .map(opt => opt.id);

  // Must select exactly all correct answers and no incorrect ones
  const selectedSet = new Set(selectedAnswers);
  const correctSet = new Set(correctOptions);

  const isCorrect =
    selectedSet.size === correctSet.size &&
    [...selectedSet].every(id => correctSet.has(id));

  return {
    questionId: question.id,
    selectedAnswers,
    correctAnswers: correctOptions,
    isCorrect,
    score: isCorrect ? 1 : 0,
    maxScore: 1,
    explanation: isCorrect
      ? "All correct answers selected"
      : "Must select all correct answers and no incorrect ones"
  };
}

/**
 * Calculate score for a multiple choice question using PARTIAL_CREDIT method
 */
function scoreMultipleChoicePartialCredit(
  question: QuestionData,
  selectedAnswers: string[],
  partialCreditRules: PartialCreditRulesType
): ScoreResult {
  const correctOptions = question.options
    .filter(opt => opt.correct)
    .map(opt => opt.id);

  const selectedSet = new Set(selectedAnswers);
  const correctSet = new Set(correctOptions);

  // Calculate points for correct selections
  const correctSelections = [...selectedSet].filter(id => correctSet.has(id));
  const correctPoints = correctSelections.length * partialCreditRules.correctSelectionPoints;

  // Calculate penalty for incorrect selections
  const incorrectSelections = [...selectedSet].filter(id => !correctSet.has(id));
  const penaltyPoints = incorrectSelections.length * partialCreditRules.incorrectSelectionPenalty;

  // Calculate raw score
  const rawScore = correctPoints + penaltyPoints;

  // Apply minimum score rule
  const score = Math.max(rawScore, partialCreditRules.minScore);

  // Maximum possible score is all correct selections
  const maxScore = correctOptions.length * partialCreditRules.correctSelectionPoints;

  // Check if answer is completely correct
  const isCorrect =
    selectedSet.size === correctSet.size &&
    [...selectedSet].every(id => correctSet.has(id));

  return {
    questionId: question.id,
    selectedAnswers,
    correctAnswers: correctOptions,
    isCorrect,
    score,
    maxScore,
    explanation: `${correctSelections.length} correct, ${incorrectSelections.length} incorrect`
  };
}

/**
 * Score a multiple choice question based on its configuration
 */
function scoreMultipleChoiceQuestion(
  question: QuestionData,
  selectedAnswers: string[]
): ScoreResult {
  const multipleChoiceData = question.answersData as MultipleChoiceDataType | undefined;

  if (!multipleChoiceData) {
    throw new Error(`Multiple choice question ${question.id} missing configuration data`);
  }

  if (multipleChoiceData.scoringMethod === "PARTIAL_CREDIT") {
    const partialCreditRules = multipleChoiceData.partialCreditRules || {
      correctSelectionPoints: 1,
      incorrectSelectionPenalty: 0,
      minScore: 0
    };

    return scoreMultipleChoicePartialCredit(
      question,
      selectedAnswers,
      partialCreditRules
    );
  } else {
    return scoreMultipleChoiceAllOrNothing(question, selectedAnswers);
  }
}

/**
 * Score a single question based on its type
 */
export function scoreQuestion(
  question: QuestionData,
  answer: string | string[]
): ScoreResult {
  if (question.questionType === "SINGLE_CHOICE") {
    if (Array.isArray(answer)) {
      throw new Error(`Single choice question ${question.id} received array answer`);
    }
    return scoreSingleChoiceQuestion(question, answer);
  }

  if (question.questionType === "MULTIPLE_CHOICE") {
    if (!Array.isArray(answer)) {
      throw new Error(`Multiple choice question ${question.id} received non-array answer`);
    }
    return scoreMultipleChoiceQuestion(question, answer);
  }

  throw new Error(`Unsupported question type: ${question.questionType}`);
}

/**
 * Score an entire quiz submission
 */
export function scoreQuiz(
  questions: QuestionData[],
  answers: Record<string, string | string[]>
): QuizScoreResult {
  const questionResults: ScoreResult[] = [];
  let totalScore = 0;
  let maxTotalScore = 0;
  let correctQuestions = 0;

  for (const question of questions) {
    const answer = answers[question.id];

    if (answer === undefined) {
      // No answer provided - score as 0
      questionResults.push({
        questionId: question.id,
        selectedAnswers: Array.isArray(answer) ? [] : "",
        correctAnswers: question.questionType === "SINGLE_CHOICE"
          ? (question.correctOptionId || "")
          : question.options.filter(opt => opt.correct).map(opt => opt.id),
        isCorrect: false,
        score: 0,
        maxScore: 1,
        explanation: "No answer provided"
      });
      maxTotalScore += 1;
      continue;
    }

    try {
      const result = scoreQuestion(question, answer);
      questionResults.push(result);
      totalScore += result.score;
      maxTotalScore += result.maxScore;

      if (result.isCorrect) {
        correctQuestions++;
      }
    } catch (error) {
      console.error(`Error scoring question ${question.id}:`, error);
      // Default to 0 score for errored questions
      questionResults.push({
        questionId: question.id,
        selectedAnswers: Array.isArray(answer) ? answer : [answer],
        correctAnswers: [],
        isCorrect: false,
        score: 0,
        maxScore: 1,
        explanation: "Error processing answer"
      });
      maxTotalScore += 1;
    }
  }

  const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

  return {
    totalScore,
    maxTotalScore,
    percentage,
    correctQuestions,
    totalQuestions: questions.length,
    questionResults
  };
}

/**
 * Validate multiple choice question configuration
 */
export function validateMultipleChoiceConfig(
  options: Array<{ correct: boolean }>,
  multipleChoiceData?: MultipleChoiceDataType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const correctOptions = options.filter(opt => opt.correct);

  if (correctOptions.length === 0) {
    errors.push("At least one option must be marked as correct");
  }

  if (multipleChoiceData) {
    if (multipleChoiceData.maxSelections &&
        multipleChoiceData.maxSelections > options.length) {
      errors.push("Maximum selections cannot exceed number of options");
    }

    if (multipleChoiceData.minSelections < 1) {
      errors.push("Minimum selections must be at least 1");
    }

    if (multipleChoiceData.maxSelections &&
        multipleChoiceData.minSelections > multipleChoiceData.maxSelections) {
      errors.push("Minimum selections cannot exceed maximum selections");
    }

    if (multipleChoiceData.scoringMethod === "PARTIAL_CREDIT" &&
        multipleChoiceData.partialCreditRules) {
      const rules = multipleChoiceData.partialCreditRules;

      if (rules.correctSelectionPoints < 0) {
        errors.push("Correct selection points must be non-negative");
      }

      if (rules.incorrectSelectionPenalty > 0) {
        errors.push("Incorrect selection penalty must be non-positive");
      }

      if (rules.minScore < 0) {
        errors.push("Minimum score must be non-negative");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}