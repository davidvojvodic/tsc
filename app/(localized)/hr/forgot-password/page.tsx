import { ComponentProps } from "react";
import ForgotPasswordPage from "../../_components/forgot-password-page";

export default async function Page(
  props: Omit<ComponentProps<typeof ForgotPasswordPage>, "language">
) {
  return <ForgotPasswordPage {...props} language="hr" />;
}