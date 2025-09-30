// lib/quiz-scoring.ts
import { QuestionType } from "@prisma/client";
import { MultipleChoiceDataType, PartialCreditRulesType, TextInputDataType, DropdownDataType, OrderingDataType } from "@/lib/schemas/quiz";

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
  selectedAnswers: string | string[] | Record<string, string>;
  correctAnswers: string | string[] | Record<string, string[]>;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  explanation?: string;
  details?: Array<{
    dropdownId: string;
    isCorrect: boolean;
    selectedOption: string;
    correctOptions: string[];
  }>;
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
 * Calculate score for a text input question
 */
function scoreTextInputQuestion(
  question: QuestionData,
  answer: string
): ScoreResult {
  const textInputData = question.answersData as TextInputDataType | undefined;

  if (!textInputData) {
    throw new Error(`Text input question ${question.id} missing configuration data`);
  }

  const { acceptableAnswers, caseSensitive } = textInputData;
  const userAnswer = answer.trim();

  if (!userAnswer) {
    return {
      questionId: question.id,
      selectedAnswers: answer,
      correctAnswers: acceptableAnswers,
      isCorrect: false,
      score: 0,
      maxScore: 1,
      explanation: "No answer provided"
    };
  }

  let isCorrect = false;

  // Check each acceptable answer with text comparison only
  for (const acceptableAnswer of acceptableAnswers) {
    const trimmedAcceptableAnswer = acceptableAnswer.trim();

    // Text comparison
    if (caseSensitive) {
      if (userAnswer === trimmedAcceptableAnswer) {
        isCorrect = true;
        break;
      }
    } else {
      if (userAnswer.toLowerCase() === trimmedAcceptableAnswer.toLowerCase()) {
        isCorrect = true;
        break;
      }
    }
  }

  return {
    questionId: question.id,
    selectedAnswers: answer,
    correctAnswers: acceptableAnswers,
    isCorrect,
    score: isCorrect ? 1 : 0,
    maxScore: 1,
    explanation: isCorrect ? "Answer matches acceptable response" : "Answer does not match any acceptable response"
  };
}

/**
 * Calculate score for a dropdown question
 */
function scoreDropdownQuestion(
  question: QuestionData,
  answer: Record<string, string>
): ScoreResult {
  const dropdownData = question.answersData as DropdownDataType | undefined;

  if (!dropdownData) {
    throw new Error(`Dropdown question ${question.id} missing configuration data`);
  }

  const { dropdowns, scoring } = dropdownData;
  const pointsPerDropdown = scoring?.pointsPerDropdown ?? 1;
  const requireAllCorrect = scoring?.requireAllCorrect ?? true;
  const penalizeIncorrect = scoring?.penalizeIncorrect ?? false;

  let correctCount = 0;
  const totalDropdowns = dropdowns.length;
  const maxScore = totalDropdowns * pointsPerDropdown;

  const results: Array<{
    dropdownId: string;
    isCorrect: boolean;
    selectedOption: string;
    correctOptions: string[];
  }> = [];

  // Check each dropdown
  for (const dropdown of dropdowns) {
    const selectedOptionId = answer[dropdown.id];
    const selectedOption = dropdown.options.find(opt => opt.id === selectedOptionId);
    const correctOptions = dropdown.options.filter(opt => opt.isCorrect);

    const isCorrect = selectedOption?.isCorrect === true;

    if (isCorrect) {
      correctCount++;
    }

    results.push({
      dropdownId: dropdown.id,
      isCorrect,
      selectedOption: selectedOption?.text || "No selection",
      correctOptions: correctOptions.map(opt => opt.text)
    });
  }

  // Calculate score based on scoring rules
  let score = 0;

  if (requireAllCorrect) {
    // All dropdowns must be correct to get any points
    score = correctCount === totalDropdowns ? maxScore : 0;
  } else {
    // Partial credit allowed
    score = correctCount * pointsPerDropdown;

    if (penalizeIncorrect) {
      const incorrectCount = totalDropdowns - correctCount;
      score = Math.max(0, score - (incorrectCount * pointsPerDropdown * 0.5));
    }
  }

  // Generate feedback
  const feedback = generateDropdownFeedback(results, correctCount, totalDropdowns);

  // Create correct answers mapping for result
  const correctAnswers: Record<string, string[]> = {};
  for (const dropdown of dropdowns) {
    correctAnswers[dropdown.id] = dropdown.options
      .filter(opt => opt.isCorrect)
      .map(opt => opt.text);
  }

  return {
    questionId: question.id,
    selectedAnswers: answer,
    correctAnswers,
    isCorrect: score === maxScore,
    score,
    maxScore,
    explanation: feedback,
    details: results
  };
}

function generateDropdownFeedback(
  results: Array<{dropdownId: string; isCorrect: boolean; selectedOption: string; correctOptions: string[]}>,
  correctCount: number,
  totalDropdowns: number
): string {
  if (correctCount === totalDropdowns) {
    return "Perfect! All selections are correct.";
  }

  if (correctCount === 0) {
    return "None of the selections are correct. Please review the content and try again.";
  }

  const incorrect = results.filter(r => !r.isCorrect);
  const incorrectDetails = incorrect.map(r =>
    `Expected: ${r.correctOptions.join(" or ")} (you selected: ${r.selectedOption})`
  ).join("; ");

  return `${correctCount}/${totalDropdowns} correct. Incorrect: ${incorrectDetails}`;
}

/**
 * Calculate score for an ordering question
 */
function scoreOrderingQuestion(
  question: QuestionData,
  answer: string[]
): ScoreResult {
  const orderingData = question.answersData as OrderingDataType | undefined;

  if (!orderingData) {
    throw new Error(`Ordering question ${question.id} missing configuration data`);
  }

  const { items, allowPartialCredit = false, exactOrderRequired = true } = orderingData;

  // Get correct order by sorting items by correctPosition
  const correctOrder = [...items]
    .sort((a, b) => a.correctPosition - b.correctPosition)
    .map(item => item.id);

  const userOrder = answer;
  const totalItems = items.length;
  const maxScore = totalItems;

  // Check if all items are present in the answer
  const userSet = new Set(userOrder);
  const correctSet = new Set(correctOrder);

  if (userOrder.length !== totalItems ||
      userSet.size !== totalItems ||
      ![...userSet].every(id => correctSet.has(id))) {
    return {
      questionId: question.id,
      selectedAnswers: answer,
      correctAnswers: correctOrder,
      isCorrect: false,
      score: 0,
      maxScore,
      explanation: "Not all items were arranged. Please place all items in order."
    };
  }

  // Check for exact order match
  const isExactMatch = JSON.stringify(userOrder) === JSON.stringify(correctOrder);

  if (exactOrderRequired && isExactMatch) {
    return {
      questionId: question.id,
      selectedAnswers: answer,
      correctAnswers: correctOrder,
      isCorrect: true,
      score: maxScore,
      maxScore,
      explanation: "Perfect! All items are in the correct order."
    };
  }

  if (exactOrderRequired && !allowPartialCredit) {
    return {
      questionId: question.id,
      selectedAnswers: answer,
      correctAnswers: correctOrder,
      isCorrect: false,
      score: 0,
      maxScore,
      explanation: generateOrderingFeedback(correctOrder, userOrder, items)
    };
  }

  // Partial credit calculation - simple proportional scoring
  let correctPositions = 0;

  // Count items in correct positions
  for (let i = 0; i < userOrder.length; i++) {
    if (userOrder[i] === correctOrder[i]) {
      correctPositions++;
    }
  }

  // Score is proportional to correct positions
  const score = (correctPositions / totalItems) * maxScore;
  const misplacements = totalItems - correctPositions;

  const feedback = generateOrderingFeedback(correctOrder, userOrder, items);

  return {
    questionId: question.id,
    selectedAnswers: answer,
    correctAnswers: correctOrder,
    isCorrect: score === maxScore,
    score,
    maxScore,
    explanation: feedback,
    details: [
      {
        dropdownId: "stats",
        isCorrect: score === maxScore,
        selectedOption: `${correctPositions} correct positions`,
        correctOptions: [`${totalItems} total items, ${misplacements} misplaced`]
      }
    ]
  };
}

/**
 * Generate basic feedback for ordering questions
 */
function generateOrderingFeedback(
  correctOrder: string[],
  userOrder: string[],
  items: OrderingDataType['items']
): string {
  const itemLookup = Object.fromEntries(items.map(item => [item.id, item]));

  const correctLabels = correctOrder.map(id => {
    const item = itemLookup[id];
    return getItemDisplayText(item);
  });

  const userLabels = userOrder.map(id => {
    const item = itemLookup[id];
    return getItemDisplayText(item);
  });

  return `Correct order: ${correctLabels.join(' → ')}. Your order: ${userLabels.join(' → ')}`;
}

/**
 * Generate detailed feedback for ordering questions with partial credit
 */
function generateDetailedOrderingFeedback(
  correctOrder: string[],
  userOrder: string[],
  items: OrderingDataType['items'],
  correctPositions: number,
  adjacentPairs: number
): string {
  const totalItems = items.length;

  if (correctPositions === totalItems) {
    return "Perfect! All items are in the correct order.";
  }

  if (correctPositions === 0) {
    return "None of the items are in the correct position. Please review the sequence.";
  }

  let feedback = `${correctPositions}/${totalItems} items in correct positions.`;

  if (adjacentPairs > 0) {
    feedback += ` ${adjacentPairs} correct adjacent relationships.`;
  }

  return feedback;
}

/**
 * Get display text for an ordering item
 */
function getItemDisplayText(item: OrderingDataType['items'][0]): string {
  const content = item.content;

  if (content.type === "text") {
    const text = content.text;
    return text.length > 30 ? text.substring(0, 30) + "..." : text;
  }

  if (content.type === "image") {
    return content.altText;
  }

  if (content.type === "mixed") {
    const parts = [];
    if (content.text) parts.push(content.text);
    if (content.suffix) parts.push(content.suffix);
    const combined = parts.join(" ");
    return combined.length > 30 ? combined.substring(0, 30) + "..." : combined;
  }

  return "Item";
}

/**
 * Score a single question based on its type
 */
export function scoreQuestion(
  question: QuestionData,
  answer: string | string[] | Record<string, string>
): ScoreResult {
  if (question.questionType === "SINGLE_CHOICE") {
    if (Array.isArray(answer) || typeof answer === "object") {
      throw new Error(`Single choice question ${question.id} received non-string answer`);
    }
    return scoreSingleChoiceQuestion(question, answer);
  }

  if (question.questionType === "MULTIPLE_CHOICE") {
    if (!Array.isArray(answer)) {
      throw new Error(`Multiple choice question ${question.id} received non-array answer`);
    }
    return scoreMultipleChoiceQuestion(question, answer);
  }

  if (question.questionType === "TEXT_INPUT") {
    if (Array.isArray(answer) || typeof answer === "object") {
      throw new Error(`Text input question ${question.id} received non-string answer`);
    }
    return scoreTextInputQuestion(question, answer);
  }

  if (question.questionType === "DROPDOWN") {
    if (typeof answer !== "object" || Array.isArray(answer)) {
      throw new Error(`Dropdown question ${question.id} received non-object answer`);
    }
    return scoreDropdownQuestion(question, answer);
  }

  if (question.questionType === "ORDERING") {
    if (!Array.isArray(answer)) {
      throw new Error(`Ordering question ${question.id} received non-array answer`);
    }
    return scoreOrderingQuestion(question, answer);
  }

  throw new Error(`Unsupported question type: ${question.questionType}`);
}

/**
 * Score an entire quiz submission
 */
export function scoreQuiz(
  questions: QuestionData[],
  answers: Record<string, string | string[] | Record<string, string>>
): QuizScoreResult {
  const questionResults: ScoreResult[] = [];
  let totalScore = 0;
  let maxTotalScore = 0;
  let correctQuestions = 0;

  for (const question of questions) {
    const answer = answers[question.id];

    if (answer === undefined) {
      // No answer provided - score as 0
      let correctAnswers: string | string[] | Record<string, string[]>;
      let maxScore = 1;

      if (question.questionType === "SINGLE_CHOICE") {
        correctAnswers = question.correctOptionId || "";
      } else if (question.questionType === "MULTIPLE_CHOICE") {
        correctAnswers = question.options.filter(opt => opt.correct).map(opt => opt.id);
      } else if (question.questionType === "TEXT_INPUT") {
        correctAnswers = (question.answersData as TextInputDataType)?.acceptableAnswers || [];
      } else if (question.questionType === "DROPDOWN") {
        const dropdownData = question.answersData as DropdownDataType | undefined;
        const dropdownCount = dropdownData?.dropdowns.length || 1;
        maxScore = dropdownCount;
        correctAnswers = {};
      } else if (question.questionType === "ORDERING") {
        const orderingData = question.answersData as OrderingDataType | undefined;
        const itemCount = orderingData?.items.length || 1;
        maxScore = itemCount;
        correctAnswers = orderingData?.items
          .sort((a, b) => a.correctPosition - b.correctPosition)
          .map(item => item.id) || [];
      } else {
        correctAnswers = [];
      }

      questionResults.push({
        questionId: question.id,
        selectedAnswers: Array.isArray(answer) ? [] : "",
        correctAnswers,
        isCorrect: false,
        score: 0,
        maxScore,
        explanation: "No answer provided"
      });
      maxTotalScore += maxScore;
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
        selectedAnswers: Array.isArray(answer)
          ? answer
          : typeof answer === 'object' && answer !== null
            ? [JSON.stringify(answer)]
            : [String(answer)],
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

/**
 * Validate text input question configuration
 */
export function validateTextInputConfig(
  textInputData?: TextInputDataType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!textInputData) {
    errors.push("Text input configuration is required");
    return { isValid: false, errors };
  }

  // Check acceptable answers
  if (!textInputData.acceptableAnswers || textInputData.acceptableAnswers.length === 0) {
    errors.push("At least one acceptable answer is required");
  } else {
    // Check for empty answers
    const emptyAnswers = textInputData.acceptableAnswers.filter(answer => !answer.trim());
    if (emptyAnswers.length > 0) {
      errors.push("Acceptable answers cannot be empty");
    }
  }

  // No additional validation needed for text-only input type

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate dropdown question configuration
 */
export function validateDropdownConfig(
  dropdownData?: DropdownDataType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!dropdownData) {
    errors.push("Dropdown configuration is required");
    return { isValid: false, errors };
  }

  // Check template
  if (!dropdownData.template || !dropdownData.template.trim()) {
    errors.push("Template text is required");
  }

  // Check dropdowns
  if (!dropdownData.dropdowns || dropdownData.dropdowns.length === 0) {
    errors.push("At least one dropdown is required");
  } else {
    // Validate each dropdown
    for (const dropdown of dropdownData.dropdowns) {
      if (!dropdown.id || !dropdown.id.trim()) {
        errors.push("Dropdown ID is required");
      }

      if (!dropdown.label || !dropdown.label.trim()) {
        errors.push(`Dropdown ${dropdown.id} must have a label`);
      }

      // Check options
      if (!dropdown.options || dropdown.options.length < 2) {
        errors.push(`Dropdown ${dropdown.id} must have at least 2 options`);
      } else {
        const correctOptions = dropdown.options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          errors.push(`Dropdown ${dropdown.id} must have at least one correct option`);
        }

        // Check each option
        for (const option of dropdown.options) {
          if (!option.id || !option.id.trim()) {
            errors.push(`All options in dropdown ${dropdown.id} must have an ID`);
          }
          if (!option.text || !option.text.trim()) {
            errors.push(`All options in dropdown ${dropdown.id} must have text`);
          }
        }
      }
    }

    // Validate template contains all dropdown placeholders
    const { template, dropdowns } = dropdownData;
    for (const dropdown of dropdowns) {
      const placeholder = `{${dropdown.id}}`;
      if (!template.includes(placeholder)) {
        errors.push(`Template missing placeholder: ${placeholder}`);
      }
    }

    // Check for orphaned placeholders
    const placeholderRegex = /\{([^}]+)\}/g;
    const templatePlaceholders = [...template.matchAll(placeholderRegex)].map(match => match[1]);
    const dropdownIds = dropdowns.map(d => d.id);
    const orphanedPlaceholders = templatePlaceholders.filter(p => !dropdownIds.includes(p));
    if (orphanedPlaceholders.length > 0) {
      errors.push(`Orphaned placeholders: ${orphanedPlaceholders.join(', ')}`);
    }
  }

  // Validate scoring configuration
  if (dropdownData.scoring) {
    const { pointsPerDropdown, requireAllCorrect, penalizeIncorrect } = dropdownData.scoring;

    if (pointsPerDropdown !== undefined && pointsPerDropdown <= 0) {
      errors.push("Points per dropdown must be positive");
    }

    if (typeof requireAllCorrect !== "boolean") {
      errors.push("Require all correct must be a boolean");
    }

    if (typeof penalizeIncorrect !== "boolean") {
      errors.push("Penalize incorrect must be a boolean");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate ordering question configuration
 */
export function validateOrderingConfig(
  orderingData?: OrderingDataType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!orderingData) {
    errors.push("Ordering configuration is required");
    return { isValid: false, errors };
  }

  // Check instructions
  if (!orderingData.instructions || !orderingData.instructions.trim()) {
    errors.push("Instructions are required");
  }

  // Check items
  if (!orderingData.items || orderingData.items.length < 2) {
    errors.push("At least 2 items are required");
  } else {
    // Validate each item
    const itemIds = new Set<string>();
    const positions = new Set<number>();

    for (const item of orderingData.items) {
      // Check for duplicate IDs
      if (itemIds.has(item.id)) {
        errors.push(`Duplicate item ID: ${item.id}`);
      }
      itemIds.add(item.id);

      // Check for duplicate positions
      if (positions.has(item.correctPosition)) {
        errors.push(`Duplicate position: ${item.correctPosition}`);
      }
      positions.add(item.correctPosition);

      // Validate content based on type
      if (item.content.type === "text") {
        if (!item.content.text || !item.content.text.trim()) {
          errors.push(`Item ${item.id} must have text content`);
        }
      } else if (item.content.type === "image") {
        if (!item.content.imageUrl) {
          errors.push(`Item ${item.id} must have an image URL`);
        }
        if (!item.content.altText || !item.content.altText.trim()) {
          errors.push(`Item ${item.id} must have alt text for the image`);
        }
      } else if (item.content.type === "mixed") {
        // Mixed content must have at least text or image
        if ((!item.content.text || !item.content.text.trim()) &&
            !item.content.imageUrl) {
          errors.push(`Item ${item.id} must have either text or image content`);
        }
      }
    }

    // Validate position numbers are sequential starting from 1
    const sortedPositions = Array.from(positions).sort((a, b) => a - b);
    for (let i = 0; i < sortedPositions.length; i++) {
      if (sortedPositions[i] !== i + 1) {
        errors.push(`Position numbers must be sequential starting from 1. Found gap at position ${i + 1}`);
        break;
      }
    }
  }

  // Validate scoring configuration
  if (orderingData.allowPartialCredit !== undefined && typeof orderingData.allowPartialCredit !== "boolean") {
    errors.push("Allow partial credit must be a boolean");
  }

  if (orderingData.exactOrderRequired !== undefined && typeof orderingData.exactOrderRequired !== "boolean") {
    errors.push("Exact order required must be a boolean");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}