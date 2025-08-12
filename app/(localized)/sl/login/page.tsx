import { ComponentProps } from "react";
import LoginPage from "../../_components/login-page";

export default async function Page(
  props: Omit<ComponentProps<typeof LoginPage>, "language">
) {
  return <LoginPage {...props} language="sl" />;
}