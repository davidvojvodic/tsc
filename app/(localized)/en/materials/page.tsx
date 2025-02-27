import { ComponentProps } from "react";
import MaterialsPage from "../../_components/materials-page";

// Omit the language property since it's not provided by Next.js routing
export default async function Page(
  props: Omit<ComponentProps<typeof MaterialsPage>, "language">
) {
  return <MaterialsPage {...props} language="en" />;
}
