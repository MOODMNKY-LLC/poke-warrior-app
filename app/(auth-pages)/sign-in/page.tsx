import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <GlassCard className="w-full p-8">
      <form className="w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium">Sign in</h1>
          <p className="text-sm text-foreground/80">
            Don't have an account?{" "}
            <Link className="text-primary hover:text-primary/80 font-medium underline" href="/sign-up">
              Sign up
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                className="text-xs text-foreground/80 hover:text-foreground underline"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              required
            />
          </div>

          <SubmitButton pendingText="Signing In..." formAction={signInAction}>
            Sign in
          </SubmitButton>
          
          <FormMessage message={searchParams} />
        </div>
      </form>
    </GlassCard>
  );
}
