"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Trash2, GripVertical, HelpCircle, Type, ImageIcon, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrderingConfiguration, OrderingItem, OrderingItemContent, OrderingTextContent, OrderingImageContent, OrderingMixedContent } from "./quiz-editor-layout";

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

  const addItem = (contentType: "text" | "image" | "mixed") => {
    const newPosition = orderingData.items.length + 1;
    const newId = `item-${Date.now()}`;

    let content: OrderingItemContent;

    if (contentType === "text") {
      content = {
        type: "text",
        text: `Step ${newPosition}`,
        text_sl: "",
        text_hr: "",
      } as OrderingTextContent;
    } else if (contentType === "image") {
      content = {
        type: "image",
        imageUrl: "",
        altText: `Image ${newPosition}`,
        altText_sl: "",
        altText_hr: "",
      } as OrderingImageContent;
    } else {
      content = {
        type: "mixed",
        text: `Step ${newPosition}`,
        text_sl: "",
        text_hr: "",
        imageUrl: "",
        suffix: "",
        suffix_sl: "",
        suffix_hr: "",
      } as OrderingMixedContent;
    }

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
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => addItem("text")}
              size="sm"
              variant="outline"
              disabled={orderingData.items.length >= 10}
            >
              <Type className="mr-2 h-4 w-4" />
              Text
            </Button>
            <Button
              type="button"
              onClick={() => addItem("image")}
              size="sm"
              variant="outline"
              disabled={orderingData.items.length >= 10}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Image
            </Button>
            <Button
              type="button"
              onClick={() => addItem("mixed")}
              size="sm"
              variant="outline"
              disabled={orderingData.items.length >= 10}
            >
              <Layers className="mr-2 h-4 w-4" />
              Mixed
            </Button>
          </div>
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
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={orderingData.exactOrderRequired ?? true}
              onCheckedChange={(checked) => updateConfiguration({
                exactOrderRequired: !!checked
              })}
            />
            <div className="space-y-1 leading-none">
              <Label>Exact Order Required</Label>
              <p className="text-sm text-muted-foreground">
                All items must be in exact correct positions to earn full points
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={orderingData.allowPartialCredit ?? false}
              onCheckedChange={(checked) => updateConfiguration({
                allowPartialCredit: !!checked
              })}
            />
            <div className="space-y-1 leading-none">
              <Label>Allow Partial Credit</Label>
              <p className="text-sm text-muted-foreground">
                Award points for items in correct positions even if not all are correct
              </p>
            </div>
          </div>
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
  // Helper to transform content when type changes
  const changeContentType = (newType: "text" | "image" | "mixed") => {
    const oldContent = item.content;
    let newContent: OrderingItemContent;

    if (newType === "text") {
      newContent = {
        type: "text",
        text: oldContent.type === "text" ? oldContent.text :
              oldContent.type === "mixed" ? oldContent.text || "" : "",
        text_sl: oldContent.type === "text" ? oldContent.text_sl :
                 oldContent.type === "mixed" ? oldContent.text_sl : "",
        text_hr: oldContent.type === "text" ? oldContent.text_hr :
                 oldContent.type === "mixed" ? oldContent.text_hr : "",
      } as OrderingTextContent;
    } else if (newType === "image") {
      newContent = {
        type: "image",
        imageUrl: oldContent.type === "image" ? oldContent.imageUrl :
                  oldContent.type === "mixed" ? oldContent.imageUrl || "" : "",
        altText: oldContent.type === "image" ? oldContent.altText : `Image ${item.correctPosition}`,
        altText_sl: oldContent.type === "image" ? oldContent.altText_sl : "",
        altText_hr: oldContent.type === "image" ? oldContent.altText_hr : "",
      } as OrderingImageContent;
    } else {
      newContent = {
        type: "mixed",
        text: oldContent.type === "text" ? oldContent.text :
              oldContent.type === "mixed" ? oldContent.text : "",
        text_sl: oldContent.type === "text" ? oldContent.text_sl :
                 oldContent.type === "mixed" ? oldContent.text_sl : "",
        text_hr: oldContent.type === "text" ? oldContent.text_hr :
                 oldContent.type === "mixed" ? oldContent.text_hr : "",
        imageUrl: oldContent.type === "image" ? oldContent.imageUrl :
                  oldContent.type === "mixed" ? oldContent.imageUrl : "",
        suffix: oldContent.type === "mixed" ? oldContent.suffix : "",
        suffix_sl: oldContent.type === "mixed" ? oldContent.suffix_sl : "",
        suffix_hr: oldContent.type === "mixed" ? oldContent.suffix_hr : "",
      } as OrderingMixedContent;
    }

    onUpdate({ content: newContent });
  };

  // Helper to update nested content fields
  const updateContent = (updates: Partial<OrderingItemContent>) => {
    let newContent: OrderingItemContent;

    if (item.content.type === "text") {
      newContent = { ...item.content, ...updates } as OrderingTextContent;
    } else if (item.content.type === "image") {
      newContent = { ...item.content, ...updates } as OrderingImageContent;
    } else {
      newContent = { ...item.content, ...updates } as OrderingMixedContent;
    }

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
        {/* Item ID and Content Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Item ID</Label>
            <Input
              value={item.id}
              onChange={(e) => onUpdate({ id: e.target.value })}
              placeholder="item1"
            />
          </div>

          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select
              value={item.content.type}
              onValueChange={(value: "text" | "image" | "mixed") => {
                changeContentType(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Only</SelectItem>
                <SelectItem value="image">Image Only</SelectItem>
                <SelectItem value="mixed">Mixed (Text + Image)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content fields based on type */}
        {item.content.type === "text" && (
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
        )}

        {item.content.type === "image" && (
          <>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={item.content.imageUrl}
                onChange={(e) => updateContent({ imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <Tabs defaultValue={language} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="sl">Slovenian</TabsTrigger>
                <TabsTrigger value="hr">Croatian</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="space-y-2">
                <Label>Alt Text (EN)</Label>
                <Input
                  value={item.content.altText}
                  onChange={(e) => updateContent({ altText: e.target.value })}
                  placeholder="Describe the image..."
                />
              </TabsContent>
              <TabsContent value="sl" className="space-y-2">
                <Label>Alt Text (SL)</Label>
                <Input
                  value={item.content.altText_sl || ""}
                  onChange={(e) => updateContent({ altText_sl: e.target.value })}
                  placeholder="Describe the image in Slovenian..."
                />
              </TabsContent>
              <TabsContent value="hr" className="space-y-2">
                <Label>Alt Text (HR)</Label>
                <Input
                  value={item.content.altText_hr || ""}
                  onChange={(e) => updateContent({ altText_hr: e.target.value })}
                  placeholder="Describe the image in Croatian..."
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        {item.content.type === "mixed" && (
          <>
            <Tabs defaultValue={language} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="sl">Slovenian</TabsTrigger>
                <TabsTrigger value="hr">Croatian</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label>Text Content (EN)</Label>
                  <Textarea
                    value={item.content.text || ""}
                    onChange={(e) => updateContent({ text: e.target.value })}
                    placeholder="Enter step description..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Suffix Text (EN) - Optional</Label>
                  <Input
                    value={item.content.suffix || ""}
                    onChange={(e) => updateContent({ suffix: e.target.value })}
                    placeholder="Additional text after image..."
                  />
                </div>
              </TabsContent>
              <TabsContent value="sl" className="space-y-4">
                <div className="space-y-2">
                  <Label>Text Content (SL)</Label>
                  <Textarea
                    value={item.content.text_sl || ""}
                    onChange={(e) => updateContent({ text_sl: e.target.value })}
                    placeholder="Enter step description in Slovenian..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Suffix Text (SL) - Optional</Label>
                  <Input
                    value={item.content.suffix_sl || ""}
                    onChange={(e) => updateContent({ suffix_sl: e.target.value })}
                    placeholder="Additional text after image in Slovenian..."
                  />
                </div>
              </TabsContent>
              <TabsContent value="hr" className="space-y-4">
                <div className="space-y-2">
                  <Label>Text Content (HR)</Label>
                  <Textarea
                    value={item.content.text_hr || ""}
                    onChange={(e) => updateContent({ text_hr: e.target.value })}
                    placeholder="Enter step description in Croatian..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Suffix Text (HR) - Optional</Label>
                  <Input
                    value={item.content.suffix_hr || ""}
                    onChange={(e) => updateContent({ suffix_hr: e.target.value })}
                    placeholder="Additional text after image in Croatian..."
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="space-y-2">
              <Label>Image URL - Optional</Label>
              <Input
                value={item.content.imageUrl || ""}
                onChange={(e) => updateContent({ imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}