import { ComponentProps } from "react";
import ResetPasswordPage from "../../_components/reset-password-page";

export default async function Page(
  props: Omit<ComponentProps<typeof ResetPasswordPage>, "language">
) {
  return <ResetPasswordPage {...props} language="en" />;
}