"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Trash2, GripVertical, HelpCircle, Plus, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionImageUploader } from "@/components/quiz-editor/question-image-uploader";
import type {
  MatchingConfiguration,
  MatchingItem,
  MatchingItemContent,
  MatchingTextContent,
  MatchingImageContent,
  MatchingMixedContent,
  CorrectMatch
} from "./quiz-editor-layout";

type Language = "en" | "sl" | "hr";

interface Question {
  matchingData?: MatchingConfiguration;
}

interface MatchingConfigurationEditorProps {
  question: Question;
  language: Language;
  onChange: (field: string, value: MatchingConfiguration) => void;
}

export function MatchingConfigurationEditor({
  question,
  language,
  onChange
}: MatchingConfigurationEditorProps) {
  const matchingData: MatchingConfiguration = question.matchingData || {
    instructions: "Match the items on the left with the corresponding items on the right:",
    instructions_sl: "",
    instructions_hr: "",
    matchingType: "one-to-one",
    leftItems: [],
    rightItems: [],
    correctMatches: [],
    distractors: [],
    scoring: {
      pointsPerMatch: 1,
      penalizeIncorrect: false,
      penaltyPerIncorrect: 0,
      requireAllMatches: true,
      partialCredit: false,
    },
    display: {
      connectionStyle: "line",
      connectionColor: "#3b82f6",
      correctColor: "#10b981",
      incorrectColor: "#ef4444",
      showConnectionLabels: false,
      animateConnections: true,
    }
  };

  const [showMatchForm, setShowMatchForm] = useState(false);
  const [newMatch, setNewMatch] = useState<{leftId: string; rightId: string; explanation?: string}>({
    leftId: "",
    rightId: "",
    explanation: ""
  });

  const updateConfiguration = (updates: Partial<MatchingConfiguration>) => {
    const newConfiguration = { ...matchingData, ...updates };
    onChange("matchingData", newConfiguration);
  };

  // Add item to left or right column
  const addItem = (column: "left" | "right") => {
    const targetItems = column === "left" ? matchingData.leftItems : matchingData.rightItems;
    const newPosition = targetItems.length + 1;
    const newId = `${column}-item-${Date.now()}`;

    const content: MatchingTextContent = {
      type: "text",
      text: column === "left" ? `Left item ${newPosition}` : `Right item ${newPosition}`,
      text_sl: "",
      text_hr: "",
    };

    const newItem: MatchingItem = {
      id: newId,
      position: newPosition,
      content,
    };

    if (column === "left") {
      updateConfiguration({
        leftItems: [...matchingData.leftItems, newItem]
      });
    } else {
      updateConfiguration({
        rightItems: [...matchingData.rightItems, newItem]
      });
    }
  };

  // Remove item from left or right column
  const removeItem = (column: "left" | "right", index: number) => {
    const targetItems = column === "left" ? matchingData.leftItems : matchingData.rightItems;
    if (targetItems.length <= 2) return; // Minimum 2 items per column

    const itemToRemove = targetItems[index];
    const newItems = targetItems.filter((_, i) => i !== index);

    // Recalculate positions
    const reindexedItems = newItems.map((item, idx) => ({
      ...item,
      position: idx + 1
    }));

    // Remove any matches involving this item
    const newMatches = matchingData.correctMatches.filter(match =>
      column === "left" ? match.leftId !== itemToRemove.id : match.rightId !== itemToRemove.id
    );

    // Remove from distractors if applicable
    const newDistractors = matchingData.distractors?.filter(id => id !== itemToRemove.id) || [];

    if (column === "left") {
      updateConfiguration({
        leftItems: reindexedItems,
        correctMatches: newMatches
      });
    } else {
      updateConfiguration({
        rightItems: reindexedItems,
        correctMatches: newMatches,
        distractors: newDistractors
      });
    }
  };

  // Update item in left or right column
  const updateItem = (column: "left" | "right", index: number, updates: Partial<MatchingItem>) => {
    const targetItems = column === "left" ? matchingData.leftItems : matchingData.rightItems;
    const newItems = [...targetItems];
    newItems[index] = { ...newItems[index], ...updates };

    if (column === "left") {
      updateConfiguration({ leftItems: newItems });
    } else {
      updateConfiguration({ rightItems: newItems });
    }
  };

  // Handle drag and drop within columns
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Only handle reordering within same column
    if (source.droppableId !== destination.droppableId) return;

    const column = source.droppableId === "left-items" ? "left" : "right";
    const targetItems = column === "left" ? matchingData.leftItems : matchingData.rightItems;

    const sourceIndex = source.index;
    const destIndex = destination.index;

    if (sourceIndex === destIndex) return;

    const newItems = Array.from(targetItems);
    const [reorderedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(destIndex, 0, reorderedItem);

    // Update positions
    const reindexedItems = newItems.map((item, idx) => ({
      ...item,
      position: idx + 1
    }));

    if (column === "left") {
      updateConfiguration({ leftItems: reindexedItems });
    } else {
      updateConfiguration({ rightItems: reindexedItems });
    }
  };

  // Add a new match
  const addMatch = () => {
    if (!newMatch.leftId || !newMatch.rightId) return;

    // Validate one-to-one constraint: each item can only be matched once
    const existingMatches = matchingData.correctMatches;
    const leftUsed = existingMatches.some(m => m.leftId === newMatch.leftId);
    const rightUsed = existingMatches.some(m => m.rightId === newMatch.rightId);

    if (leftUsed || rightUsed) {
      alert("Each item can only be matched once.");
      return;
    }

    const match: CorrectMatch = {
      leftId: newMatch.leftId,
      rightId: newMatch.rightId,
      explanation: newMatch.explanation || undefined,
      explanation_sl: undefined,
      explanation_hr: undefined,
    };

    updateConfiguration({
      correctMatches: [...matchingData.correctMatches, match]
    });

    // Reset form
    setNewMatch({ leftId: "", rightId: "", explanation: "" });
    setShowMatchForm(false);
  };

  // Remove a match
  const removeMatch = (index: number) => {
    const newMatches = matchingData.correctMatches.filter((_, i) => i !== index);
    updateConfiguration({ correctMatches: newMatches });
  };

  // Toggle distractor
  const toggleDistractor = (itemId: string) => {
    const currentDistractors = matchingData.distractors || [];
    const isDistractor = currentDistractors.includes(itemId);

    const newDistractors = isDistractor
      ? currentDistractors.filter(id => id !== itemId)
      : [...currentDistractors, itemId];

    updateConfiguration({ distractors: newDistractors });
  };

  // Get item label for display
  const getItemLabel = (item: MatchingItem) => {
    return item.content.text || item.id;
  };

  // Validation warnings
  const warnings = [];
  if (matchingData.leftItems.length < 2) {
    warnings.push("Add at least 2 items to the left column");
  }
  if (matchingData.rightItems.length < 2) {
    warnings.push("Add at least 2 items to the right column");
  }
  if (matchingData.correctMatches.length === 0) {
    warnings.push("Define at least one correct match");
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instructions</CardTitle>
          <CardDescription>
            Provide instructions for students on how to complete the matching question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={language} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="sl">Slovenian</TabsTrigger>
              <TabsTrigger value="hr">Croatian</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-2">
              <Label>Instructions (EN)</Label>
              <Textarea
                value={matchingData.instructions || ""}
                onChange={(e) => updateConfiguration({ instructions: e.target.value })}
                placeholder="Match the items on the left with the corresponding items on the right..."
                className="min-h-[80px]"
              />
            </TabsContent>
            <TabsContent value="sl" className="space-y-2">
              <Label>Instructions (SL)</Label>
              <Textarea
                value={matchingData.instructions_sl || ""}
                onChange={(e) => updateConfiguration({ instructions_sl: e.target.value })}
                placeholder="Enter instructions in Slovenian..."
                className="min-h-[80px]"
              />
            </TabsContent>
            <TabsContent value="hr" className="space-y-2">
              <Label>Instructions (HR)</Label>
              <Textarea
                value={matchingData.instructions_hr || ""}
                onChange={(e) => updateConfiguration({ instructions_hr: e.target.value })}
                placeholder="Enter instructions in Croatian..."
                className="min-h-[80px]"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>


      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Left Items</CardTitle>
                <CardDescription>Items to match from</CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => addItem("left")}
                size="sm"
                variant="outline"
                disabled={matchingData.leftItems.length >= 10}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="left-items" direction="vertical">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 ${
                      snapshot.isDraggingOver ? "bg-primary/5 rounded-lg p-2" : ""
                    }`}
                  >
                    {matchingData.leftItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${
                              snapshot.isDragging ? "shadow-lg rotate-1 scale-105" : ""
                            }`}
                          >
                            <ItemEditor
                              item={item}
                              index={index}
                              language={language}
                              onUpdate={(updates) => updateItem("left", index, updates)}
                              onRemove={() => removeItem("left", index)}
                              canRemove={matchingData.leftItems.length > 2}
                              dragHandleProps={provided.dragHandleProps}
                              showDistractor={false}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {matchingData.leftItems.length === 0 && (
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  Add at least 2 left items to create a matching question.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Right Items</CardTitle>
                <CardDescription>Items to match to</CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => addItem("right")}
                size="sm"
                variant="outline"
                disabled={matchingData.rightItems.length >= 10}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="right-items" direction="vertical">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 ${
                      snapshot.isDraggingOver ? "bg-primary/5 rounded-lg p-2" : ""
                    }`}
                  >
                    {matchingData.rightItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${
                              snapshot.isDragging ? "shadow-lg rotate-1 scale-105" : ""
                            }`}
                          >
                            <ItemEditor
                              item={item}
                              index={index}
                              language={language}
                              onUpdate={(updates) => updateItem("right", index, updates)}
                              onRemove={() => removeItem("right", index)}
                              canRemove={matchingData.rightItems.length > 2}
                              dragHandleProps={provided.dragHandleProps}
                              showDistractor={true}
                              isDistractor={matchingData.distractors?.includes(item.id)}
                              onToggleDistractor={() => toggleDistractor(item.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {matchingData.rightItems.length === 0 && (
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  Add at least 2 right items to create a matching question.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Correct Matches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Correct Matches</CardTitle>
              <CardDescription>
                Define which left items should match with which right items
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={() => setShowMatchForm(!showMatchForm)}
              size="sm"
              variant="outline"
              disabled={matchingData.leftItems.length === 0 || matchingData.rightItems.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Match
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showMatchForm && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Left Item</Label>
                    <Select
                      value={newMatch.leftId}
                      onValueChange={(value) => setNewMatch({ ...newMatch, leftId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select left item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {matchingData.leftItems
                          .filter(item =>
                            !matchingData.correctMatches.some(m => m.leftId === item.id)
                          )
                          .map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {getItemLabel(item)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Right Item</Label>
                    <Select
                      value={newMatch.rightId}
                      onValueChange={(value) => setNewMatch({ ...newMatch, rightId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select right item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {matchingData.rightItems
                          .filter(item =>
                            !matchingData.distractors?.includes(item.id) &&
                            !matchingData.correctMatches.some(m => m.rightId === item.id)
                          )
                          .map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {getItemLabel(item)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Input
                    value={newMatch.explanation || ""}
                    onChange={(e) => setNewMatch({ ...newMatch, explanation: e.target.value })}
                    placeholder="Why is this match correct?"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowMatchForm(false);
                      setNewMatch({ leftId: "", rightId: "", explanation: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addMatch}
                    disabled={!newMatch.leftId || !newMatch.rightId}
                  >
                    Add Match
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List of existing matches */}
          {matchingData.correctMatches.length > 0 && (
            <div className="space-y-2">
              {matchingData.correctMatches.map((match, index) => {
                const leftItem = matchingData.leftItems.find(item => item.id === match.leftId);
                const rightItem = matchingData.rightItems.find(item => item.id === match.rightId);

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline">{getItemLabel(leftItem!)}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{getItemLabel(rightItem!)}</Badge>
                      {match.explanation && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({match.explanation})
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMatch(index)}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {matchingData.correctMatches.length === 0 && !showMatchForm && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                No matches defined yet. Click "Add Match" to define correct matches between left and right items.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert variant="destructive">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuration Issues:</strong>
            <ul className="list-disc list-inside mt-2">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Scoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-sm font-medium">Scoring Method</Label>
          <RadioGroup
            value={matchingData.scoring?.requireAllMatches ?? true ? "ALL_OR_NOTHING" : "PARTIAL_CREDIT"}
            onValueChange={(value) => updateConfiguration({
              scoring: {
                pointsPerMatch: 1,
                penalizeIncorrect: false,
                penaltyPerIncorrect: 0,
                requireAllMatches: value === "ALL_OR_NOTHING",
                partialCredit: value === "PARTIAL_CREDIT"
              }
            })}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="ALL_OR_NOTHING" id="matching-all-or-nothing" />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="matching-all-or-nothing"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  All or Nothing
                </Label>
                <p className="text-xs text-muted-foreground">
                  All matches must be correct to earn points
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="PARTIAL_CREDIT" id="matching-partial-credit" />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="matching-partial-credit"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Partial Credit
                </Label>
                <p className="text-xs text-muted-foreground">
                  Award points for each correct match
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual item editor component - now supports text, image, and mixed content
function ItemEditor({
  item,
  language,
  onUpdate,
  onRemove,
  canRemove,
  dragHandleProps,
  showDistractor,
  isDistractor,
  onToggleDistractor
}: {
  item: MatchingItem;
  index?: number;
  language: Language;
  onUpdate: (updates: Partial<MatchingItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
  dragHandleProps: unknown;
  showDistractor?: boolean;
  isDistractor?: boolean;
  onToggleDistractor?: () => void;
}) {
  const [contentType, setContentType] = useState<"text" | "image" | "mixed">(item.content.type);

  // Helper to update content and change type
  const changeContentType = (newType: "text" | "image" | "mixed") => {
    setContentType(newType);

    if (newType === "text") {
      const newContent: MatchingItemContent = {
        type: "text",
        text: item.content.text || "",
        text_sl: item.content.text_sl || "",
        text_hr: item.content.text_hr || "",
      };
      onUpdate({ content: newContent });
    } else if (newType === "image") {
      const newContent: MatchingItemContent = {
        type: "image",
        imageUrl: (item.content as any).imageUrl || "",
      };
      onUpdate({ content: newContent });
    } else if (newType === "mixed") {
      const newContent: MatchingItemContent = {
        type: "mixed",
        text: item.content.text || "",
        text_sl: item.content.text_sl || "",
        text_hr: item.content.text_hr || "",
        imageUrl: (item.content as any).imageUrl || "",
      };
      onUpdate({ content: newContent });
    }
  };

  // Helper to update text content fields
  const updateTextContent = (updates: Record<string, string>) => {
    const newContent = { ...item.content, ...updates };
    onUpdate({ content: newContent });
  };

  // Helper to update image
  const updateImage = (imageUrl: string) => {
    const newContent = { ...item.content, imageUrl };
    onUpdate({ content: newContent });
  };

  // Helper to remove image
  const removeImage = () => {
    const newContent = { ...item.content, imageUrl: "" };
    onUpdate({ content: newContent });
  };

  return (
    <Card className={isDistractor ? "border-orange-300 bg-orange-50/50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...(dragHandleProps as Record<string, unknown> || {})} className="cursor-move text-muted-foreground">
              <GripVertical className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="rounded-full">
              {item.id}
            </Badge>
            {showDistractor && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isDistractor || false}
                  onCheckedChange={onToggleDistractor}
                />
                <Label className="text-xs text-muted-foreground cursor-pointer" onClick={onToggleDistractor}>
                  Distractor
                </Label>
              </div>
            )}
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content Type Selector */}
        <div className="space-y-2">
          <Label>Content Type</Label>
          <Select value={contentType} onValueChange={(value: "text" | "image" | "mixed") => changeContentType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Only</SelectItem>
              <SelectItem value="image">Image Only</SelectItem>
              <SelectItem value="mixed">Image + Text</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Content */}
        {(contentType === "text" || contentType === "mixed") && (
          <Tabs defaultValue={language} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="sl">Slovenian</TabsTrigger>
              <TabsTrigger value="hr">Croatian</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-2">
              <Label>{contentType === "mixed" ? "Text (EN)" : "Text Content (EN)"}</Label>
              <Textarea
                value={item.content.text || ""}
                onChange={(e) => updateTextContent({ text: e.target.value })}
                placeholder="Enter item text..."
                className="min-h-[80px]"
              />
            </TabsContent>
            <TabsContent value="sl" className="space-y-2">
              <Label>{contentType === "mixed" ? "Text (SL)" : "Text Content (SL)"}</Label>
              <Textarea
                value={item.content.text_sl || ""}
                onChange={(e) => updateTextContent({ text_sl: e.target.value })}
                placeholder="Enter item text in Slovenian..."
                className="min-h-[80px]"
              />
            </TabsContent>
            <TabsContent value="hr" className="space-y-2">
              <Label>{contentType === "mixed" ? "Text (HR)" : "Text Content (HR)"}</Label>
              <Textarea
                value={item.content.text_hr || ""}
                onChange={(e) => updateTextContent({ text_hr: e.target.value })}
                placeholder="Enter item text in Croatian..."
                className="min-h-[80px]"
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Image Content */}
        {(contentType === "image" || contentType === "mixed") && (
          <div className="space-y-2">
            <QuestionImageUploader
              imageUrl={(item.content as any).imageUrl}
              onImageUpload={updateImage}
              onImageRemove={removeImage}
            />
          </div>
        )}

      </CardContent>
    </Card>
  );
}
