"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getLocalizedContent } from "@/lib/language-utils";
import { SupportedLanguage } from "@/store/language-context";
import { Trash2, RotateCcw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Types based on TICKET-007 spec
type MatchingTextContent = {
  type: "text";
  text: string;
  text_sl?: string;
  text_hr?: string;
};

type MatchingImageContent = {
  type: "image";
  imageUrl: string;
  altText: string;
  altText_sl?: string;
  altText_hr?: string;
};

type MatchingMixedContent = {
  type: "mixed";
  text?: string;
  text_sl?: string;
  text_hr?: string;
  imageUrl?: string;
  suffix?: string;
  suffix_sl?: string;
  suffix_hr?: string;
};

type MatchingItemContent = MatchingTextContent | MatchingImageContent | MatchingMixedContent;

interface MatchingItem {
  id: string;
  position: number;
  content: MatchingItemContent;
}

interface Connection {
  leftId: string;
  rightId: string;
}

interface MatchingQuestionData {
  instructions?: string;
  instructions_sl?: string;
  instructions_hr?: string;
  matchingType: "one-to-one";
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  display?: {
    connectionStyle?: "line" | "arrow" | "dashed";
    connectionColor?: string;
    correctColor?: string;
    incorrectColor?: string;
    showConnectionLabels?: boolean;
    animateConnections?: boolean;
  };
}

interface MatchingQuestionProps {
  questionId: string;
  questionData: MatchingQuestionData;
  language: SupportedLanguage;
  selectedAnswer?: Connection[];
  onAnswerChange: (questionId: string, connections: Connection[]) => void;
  disabled?: boolean;
  showResults?: boolean;
  results?: {
    correctConnections: number;
    incorrectConnections: number;
    missedConnections: number;
  };
  feedback?: string;
}

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      instructions: "Click an item on the left, then click an item on the right to create a connection",
      clearAll: "Clear All",
      connections: "connections",
      removeConnection: "Remove connection",
      perfectMatch: "Perfect! All connections are correct.",
      partiallyCorrect: "connections correct",
      allIncorrect: "No correct connections. Try again.",
      selectLeftFirst: "Select an item from the left column first",
      connectionNotAllowed: "This connection is not allowed based on matching rules",
    },
    sl: {
      instructions: "Kliknite element na levi, nato kliknite element na desni za ustvarjanje povezave",
      clearAll: "Počisti vse",
      connections: "povezave",
      removeConnection: "Odstrani povezavo",
      perfectMatch: "Popolno! Vse povezave so pravilne.",
      partiallyCorrect: "povezave pravilne",
      allIncorrect: "Nobena pravilna povezava. Poskusite znova.",
      selectLeftFirst: "Najprej izberite element iz levega stolpca",
      connectionNotAllowed: "Ta povezava ni dovoljena na podlagi pravil ujemanja",
    },
    hr: {
      instructions: "Kliknite stavku s lijeve strane, zatim kliknite stavku s desne strane za stvaranje veze",
      clearAll: "Obriši sve",
      connections: "veze",
      removeConnection: "Ukloni vezu",
      perfectMatch: "Savršeno! Sve veze su točne.",
      partiallyCorrect: "veze točne",
      allIncorrect: "Nema točnih veza. Pokušajte ponovo.",
      selectLeftFirst: "Prvo odaberite stavku iz lijevog stupca",
      connectionNotAllowed: "Ova veza nije dopuštena na temelju pravila podudaranja",
    },
  };
  return translations[language];
};

export function MatchingQuestion({
  questionId,
  questionData,
  language,
  selectedAnswer = [],
  onAnswerChange,
  disabled = false,
  showResults = false,
  results,
  feedback
}: MatchingQuestionProps) {
  const t = getTranslations(language);
  const [connections, setConnections] = useState<Connection[]>(selectedAnswer);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [hoveredRight, setHoveredRight] = useState<string | null>(null);
  const [itemPositions, setItemPositions] = useState<Map<string, DOMRect>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  // Update connections when selectedAnswer changes
  useEffect(() => {
    setConnections(selectedAnswer);
  }, [selectedAnswer]);

  // Update item positions on mount and resize
  const updatePositions = useCallback(() => {
    if (!leftColumnRef.current || !rightColumnRef.current || !containerRef.current) return;

    const newPositions = new Map<string, DOMRect>();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Get left items positions
    questionData.leftItems.forEach(item => {
      const element = document.getElementById(`left-${item.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        newPositions.set(`left-${item.id}`, rect);
      }
    });

    // Get right items positions
    questionData.rightItems.forEach(item => {
      const element = document.getElementById(`right-${item.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        newPositions.set(`right-${item.id}`, rect);
      }
    });

    setItemPositions(newPositions);
  }, [questionData.leftItems, questionData.rightItems]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  // Validate if connection is allowed (one-to-one: each item can only be connected once)
  const isConnectionAllowed = (leftId: string, rightId: string): boolean => {
    return !connections.some(c => c.leftId === leftId || c.rightId === rightId);
  };

  const handleLeftClick = (itemId: string) => {
    if (disabled) return;

    if (selectedLeft === itemId) {
      // Deselect if clicking the same item
      setSelectedLeft(null);
    } else {
      setSelectedLeft(itemId);
    }
  };

  const handleRightClick = (itemId: string) => {
    if (disabled || !selectedLeft) return;

    // Check if connection already exists
    const existingConnection = connections.find(
      c => c.leftId === selectedLeft && c.rightId === itemId
    );

    if (existingConnection) {
      // Remove existing connection
      const newConnections = connections.filter(c => c !== existingConnection);
      setConnections(newConnections);
      onAnswerChange(questionId, newConnections);
    } else {
      // Validate if connection is allowed
      if (!isConnectionAllowed(selectedLeft, itemId)) {
        // Show visual feedback that connection is not allowed
        return;
      }

      // Add new connection
      const newConnection: Connection = { leftId: selectedLeft, rightId: itemId };
      const newConnections = [...connections, newConnection];
      setConnections(newConnections);
      onAnswerChange(questionId, newConnections);
    }

    // Clear selection
    setSelectedLeft(null);
  };

  const handleRemoveConnection = (connection: Connection) => {
    if (disabled) return;
    const newConnections = connections.filter(c => c !== connection);
    setConnections(newConnections);
    onAnswerChange(questionId, newConnections);
  };

  const handleClearAll = () => {
    if (disabled) return;
    setConnections([]);
    onAnswerChange(questionId, []);
    setSelectedLeft(null);
  };

  // Get connection line color based on results
  const getConnectionColor = (connection: Connection): string => {
    const display = questionData.display || {};

    if (!showResults) {
      return display.connectionColor || "#3b82f6"; // blue-500
    }

    // In results mode, check if connection is correct
    // This is a simplified check - actual validation happens server-side
    return display.correctColor || "#22c55e"; // green-500
  };

  // Render connection lines
  const renderConnections = () => {
    if (!containerRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const display = questionData.display || {};

    return connections.map((connection, index) => {
      const leftRect = itemPositions.get(`left-${connection.leftId}`);
      const rightRect = itemPositions.get(`right-${connection.rightId}`);

      if (!leftRect || !rightRect) return null;

      // Calculate line coordinates
      const startX = leftRect.right - containerRect.left;
      const startY = leftRect.top + leftRect.height / 2 - containerRect.top;
      const endX = rightRect.left - containerRect.left;
      const endY = rightRect.top + rightRect.height / 2 - containerRect.top;

      const color = getConnectionColor(connection);
      const strokeDasharray = display.connectionStyle === "dashed" ? "5,5" : undefined;

      return (
        <g key={`${connection.leftId}-${connection.rightId}-${index}`}>
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={color}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
            className={cn(
              "transition-all duration-300",
              display.animateConnections && "animate-in fade-in"
            )}
          />
          {/* Connection dots */}
          <circle cx={startX} cy={startY} r={4} fill={color} />
          <circle cx={endX} cy={endY} r={4} fill={color} />
        </g>
      );
    });
  };

  const renderItemContent = (item: MatchingItem) => {
    const { content } = item;

    switch (content.type) {
      case "image":
        return content.imageUrl ? (
          <div className="relative w-full h-32 rounded-md overflow-hidden">
            <Image
              src={content.imageUrl}
              alt={getLocalizedContent(content, "altText", language) || "Matching item"}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        );

      case "mixed":
        const text = getLocalizedContent(content, "text", language);
        const suffix = getLocalizedContent(content, "suffix", language);

        return (
          <div className="flex flex-col gap-3">
            {content.imageUrl && (
              <div className="relative w-full h-32 rounded-md overflow-hidden">
                <Image
                  src={content.imageUrl}
                  alt={getLocalizedContent(content, "altText", language) || "Matching item"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {(text || suffix) && (
              <div className="text-sm">
                {text && <span>{text}</span>}
                {suffix && <span className="text-muted-foreground ml-1">{suffix}</span>}
              </div>
            )}
          </div>
        );

      case "text":
      default:
        const textContent = getLocalizedContent(content, "text", language);
        return <span className="text-sm">{textContent}</span>;
    }
  };

  const isLeftItemConnected = (itemId: string) => {
    return connections.some(c => c.leftId === itemId);
  };

  const isRightItemConnected = (itemId: string) => {
    return connections.some(c => c.rightId === itemId);
  };

  const instructions = getLocalizedContent(questionData, "instructions", language) || t.instructions;

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{instructions}</AlertDescription>
      </Alert>

      {/* Connection count and controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {connections.length} {t.connections}
        </div>
        {connections.length > 0 && !disabled && !showResults && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t.clearAll}
          </Button>
        )}
      </div>

      {/* Main matching interface */}
      <div ref={containerRef} className="relative">
        <div className="grid grid-cols-2 gap-8">
          {/* Left column */}
          <div ref={leftColumnRef} className="space-y-2">
            {questionData.leftItems
              .sort((a, b) => a.position - b.position)
              .map(item => (
                <Card
                  key={item.id}
                  id={`left-${item.id}`}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200",
                    !disabled && "hover:border-primary hover:shadow-md",
                    selectedLeft === item.id && "border-primary ring-2 ring-primary",
                    disabled && "opacity-60 cursor-not-allowed",
                    isLeftItemConnected(item.id) && "bg-blue-50 border-blue-200"
                  )}
                  onClick={() => handleLeftClick(item.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      {renderItemContent(item)}
                    </div>
                    {isLeftItemConnected(item.id) && (
                      <Badge variant="secondary" className="flex-shrink-0">
                        {connections.filter(c => c.leftId === item.id).length}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
          </div>

          {/* Right column */}
          <div ref={rightColumnRef} className="space-y-2">
            {questionData.rightItems
              .sort((a, b) => a.position - b.position)
              .map(item => (
                <Card
                  key={item.id}
                  id={`right-${item.id}`}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200",
                    !disabled && selectedLeft && "hover:border-primary hover:shadow-md",
                    !disabled && !selectedLeft && "opacity-50",
                    hoveredRight === item.id && selectedLeft && "border-primary ring-2 ring-primary",
                    disabled && "opacity-60 cursor-not-allowed",
                    isRightItemConnected(item.id) && "bg-blue-50 border-blue-200"
                  )}
                  onClick={() => handleRightClick(item.id)}
                  onMouseEnter={() => !disabled && selectedLeft && setHoveredRight(item.id)}
                  onMouseLeave={() => setHoveredRight(null)}
                >
                  <div className="flex items-start gap-2">
                    {isRightItemConnected(item.id) && (
                      <Badge variant="secondary" className="flex-shrink-0">
                        {connections.filter(c => c.rightId === item.id).length}
                      </Badge>
                    )}
                    <div className="flex-1">
                      {renderItemContent(item)}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>

        {/* SVG overlay for connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          {renderConnections()}
        </svg>
      </div>

      {/* Connection list with remove buttons */}
      {connections.length > 0 && !showResults && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Active Connections:</div>
          <div className="space-y-1">
            {connections.map((connection, index) => {
              const leftItem = questionData.leftItems.find(i => i.id === connection.leftId);
              const rightItem = questionData.rightItems.find(i => i.id === connection.rightId);

              if (!leftItem || !rightItem) return null;

              // Helper to get display text for connection
              const getConnectionText = (item: MatchingItem) => {
                const { content } = item;
                if (content.type === "text") {
                  return getLocalizedContent(content, "text", language);
                } else if (content.type === "image") {
                  return "[Image]";
                } else if (content.type === "mixed") {
                  const text = getLocalizedContent(content, "text", language);
                  return text || "[Image]";
                }
                return "";
              };

              return (
                <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                  <span className="flex-1 truncate">
                    {getConnectionText(leftItem)}
                    {' → '}
                    {getConnectionText(rightItem)}
                  </span>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveConnection(connection)}
                      className="gap-1 h-6 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results feedback */}
      {showResults && results && (
        <Alert variant={results.incorrectConnections === 0 ? "default" : "destructive"}>
          <div className="flex items-start gap-2">
            {results.incorrectConnections === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <AlertDescription>
                {results.incorrectConnections === 0 ? (
                  <span className="font-medium">{t.perfectMatch}</span>
                ) : (
                  <span>
                    {results.correctConnections > 0 ? (
                      <>
                        {results.correctConnections}/{connections.length} {t.partiallyCorrect}
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
