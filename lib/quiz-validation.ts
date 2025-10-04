import { Question } from "@/components/quiz-editor/quiz-editor-layout";

export interface ValidationResult {
  isComplete: boolean;
  status: "complete" | "partial" | "incomplete" | "error";
  errors: ValidationError[];
  missingFields: string[];
  completionPercentage: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a question and returns detailed validation results
 * This is the single source of truth for all question validation
 */
export function validateQuestion(question: Question): ValidationResult {
  const result: ValidationResult = {
    isComplete: false,
    status: "incomplete",
    errors: [],
    missingFields: [],
    completionPercentage: 0
  };

  let totalRequirements = 0;
  let metRequirements = 0;

  // Check question text
  totalRequirements++;
  if (!question.text || !question.text.trim()) {
    result.errors.push({
      field: "text",
      message: "Question text is required"
    });
    result.missingFields.push("Question text");
  } else {
    metRequirements++;
  }

  // Validate based on question type
  let validationResult: { totalRequirements: number; metRequirements: number };

  switch (question.questionType) {
    case "TEXT_INPUT":
      validationResult = validateTextInputQuestion(question, result, totalRequirements, metRequirements);
      totalRequirements = validationResult.totalRequirements;
      metRequirements = validationResult.metRequirements;
      break;

    case "DROPDOWN":
      validationResult = validateDropdownQuestion(question, result, totalRequirements, metRequirements);
      totalRequirements = validationResult.totalRequirements;
      metRequirements = validationResult.metRequirements;
      break;

    case "ORDERING":
      validationResult = validateOrderingQuestion(question, result, totalRequirements, metRequirements);
      totalRequirements = validationResult.totalRequirements;
      metRequirements = validationResult.metRequirements;
      break;

    case "MATCHING":
      validationResult = validateMatchingQuestion(question, result, totalRequirements, metRequirements);
      totalRequirements = validationResult.totalRequirements;
      metRequirements = validationResult.metRequirements;
      break;

    case "SINGLE_CHOICE":
      validationResult = validateSingleChoiceQuestion(question, result, totalRequirements, metRequirements);
      totalRequirements = validationResult.totalRequirements;
      metRequirements = validationResult.metRequirements;
      break;

    case "MULTIPLE_CHOICE":
      validationResult = validateMultipleChoiceQuestion(question, result, totalRequirements, metRequirements);
      totalRequirements = validationResult.totalRequirements;
      metRequirements = validationResult.metRequirements;
      break;

    default:
      // For other question types, validate as choice questions
      validationResult = validateChoiceQuestion(question, result, totalRequirements, metRequirements);
      totalRequirements = validationResult.totalRequirements;
      metRequirements = validationResult.metRequirements;
      break;
  }

  // Calculate completion percentage
  result.completionPercentage = totalRequirements > 0
    ? Math.round((metRequirements / totalRequirements) * 100)
    : 0;

  // Determine status based on errors and completion
  if (result.errors.length > 0) {
    result.status = "error";
    result.isComplete = false;
  } else if (result.completionPercentage === 100) {
    result.status = "complete";
    result.isComplete = true;
  } else if (result.completionPercentage > 0) {
    result.status = "partial";
    result.isComplete = false;
  } else {
    result.status = "incomplete";
    result.isComplete = false;
  }

  return result;
}

function validateTextInputQuestion(
  question: Question,
  result: ValidationResult,
  totalRequirements: number,
  metRequirements: number
): { totalRequirements: number; metRequirements: number } {
  totalRequirements += 2; // Configuration and answers

  if (!question.textInputData) {
    result.errors.push({
      field: "textInputData",
      message: "Text input configuration is required"
    });
    result.missingFields.push("Text input configuration");
    return { totalRequirements, metRequirements };
  }

  metRequirements++; // Has configuration

  const { acceptableAnswers } = question.textInputData;

  if (!acceptableAnswers || acceptableAnswers.length === 0) {
    result.errors.push({
      field: "textInputData.acceptableAnswers",
      message: "At least one acceptable answer is required"
    });
    result.missingFields.push("Acceptable answers");
  } else {
    // Check for empty answers
    const emptyAnswers = acceptableAnswers.filter(answer => !answer.trim());
    if (emptyAnswers.length > 0) {
      result.errors.push({
        field: "textInputData.acceptableAnswers",
        message: "Acceptable answers cannot be empty"
      });
    } else {
      metRequirements++; // Has valid answers
    }
  }

  return { totalRequirements, metRequirements };
}

function validateDropdownQuestion(
  question: Question,
  result: ValidationResult,
  totalRequirements: number,
  metRequirements: number
): { totalRequirements: number; metRequirements: number } {
  totalRequirements += 3; // Configuration, template, and dropdowns

  if (!question.dropdownData) {
    result.errors.push({
      field: "dropdownData",
      message: "Dropdown configuration is required"
    });
    result.missingFields.push("Dropdown configuration");
    return { totalRequirements, metRequirements };
  }

  metRequirements++; // Has configuration

  // Check template
  if (!question.dropdownData.template || !question.dropdownData.template.trim()) {
    result.errors.push({
      field: "dropdownData.template",
      message: "Template text is required"
    });
    result.missingFields.push("Template text");
  } else {
    metRequirements++; // Has template
  }

  // Check dropdowns
  if (!question.dropdownData.dropdowns || question.dropdownData.dropdowns.length === 0) {
    result.errors.push({
      field: "dropdownData.dropdowns",
      message: "At least one dropdown field is required"
    });
    result.missingFields.push("Dropdown fields");
  } else {
    let allDropdownsValid = true;

    question.dropdownData.dropdowns.forEach((dropdown, index) => {
      totalRequirements += 3; // Label, options, correct answer

      // Check label
      if (!dropdown.label || !dropdown.label.trim()) {
        result.errors.push({
          field: `dropdownData.dropdowns.${index}.label`,
          message: `Dropdown ${index + 1} label is required`
        });
        result.missingFields.push(`Dropdown ${index + 1} label`);
        allDropdownsValid = false;
      } else {
        metRequirements++;
      }

      // Check options
      if (!dropdown.options || dropdown.options.length < 2) {
        result.errors.push({
          field: `dropdownData.dropdowns.${index}.options`,
          message: `Dropdown ${index + 1} needs at least 2 options`
        });
        result.missingFields.push(`Dropdown ${index + 1} options`);
        allDropdownsValid = false;
      } else {
        // Check for empty option texts
        const emptyOptions = dropdown.options.filter(opt => !opt.text || !opt.text.trim());
        if (emptyOptions.length > 0) {
          result.errors.push({
            field: `dropdownData.dropdowns.${index}.options`,
            message: `Dropdown ${index + 1} has empty option texts`
          });
          allDropdownsValid = false;
        } else {
          metRequirements++;
        }

        // Check for at least one correct answer
        const hasCorrectAnswer = dropdown.options.some(opt => opt.isCorrect);
        if (!hasCorrectAnswer) {
          result.errors.push({
            field: `dropdownData.dropdowns.${index}.options`,
            message: `Dropdown ${index + 1} needs at least one correct answer`
          });
          result.missingFields.push(`Dropdown ${index + 1} correct answer`);
          allDropdownsValid = false;
        } else {
          metRequirements++;
        }
      }
    });

    if (allDropdownsValid) {
      metRequirements++; // All dropdowns valid
    }
  }

  return { totalRequirements, metRequirements };
}

function validateSingleChoiceQuestion(
  question: Question,
  result: ValidationResult,
  totalRequirements: number,
  metRequirements: number
): { totalRequirements: number; metRequirements: number } {
  // First validate as a regular choice question
  const choiceValidation = validateChoiceQuestion(question, result, totalRequirements, metRequirements);
  totalRequirements = choiceValidation.totalRequirements;
  metRequirements = choiceValidation.metRequirements;

  // Additional validation for single choice
  totalRequirements++;
  const correctOptions = question.options.filter(o => o.isCorrect);
  if (correctOptions.length !== 1) {
    result.errors.push({
      field: "options",
      message: "Exactly one option must be marked as correct for single choice questions"
    });
    result.missingFields.push("Correct answer selection");
  } else {
    metRequirements++;
  }

  return { totalRequirements, metRequirements };
}

function validateMultipleChoiceQuestion(
  question: Question,
  result: ValidationResult,
  totalRequirements: number,
  metRequirements: number
): { totalRequirements: number; metRequirements: number } {
  // First validate as a regular choice question
  const choiceValidation = validateChoiceQuestion(question, result, totalRequirements, metRequirements);
  totalRequirements = choiceValidation.totalRequirements;
  metRequirements = choiceValidation.metRequirements;

  // Additional validation for multiple choice
  totalRequirements++;
  const correctOptions = question.options.filter(o => o.isCorrect);
  if (correctOptions.length === 0) {
    result.errors.push({
      field: "options",
      message: "At least one option must be marked as correct for multiple choice questions"
    });
    result.missingFields.push("Correct answer selections");
  } else {
    metRequirements++;
  }

  // Validate multiple choice configuration
  if (question.multipleChoiceData) {
    const { minSelections, maxSelections } = question.multipleChoiceData;

    if (minSelections < 1) {
      result.errors.push({
        field: "multipleChoiceData.minSelections",
        message: "Minimum selections must be at least 1"
      });
    }

    if (maxSelections && maxSelections > question.options.length) {
      result.errors.push({
        field: "multipleChoiceData.maxSelections",
        message: "Maximum selections cannot exceed number of options"
      });
    }

    if (maxSelections && minSelections > maxSelections) {
      result.errors.push({
        field: "multipleChoiceData.minSelections",
        message: "Minimum selections cannot exceed maximum selections"
      });
    }
  }

  return { totalRequirements, metRequirements };
}

function validateOrderingQuestion(
  question: Question,
  result: ValidationResult,
  totalRequirements: number,
  metRequirements: number
): { totalRequirements: number; metRequirements: number } {
  totalRequirements += 3; // Configuration, instructions, and items

  if (!question.orderingData) {
    result.errors.push({
      field: "orderingData",
      message: "Ordering configuration is required"
    });
    result.missingFields.push("Ordering configuration");
    return { totalRequirements, metRequirements };
  }

  metRequirements++; // Has configuration

  // Check instructions
  if (!question.orderingData.instructions || !question.orderingData.instructions.trim()) {
    result.errors.push({
      field: "orderingData.instructions",
      message: "Instructions are required"
    });
    result.missingFields.push("Instructions");
  } else {
    metRequirements++; // Has instructions
  }

  // Check items
  if (!question.orderingData.items || question.orderingData.items.length < 2) {
    result.errors.push({
      field: "orderingData.items",
      message: "At least 2 items are required"
    });
    result.missingFields.push("Ordering items");
  } else if (question.orderingData.items.length > 10) {
    result.errors.push({
      field: "orderingData.items",
      message: "Maximum 10 items allowed"
    });
  } else {
    let allItemsValid = true;

    question.orderingData.items.forEach((item, index) => {
      totalRequirements += 3; // ID, content, and correctPosition

      // Check item ID
      if (!item.id || !item.id.trim()) {
        result.errors.push({
          field: `orderingData.items.${index}.id`,
          message: `Item ${index + 1} ID is required`
        });
        result.missingFields.push(`Item ${index + 1} ID`);
        allItemsValid = false;
      } else {
        metRequirements++;
      }

      // Check content type and nested content
      if (!item.content || !item.content.type) {
        result.errors.push({
          field: `orderingData.items.${index}.content.type`,
          message: `Item ${index + 1} content type is required`
        });
        result.missingFields.push(`Item ${index + 1} content type`);
        allItemsValid = false;
      } else {
        if (item.content.type === "text") {
          if (!item.content.text || !item.content.text.trim()) {
            result.errors.push({
              field: `orderingData.items.${index}.content.text`,
              message: `Item ${index + 1} text is required`
            });
            allItemsValid = false;
          } else {
            metRequirements++;
          }
        } else if (item.content.type === "image") {
          if (!item.content.imageUrl || !item.content.imageUrl.trim()) {
            result.errors.push({
              field: `orderingData.items.${index}.content.imageUrl`,
              message: `Item ${index + 1} image URL is required`
            });
            allItemsValid = false;
          } else if (!item.content.altText || !item.content.altText.trim()) {
            result.errors.push({
              field: `orderingData.items.${index}.content.altText`,
              message: `Item ${index + 1} alt text is required for images`
            });
            allItemsValid = false;
          } else {
            metRequirements++;
          }
        } else if (item.content.type === "mixed") {
          // At least one of text or imageUrl must be present
          if ((!item.content.text || !item.content.text.trim()) && (!item.content.imageUrl || !item.content.imageUrl.trim())) {
            result.errors.push({
              field: `orderingData.items.${index}.content`,
              message: `Item ${index + 1} must have text or image`
            });
            allItemsValid = false;
          } else {
            metRequirements++;
          }
        } else {
          result.errors.push({
            field: `orderingData.items.${index}.content.type`,
            message: `Item ${index + 1} has invalid content type`
          });
          allItemsValid = false;
        }
      }

      // Check correctPosition
      if (typeof item.correctPosition !== "number" || item.correctPosition < 1) {
        result.errors.push({
          field: `orderingData.items.${index}.correctPosition`,
          message: `Item ${index + 1} must have a positive correctPosition`
        });
        result.missingFields.push(`Item ${index + 1} correctPosition`);
        allItemsValid = false;
      } else {
        metRequirements++;
      }
    });

    // Validate positions are sequential starting from 1
    const positions = question.orderingData.items
      .map(item => item.correctPosition)
      .sort((a, b) => a - b);

    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        result.errors.push({
          field: "orderingData.items",
          message: `Positions must be sequential starting from 1. Found gap at position ${i + 1}`
        });
        allItemsValid = false;
        break;
      }
    }

    if (allItemsValid) {
      metRequirements++; // All items valid
    }
  }

  return { totalRequirements, metRequirements };
}

function validateMatchingQuestion(
  question: Question,
  result: ValidationResult,
  totalRequirements: number,
  metRequirements: number
): { totalRequirements: number; metRequirements: number } {
  totalRequirements += 5; // Configuration, instructions, left items, right items, and matches

  if (!question.matchingData) {
    result.errors.push({
      field: "matchingData",
      message: "Matching configuration is required"
    });
    result.missingFields.push("Matching configuration");
    return { totalRequirements, metRequirements };
  }

  metRequirements++; // Has configuration

  // Check instructions
  if (!question.matchingData.instructions || !question.matchingData.instructions.trim()) {
    result.errors.push({
      field: "matchingData.instructions",
      message: "Instructions are required"
    });
    result.missingFields.push("Instructions");
  } else {
    metRequirements++; // Has instructions
  }

  // Check left items
  if (!question.matchingData.leftItems || question.matchingData.leftItems.length < 2) {
    result.errors.push({
      field: "matchingData.leftItems",
      message: "At least 2 left items are required"
    });
    result.missingFields.push("Left items");
  } else if (question.matchingData.leftItems.length > 8) {
    result.errors.push({
      field: "matchingData.leftItems",
      message: "Maximum 8 left items allowed"
    });
  } else {
    let allLeftItemsValid = true;

    question.matchingData.leftItems.forEach((item, index) => {
      totalRequirements += 3; // ID, position, and content

      // Check item ID
      if (!item.id || !item.id.trim()) {
        result.errors.push({
          field: `matchingData.leftItems.${index}.id`,
          message: `Left item ${index + 1} ID is required`
        });
        result.missingFields.push(`Left item ${index + 1} ID`);
        allLeftItemsValid = false;
      } else {
        metRequirements++;
      }

      // Check position
      if (typeof item.position !== "number" || item.position < 1) {
        result.errors.push({
          field: `matchingData.leftItems.${index}.position`,
          message: `Left item ${index + 1} must have a positive position`
        });
        result.missingFields.push(`Left item ${index + 1} position`);
        allLeftItemsValid = false;
      } else {
        metRequirements++;
      }

      // Check content (same validation as ordering items)
      if (!item.content || !item.content.type) {
        result.errors.push({
          field: `matchingData.leftItems.${index}.content.type`,
          message: `Left item ${index + 1} content type is required`
        });
        result.missingFields.push(`Left item ${index + 1} content type`);
        allLeftItemsValid = false;
      } else {
        if (item.content.type === "text") {
          if (!item.content.text || !item.content.text.trim()) {
            result.errors.push({
              field: `matchingData.leftItems.${index}.content.text`,
              message: `Left item ${index + 1} text is required`
            });
            allLeftItemsValid = false;
          } else {
            metRequirements++;
          }
        } else if (item.content.type === "image") {
          if (!item.content.imageUrl || !item.content.imageUrl.trim()) {
            result.errors.push({
              field: `matchingData.leftItems.${index}.content.imageUrl`,
              message: `Left item ${index + 1} image URL is required`
            });
            allLeftItemsValid = false;
          } else if (!item.content.altText || !item.content.altText.trim()) {
            result.errors.push({
              field: `matchingData.leftItems.${index}.content.altText`,
              message: `Left item ${index + 1} alt text is required for images`
            });
            allLeftItemsValid = false;
          } else {
            metRequirements++;
          }
        } else if (item.content.type === "mixed") {
          if ((!item.content.text || !item.content.text.trim()) && (!item.content.imageUrl || !item.content.imageUrl.trim())) {
            result.errors.push({
              field: `matchingData.leftItems.${index}.content`,
              message: `Left item ${index + 1} must have text or image`
            });
            allLeftItemsValid = false;
          } else {
            metRequirements++;
          }
        }
      }
    });

    if (allLeftItemsValid) {
      metRequirements++; // All left items valid
    }
  }

  // Check right items
  if (!question.matchingData.rightItems || question.matchingData.rightItems.length < 2) {
    result.errors.push({
      field: "matchingData.rightItems",
      message: "At least 2 right items are required"
    });
    result.missingFields.push("Right items");
  } else if (question.matchingData.rightItems.length > 10) {
    result.errors.push({
      field: "matchingData.rightItems",
      message: "Maximum 10 right items allowed"
    });
  } else {
    let allRightItemsValid = true;

    question.matchingData.rightItems.forEach((item, index) => {
      totalRequirements += 3; // ID, position, and content

      // Check item ID
      if (!item.id || !item.id.trim()) {
        result.errors.push({
          field: `matchingData.rightItems.${index}.id`,
          message: `Right item ${index + 1} ID is required`
        });
        result.missingFields.push(`Right item ${index + 1} ID`);
        allRightItemsValid = false;
      } else {
        metRequirements++;
      }

      // Check position
      if (typeof item.position !== "number" || item.position < 1) {
        result.errors.push({
          field: `matchingData.rightItems.${index}.position`,
          message: `Right item ${index + 1} must have a positive position`
        });
        result.missingFields.push(`Right item ${index + 1} position`);
        allRightItemsValid = false;
      } else {
        metRequirements++;
      }

      // Check content (same validation as ordering items)
      if (!item.content || !item.content.type) {
        result.errors.push({
          field: `matchingData.rightItems.${index}.content.type`,
          message: `Right item ${index + 1} content type is required`
        });
        result.missingFields.push(`Right item ${index + 1} content type`);
        allRightItemsValid = false;
      } else {
        if (item.content.type === "text") {
          if (!item.content.text || !item.content.text.trim()) {
            result.errors.push({
              field: `matchingData.rightItems.${index}.content.text`,
              message: `Right item ${index + 1} text is required`
            });
            allRightItemsValid = false;
          } else {
            metRequirements++;
          }
        } else if (item.content.type === "image") {
          if (!item.content.imageUrl || !item.content.imageUrl.trim()) {
            result.errors.push({
              field: `matchingData.rightItems.${index}.content.imageUrl`,
              message: `Right item ${index + 1} image URL is required`
            });
            allRightItemsValid = false;
          } else if (!item.content.altText || !item.content.altText.trim()) {
            result.errors.push({
              field: `matchingData.rightItems.${index}.content.altText`,
              message: `Right item ${index + 1} alt text is required for images`
            });
            allRightItemsValid = false;
          } else {
            metRequirements++;
          }
        } else if (item.content.type === "mixed") {
          if ((!item.content.text || !item.content.text.trim()) && (!item.content.imageUrl || !item.content.imageUrl.trim())) {
            result.errors.push({
              field: `matchingData.rightItems.${index}.content`,
              message: `Right item ${index + 1} must have text or image`
            });
            allRightItemsValid = false;
          } else {
            metRequirements++;
          }
        }
      }
    });

    if (allRightItemsValid) {
      metRequirements++; // All right items valid
    }
  }

  // Check correct matches
  if (!question.matchingData.correctMatches || question.matchingData.correctMatches.length < 1) {
    result.errors.push({
      field: "matchingData.correctMatches",
      message: "At least 1 correct match is required"
    });
    result.missingFields.push("Correct matches");
  } else {
    metRequirements++; // Has matches
  }

  // Validate position numbers are sequential for both columns (if items exist)
  if (question.matchingData.leftItems && question.matchingData.leftItems.length >= 2) {
    const leftPositions = question.matchingData.leftItems
      .map(item => item.position)
      .sort((a, b) => a - b);

    for (let i = 0; i < leftPositions.length; i++) {
      if (leftPositions[i] !== i + 1) {
        result.errors.push({
          field: "matchingData.leftItems",
          message: `Left item positions must be sequential starting from 1. Found gap at position ${i + 1}`
        });
        break;
      }
    }
  }

  if (question.matchingData.rightItems && question.matchingData.rightItems.length >= 2) {
    const rightPositions = question.matchingData.rightItems
      .map(item => item.position)
      .sort((a, b) => a - b);

    for (let i = 0; i < rightPositions.length; i++) {
      if (rightPositions[i] !== i + 1) {
        result.errors.push({
          field: "matchingData.rightItems",
          message: `Right item positions must be sequential starting from 1. Found gap at position ${i + 1}`
        });
        break;
      }
    }
  }

  return { totalRequirements, metRequirements };
}

function validateChoiceQuestion(
  question: Question,
  result: ValidationResult,
  totalRequirements: number,
  metRequirements: number
): { totalRequirements: number; metRequirements: number } {
  totalRequirements += 2; // Minimum options and option texts

  // Check minimum options
  if (question.options.length < 2) {
    result.errors.push({
      field: "options",
      message: "At least 2 options are required"
    });
    result.missingFields.push("Answer options");
  } else {
    metRequirements++;

    // Check for empty option texts
    let allOptionsValid = true;
    question.options.forEach((option, index) => {
      if (!option.text || !option.text.trim()) {
        result.errors.push({
          field: `options.${index}.text`,
          message: `Option ${index + 1} text is required`
        });
        result.missingFields.push(`Option ${index + 1} text`);
        allOptionsValid = false;
      }
    });

    if (allOptionsValid) {
      metRequirements++;
    }
  }

  return { totalRequirements, metRequirements };
}

/**
 * Get a simple completion status for UI indicators
 */
export function getQuestionCompletionStatus(
  question: Question,
  validationErrors?: ValidationError[]
): "complete" | "partial" | "incomplete" | "error" {
  // If validation errors are provided and exist, it's an error
  if (validationErrors && validationErrors.length > 0) {
    return "error";
  }

  // Otherwise, run validation to determine status
  const validation = validateQuestion(question);
  return validation.status;
}

/**
 * Check if a question is complete (no errors and all requirements met)
 */
export function isQuestionComplete(question: Question): boolean {
  const validation = validateQuestion(question);
  return validation.isComplete;
}

/**
 * Get a human-readable summary of what's missing from a question
 */
export function getQuestionValidationSummary(question: Question): string {
  const validation = validateQuestion(question);

  if (validation.isComplete) {
    return "Question is complete";
  }

  if (validation.errors.length > 0) {
    return `Has errors: ${validation.errors[0].message}`;
  }

  if (validation.missingFields.length > 0) {
    return `Missing: ${validation.missingFields.join(", ")}`;
  }

  return "Question is incomplete";
}