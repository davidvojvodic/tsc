"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Trash2, GripVertical, HelpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrderingConfiguration, OrderingItem, OrderingItemContent, OrderingTextContent } from "./quiz-editor-layout";

type Language = "en" | "sl" | "hr";

interface Question {
  orderingData?: OrderingConfiguration;
}

interface OrderingConfigurationEditorProps {
  question: Question;
  language: Language;
  onChange: (field: string, value: OrderingConfiguration) => void;
}

export function OrderingConfigurationEditor({
  question,
  language,
  onChange
}: OrderingConfigurationEditorProps) {
  const orderingData: OrderingConfiguration = question.orderingData || {
    instructions: "Arrange the following items in the correct order:",
    instructions_sl: "",
    instructions_hr: "",
    items: [],
    allowPartialCredit: false,
    exactOrderRequired: true,
  };

  const updateConfiguration = (updates: Partial<OrderingConfiguration>) => {
    const newConfiguration = { ...orderingData, ...updates };
    onChange("orderingData", newConfiguration);
  };

  const addItem = () => {
    const newPosition = orderingData.items.length + 1;
    const newId = `item-${Date.now()}`;

    const content: OrderingTextContent = {
      type: "text",
      text: `Step ${newPosition}`,
      text_sl: "",
      text_hr: "",
    };

    const newItem: OrderingItem = {
      id: newId,
      correctPosition: newPosition,
      content,
    };

    updateConfiguration({
      items: [...orderingData.items, newItem]
    });
  };

  const removeItem = (index: number) => {
    if (orderingData.items.length <= 2) return; // Minimum 2 items

    const newItems = orderingData.items.filter((_, i) => i !== index);
    // Recalculate correctPosition after removal
    const reindexedItems = newItems.map((item, idx) => ({
      ...item,
      correctPosition: idx + 1
    }));

    updateConfiguration({ items: reindexedItems });
  };

  const updateItem = (index: number, updates: Partial<OrderingItem>) => {
    const newItems = [...orderingData.items];
    newItems[index] = { ...newItems[index], ...updates };
    updateConfiguration({ items: newItems });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const newItems = Array.from(orderingData.items);
    const [reorderedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(destIndex, 0, reorderedItem);

    // Update correctPosition based on new order
    const reindexedItems = newItems.map((item, idx) => ({
      ...item,
      correctPosition: idx + 1
    }));

    updateConfiguration({ items: reindexedItems });
  };

  return (
    <div className="space-y-6">
      {/* Items */}
      <div className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Drag to set correct order:</strong> The order you arrange items here is the correct answer.
            Students will see these items shuffled and must arrange them to match your order.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Items to Order</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Add items that users will arrange in the correct sequence (2-10 items)
            </p>
          </div>
          <Button
            type="button"
            onClick={addItem}
            size="sm"
            variant="outline"
            disabled={orderingData.items.length >= 10}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="ordering-items" direction="vertical">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 ${
                  snapshot.isDraggingOver ? "bg-primary/5 rounded-lg p-2" : ""
                }`}
              >
                {orderingData.items.map((item, index) => (
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
                          onUpdate={(updates) => updateItem(index, updates)}
                          onRemove={() => removeItem(index)}
                          canRemove={orderingData.items.length > 2}
                          dragHandleProps={provided.dragHandleProps}
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

        {orderingData.items.length === 0 && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              Add at least 2 items to create an ordering question. Use the buttons above to add text, image, or mixed content items.
            </AlertDescription>
          </Alert>
        )}

        {orderingData.items.length === 10 && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum number of items (10) reached. Remove an item to add more.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Scoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Settings</CardTitle>
          <CardDescription>
            Configure how this question will be scored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-sm font-medium">Scoring Method</Label>
          <RadioGroup
            value={orderingData.exactOrderRequired ?? true ? "ALL_OR_NOTHING" : "PARTIAL_CREDIT"}
            onValueChange={(value) => updateConfiguration({
              exactOrderRequired: value === "ALL_OR_NOTHING",
              allowPartialCredit: value === "PARTIAL_CREDIT"
            })}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="ALL_OR_NOTHING" id="ordering-all-or-nothing" />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="ordering-all-or-nothing"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  All or Nothing
                </Label>
                <p className="text-xs text-muted-foreground">
                  All items must be in exact correct positions to earn points
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="PARTIAL_CREDIT" id="ordering-partial-credit" />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="ordering-partial-credit"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Partial Credit
                </Label>
                <p className="text-xs text-muted-foreground">
                  Award points for each item in the correct position
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual item editor component
function ItemEditor({
  item,
  language,
  onUpdate,
  onRemove,
  canRemove,
  dragHandleProps
}: {
  item: OrderingItem;
  index?: number;
  language: Language;
  onUpdate: (updates: Partial<OrderingItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
  dragHandleProps: unknown;
}) {
  // Helper to update text content fields
  const updateContent = (updates: Partial<OrderingTextContent>) => {
    const newContent: OrderingTextContent = { ...item.content as OrderingTextContent, ...updates };
    onUpdate({ content: newContent });
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...(dragHandleProps as Record<string, unknown> || {})} className="cursor-move text-muted-foreground">
              <GripVertical className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="rounded-full">
              Position {item.correctPosition}
            </Badge>
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
        {/* Text content only */}
          <Tabs defaultValue={language} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="sl">Slovenian</TabsTrigger>
              <TabsTrigger value="hr">Croatian</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-2">
              <Label>Text Content (EN)</Label>
              <Textarea
                value={item.content.text}
                onChange={(e) => updateContent({ text: e.target.value })}
                placeholder="Enter step description..."
                className="min-h-[80px]"
              />
            </TabsContent>
            <TabsContent value="sl" className="space-y-2">
              <Label>Text Content (SL)</Label>
              <Textarea
                value={item.content.text_sl || ""}
                onChange={(e) => updateContent({ text_sl: e.target.value })}
                placeholder="Enter step description in Slovenian..."
                className="min-h-[80px]"
              />
            </TabsContent>
            <TabsContent value="hr" className="space-y-2">
              <Label>Text Content (HR)</Label>
              <Textarea
                value={item.content.text_hr || ""}
                onChange={(e) => updateContent({ text_hr: e.target.value })}
                placeholder="Enter step description in Croatian..."
                className="min-h-[80px]"
              />
            </TabsContent>
          </Tabs>
      </CardContent>
    </Card>
  );
}