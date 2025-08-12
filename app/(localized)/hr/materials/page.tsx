import { ComponentProps } from "react";
import MaterialsPage from "../../_components/materials-page";

export default async function Page(
  props: Omit<ComponentProps<typeof MaterialsPage>, "language">
) {
  return <MaterialsPage {...props} language="hr" />;
}
