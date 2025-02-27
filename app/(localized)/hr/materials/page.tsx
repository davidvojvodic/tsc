// app/(localized)/en/materials/page.tsx
import MaterialsPage from "../../_components/materials-page";

export default async function Page(props: any) {
  return <MaterialsPage {...props} language="hr" />;
}
