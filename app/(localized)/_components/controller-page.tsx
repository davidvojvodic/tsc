"use client";
import React from "react";
import SiemensLogoController from "@/components/siemens-logo-controller";
import { Card } from "@/components/ui/card";

interface ControllerPageProps {
  title: string;
  description?: string;
  controllerTitle?: string;
  controllerDescription?: string;
  customExample?: boolean;
  autoLoginExample?: boolean;
}

export default function ControllerPage({
  title = "Siemens LOGO Controller Integration",
  description = "This page demonstrates how to embed and interact with the Siemens LOGO controller interface.",
  controllerTitle = "Controller Interface",
  controllerDescription = "The basic implementation displays the controller interface with diagnostic information.",
}: ControllerPageProps) {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{controllerTitle}</h2>
        <p className="mb-4">{controllerDescription}</p>

        <SiemensLogoController />
      </Card>

      {/* Examples and usage code removed */}
    </div>
  );
}
