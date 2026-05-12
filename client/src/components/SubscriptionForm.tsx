import { useState } from "react";
import { useSubscribe } from "@/hooks/use-subscribers";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function SubscriptionForm() {
  const [email, setEmail] = useState("");
  const subscribe = useSubscribe();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    subscribe.mutate({ email }, {
      onSuccess: () => {
        setEmail("");
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-card border border-white/10 rounded-xl p-1.5 shadow-2xl">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address..."
            disabled={subscribe.isPending || subscribe.isSuccess}
            className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 px-4 py-3 text-base sm:text-lg outline-none w-full"
            required
          />
          
          <button
            type="submit"
            disabled={subscribe.isPending || subscribe.isSuccess}
            className="mt-2 sm:mt-0 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 group/btn border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {subscribe.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : subscribe.isSuccess ? (
              <>
                <span className="text-primary">Joined</span>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </>
            ) : (
              <>
                Notify Me
                <ArrowRight className="w-4 h-4 text-primary group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
      
      <p className="mt-4 text-center text-sm text-gray-500 font-light">
        Join the waitlist for early access. No spam, ever.
      </p>
    </div>
  );
}
