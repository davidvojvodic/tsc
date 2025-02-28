import { ComponentProps } from "react";
import RegisterPage from "../../_components/register-page";

export default async function Page(
  props: Omit<ComponentProps<typeof RegisterPage>, "language">
) {
  return <RegisterPage {...props} language="en" />;
}