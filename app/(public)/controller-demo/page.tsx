import React from "react";
import SiemensLogoController from "@/components/siemens-logo-controller";
import { Card } from "@/components/ui/card";

// Demo page to showcase the Siemens LOGO controller integration
export default function ControllerDemoPage() {
  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Siemens LOGO Controller Interface</h1>
        <p className="text-muted-foreground">
          This page demonstrates the Siemens LOGO controller with built-in diagnostic capabilities.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Controller Diagnostics</h2>
        <p className="mb-4">
          This implementation automatically tests the connection to the controller and displays diagnostic information.
        </p>
        
        <SiemensLogoController height={600} />
      </Card>
    </div>
  );
}