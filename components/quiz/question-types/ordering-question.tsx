"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getLocalizedContent } from "@/lib/language-utils";
import { SupportedLanguage } from "@/store/language-context";
import { GripVertical, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "@/components/image-with-fallback";
import type { OrderingItem, OrderingConfiguration } from "@/components/quiz-editor/quiz-editor-layout";

interface OrderingQuestionProps {
  questionId: string;
  questionData: OrderingConfiguration;
  selectedAnswer?: string[];
  onAnswerChange: (questionId: string, answer: string[]) => void;
  disabled?: boolean;
  showResults?: boolean;
  isCorrect?: boolean;
  feedback?: string | null;
  details?: {
    correctOrder: string[];
    userOrder: string[];
    correctPositions: number[];
    incorrectPositions: number[];
  };
  language?: SupportedLanguage;
  className?: string;
}

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      dragToReorder: "Drag items to arrange them in the correct order",
      itemsPlaced: "items ordered",
      correctPosition: "Correct position",
      incorrectPosition: "Incorrect position",
      perfectOrder: "Perfect! All items are in the correct order.",
      partiallyCorrect: "partially correct",
      allIncorrect: "The order is incorrect. Try again.",
    },
    sl: {
      dragToReorder: "Povlecite elemente, da jih razvrstite v pravilnem vrstnem redu",
      itemsPlaced: "elementov razvrščenih",
      correctPosition: "Pravilna pozicija",
      incorrectPosition: "Napačna pozicija",
      perfectOrder: "Popolno! Vsi elementi so v pravilnem vrstnem redu.",
      partiallyCorrect: "delno pravilno",
      allIncorrect: "Vrstni red je napačen. Poskusite znova.",
    },
    hr: {
      dragToReorder: "Povucite stavke kako biste ih poredali pravilnim redom",
      itemsPlaced: "stavki poredani",
      correctPosition: "Točna pozicija",
      incorrectPosition: "Netočna pozicija",
      perfectOrder: "Savršeno! Sve stavke su u točnom redu.",
      partiallyCorrect: "djelomično točno",
      allIncorrect: "Redoslijed je netočan. Pokušajte ponovo.",
    },
  };
  return translations[language];
};

// Fisher-Yates shuffle algorithm - ensures result is different from original order
function shuffleArray<T>(array: T[]): T[] {
  let shuffled = [...array];
  let attempts = 0;
  const maxAttempts = 10;

  // Keep shuffling until we get a different order (or max attempts reached)
  do {
    shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (
    attempts < maxAttempts &&
    shuffled.every((item, index) => item === array[index])
  );

  return shuffled;
}

export function OrderingQuestion({
  questionId,
  questionData,
  selectedAnswer = [],
  onAnswerChange,
  disabled = false,
  showResults = false,
  isCorrect = false,
  feedback,
  details,
  language = "en",
  className,
}: OrderingQuestionProps) {
  const t = getTranslations(language);

  // Sort items by their correct position
  const correctOrder = useMemo(() =>
    [...questionData.items].sort((a, b) => a.correctPosition - b.correctPosition),
    [questionData.items]
  );

  // Initialize with shuffled order if no answer exists
  const [orderedItems, setOrderedItems] = useState<OrderingItem[]>(() => {
    if (selectedAnswer && selectedAnswer.length > 0) {
      // Restore previous order from selectedAnswer
      return selectedAnswer
        .map(id => questionData.items.find(item => item.id === id))
        .filter((item): item is OrderingItem => item !== undefined);
    }
    // Shuffle items for new quiz
    return shuffleArray([...questionData.items]);
  });

  // Update ordered items when question changes or selectedAnswer changes
  useEffect(() => {
    if (selectedAnswer && selectedAnswer.length > 0) {
      const restoredOrder = selectedAnswer
        .map(id => questionData.items.find(item => item.id === id))
        .filter((item): item is OrderingItem => item !== undefined);

      // Only update if we successfully restored all items
      if (restoredOrder.length === questionData.items.length) {
        setOrderedItems(restoredOrder);
      } else {
        // If restoration fails (different question), shuffle new items
        setOrderedItems(shuffleArray([...questionData.items]));
      }
    } else {
      // No selected answer - shuffle items for this question
      setOrderedItems(shuffleArray([...questionData.items]));
    }
  }, [questionId, selectedAnswer, questionData.items]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || disabled) return;

    const items = Array.from(orderedItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedItems(items);
    onAnswerChange(questionId, items.map(item => item.id));
  };

  const getItemStatus = (itemId: string, index: number): "correct" | "incorrect" | "neutral" => {
    if (!showResults || !details) return "neutral";

    const correctPosition = correctOrder.findIndex(item => item.id === itemId);
    return correctPosition === index ? "correct" : "incorrect";
  };

  const renderItemContent = (item: OrderingItem) => {
    const { content } = item;

    // MIXED type: show image + text
    if (content.type === "mixed" && content.imageUrl) {
      const textContent = getLocalizedContent(content, "text", language);
      return (
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden border">
            <ImageWithFallback
              src={content.imageUrl}
              alt={textContent || "Ordering item"}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
          {textContent && <span className="flex-1 text-sm">{textContent}</span>}
        </div>
      );
    }

    // TEXT type: show text only
    const textContent = getLocalizedContent(content, "text", language);
    return <span className="text-sm">{textContent}</span>;
  };

  const progressCount = orderedItems.length;
  const totalCount = questionData.items.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Instructions */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{t.dragToReorder}</p>
        </div>
      </div>

      {/* Progress indicator */}
      {!showResults && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {progressCount} / {totalCount} {t.itemsPlaced}
          </span>
          <div className="flex gap-1">
            {orderedItems.map((_, index) => (
              <Badge
                key={index}
                variant="default"
                className="h-2 w-2 p-0 rounded-full"
              />
            ))}
          </div>
        </div>
      )}

      {/* Drag and drop list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={`ordering-items-${questionId}`}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "space-y-2 rounded-lg border-2 border-dashed p-4 transition-colors",
                snapshot.isDraggingOver && "border-primary bg-primary/5",
                !snapshot.isDraggingOver && "border-muted"
              )}
            >
              {orderedItems.map((item, index) => {
                const status = getItemStatus(item.id, index);

                return (
                  <Draggable
                    key={`${questionId}-${item.id}`}
                    draggableId={`${questionId}-${item.id}`}
                    index={index}
                    isDragDisabled={disabled}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={provided.draggableProps.style}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border bg-background p-4",
                          snapshot.isDragging && "shadow-lg ring-2 ring-primary scale-105",
                          !disabled && !showResults && "cursor-move hover:border-primary",
                          disabled && "opacity-60",
                          showResults && status === "correct" && "border-green-500 bg-green-50",
                          showResults && status === "incorrect" && "border-red-500 bg-red-50"
                        )}
                      >
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className={cn(
                            "flex-shrink-0",
                            disabled && "cursor-not-allowed"
                          )}
                        >
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>

                        {/* Position number */}
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          showResults && status === "correct" && "bg-green-600 text-white",
                          showResults && status === "incorrect" && "bg-red-600 text-white",
                          !showResults && "bg-primary text-primary-foreground"
                        )}>
                          {index + 1}
                        </div>

                        {/* Item content */}
                        <div className="flex-1 min-w-0">
                          {renderItemContent(item)}
                        </div>

                        {/* Result indicator */}
                        {showResults && (
                          <div className="flex-shrink-0">
                            {status === "correct" ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-xs font-medium hidden sm:inline">
                                  {t.correctPosition}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-5 w-5" />
                                <span className="text-xs font-medium hidden sm:inline">
                                  {t.incorrectPosition}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Results feedback */}
      {showResults && details && (
        <Alert variant={isCorrect ? "default" : "destructive"}>
          <div className="flex items-start gap-2">
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <AlertDescription>
                {isCorrect ? (
                  <span className="font-medium">{t.perfectOrder}</span>
                ) : (
                  <span>
                    {details.correctPositions.length > 0 ? (
                      <>
                        {details.correctPositions.length}/{totalCount} {t.partiallyCorrect}
                      </>
                    ) : (
                      t.allIncorrect
                    )}
                  </span>
                )}
              </AlertDescription>

              {feedback && (
                <AlertDescription className="text-sm mt-2 pt-2 border-t">
                  {feedback}
                </AlertDescription>
              )}
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}