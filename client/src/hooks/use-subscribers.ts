import { useMutation } from "@tanstack/react-query";
import { api, type InsertSubscriber } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useSubscribe() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSubscriber) => {
      // Validate first (redundant but safe)
      const validated = api.subscribers.create.input.parse(data);
      
      const res = await fetch(api.subscribers.create.path, {
        method: api.subscribers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        // Try to parse error message from known schemas
        try {
          const errorData = await res.json();
          // Check against 409 (Conflict) schema
          if (res.status === 409) {
             const parsed = api.subscribers.create.responses[409].parse(errorData);
             throw new Error(parsed.message);
          }
          // Check against 400 (Bad Request) schema
          if (res.status === 400) {
             const parsed = api.subscribers.create.responses[400].parse(errorData);
             throw new Error(parsed.message);
          }
        } catch (e) {
          // If parsing fails or it's a different error
          if (e instanceof Error) throw e;
        }
        throw new Error("Failed to subscribe");
      }

      return api.subscribers.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
        className: "bg-primary text-primary-foreground border-none",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
