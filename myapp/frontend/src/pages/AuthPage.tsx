import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthCard } from "@daveyplate/better-auth-ui";
import { useSession } from "better-auth/client";

export default function AuthPage() {
  const { page } = useParams<{ page: string }>();
  const { data: session } = useSession();
  const navigate = useNavigate();

  // Redirect to home if already signed in
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  // Validate page parameter
  const validPages = ["signIn", "signUp", "forgotPassword", "resetPassword"];
  const currentPage = page && validPages.includes(page) ? page : "signIn";

  return (
    <div className="auth-container">
      <div className="auth-card-wrapper">
        <h2>{currentPage === "signIn" ? "Sign In" : currentPage === "signUp" ? "Create Account" : "Reset Password"}</h2>
        <AuthCard pathname={currentPage} />
      </div>
    </div>
  );
}