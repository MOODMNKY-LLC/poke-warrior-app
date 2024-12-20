import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <GlassCard className="w-full p-8">
        <FormMessage message={searchParams} />
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="w-full p-8">
        <form className="w-full space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium">Sign up</h1>
            <p className="text-sm text-foreground/80">
              Already have an account?{" "}
              <Link className="text-primary hover:text-primary/80 font-medium underline" href="/sign-in">
                Sign in
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input name="email" placeholder="you@example.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                name="password"
                placeholder="Your password"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="family_name">Family Name</Label>
              <Input 
                name="family_name" 
                placeholder="The Ketchum Family"
                minLength={2}
                required 
              />
            </div>

            <SubmitButton formAction={signUpAction} pendingText="Signing up...">
              Sign up
            </SubmitButton>
            <FormMessage message={searchParams} />
          </div>
        </form>
      </GlassCard>
      <SmtpMessage />
    </>
  );
}
