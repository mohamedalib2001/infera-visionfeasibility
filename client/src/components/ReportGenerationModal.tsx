import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, AlertCircle, Brain, BarChart3, TrendingUp, Shield, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  lang: "en" | "ar";
  onComplete: () => void;
  onError: (error: string) => void;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  init: <Brain className="w-5 h-5" />,
  executive: <FileText className="w-5 h-5" />,
  market: <TrendingUp className="w-5 h-5" />,
  technical: <Loader2 className="w-5 h-5 animate-spin" />,
  financial: <BarChart3 className="w-5 h-5" />,
  risk: <Shield className="w-5 h-5" />,
  recommendations: <Sparkles className="w-5 h-5" />,
  saving: <CheckCircle2 className="w-5 h-5" />,
  complete: <CheckCircle2 className="w-5 h-5" />,
};

export function ReportGenerationModal({
  isOpen,
  onClose,
  projectId,
  lang,
  onComplete,
  onError,
}: ReportGenerationModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("init");
  const [status, setStatus] = useState<"loading" | "complete" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState<string>(
    lang === "ar" ? "جاري التهيئة..." : "Initializing..."
  );
  
  const isRtl = lang === "ar";

  useEffect(() => {
    if (!isOpen) return;

    setProgress(0);
    setCurrentStage("init");
    setStatus("loading");
    setErrorMessage("");
    setCurrentMessage(lang === "ar" ? "جاري التهيئة..." : "Initializing...");

    const eventSource = new EventSource(`/api/projects/${projectId}/generate/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.stage) {
          setCurrentStage(data.stage);
        }
        if (typeof data.progress === "number") {
          setProgress(data.progress);
        }
        if (data.messageEn || data.messageAr) {
          setCurrentMessage(lang === "ar" ? data.messageAr : data.messageEn);
        }
        if (data.status === "complete") {
          setStatus("complete");
          setProgress(100);
          setCurrentMessage(lang === "ar" ? "تم إنشاء التقرير بنجاح!" : "Report generated successfully!");
          eventSource.close();
          setTimeout(() => {
            onComplete();
          }, 1500);
        }
        if (data.status === "error") {
          setStatus("error");
          setErrorMessage(data.message || "Generation failed");
          eventSource.close();
          onError(data.message || "Generation failed");
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    eventSource.onerror = () => {
      if (status === "loading") {
        setStatus("error");
        setErrorMessage(lang === "ar" ? "فشل الاتصال بالخادم" : "Connection to server failed");
        eventSource.close();
        onError("Connection failed");
      }
    };

    return () => {
      eventSource.close();
    };
  }, [isOpen, projectId, lang, onComplete, onError]);

  const getStageIcon = useCallback(() => {
    return STAGE_ICONS[currentStage] || <Loader2 className="w-5 h-5 animate-spin" />;
  }, [currentStage]);

  const t = {
    title: lang === "ar" ? "جاري إنشاء دراسة الجدوى" : "Generating Feasibility Study",
    subtitle: lang === "ar" ? "يقوم الذكاء الاصطناعي بتحليل مشروعك" : "AI is analyzing your project",
    complete: lang === "ar" ? "اكتمل التقرير!" : "Report Complete!",
    completeDesc: lang === "ar" ? "تم إنشاء دراسة الجدوى بنجاح" : "Your feasibility study has been generated",
    errorTitle: lang === "ar" ? "حدث خطأ" : "Error Occurred",
    tryAgain: lang === "ar" ? "حاول مرة أخرى" : "Try Again",
    close: lang === "ar" ? "إغلاق" : "Close",
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md overflow-hidden p-0 border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        dir={isRtl ? "rtl" : "ltr"}
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{t.title}</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          <div className="relative p-6">
            <AnimatePresence mode="wait">
              {status === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4"
                    >
                      <Sparkles className="w-8 h-8" />
                    </motion.div>
                    <h3 className="text-lg font-semibold">{t.title}</h3>
                    <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Progress value={progress} className="h-3" />
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-primary/30 rounded-full"
                        style={{ width: `${progress}%` }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                  </div>

                  <motion.div
                    key={currentStage + currentMessage}
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex-shrink-0 text-primary">
                      {getStageIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{currentMessage}</p>
                    </div>
                    <motion.div 
                      className="flex gap-1"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </motion.div>
                  </motion.div>

                  <div className="flex justify-center gap-1.5">
                    {["executive", "market", "technical", "financial", "risk", "recommendations", "saving"].map((stage, idx) => {
                      const stageOrder = ["executive", "market", "technical", "financial", "risk", "recommendations", "saving"];
                      const currentIdx = stageOrder.indexOf(currentStage);
                      const isCompleted = idx < currentIdx;
                      const isCurrent = stage === currentStage;
                      
                      return (
                        <motion.div
                          key={stage}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            isCompleted ? "bg-primary" :
                            isCurrent ? "bg-primary animate-pulse" :
                            "bg-muted-foreground/30"
                          }`}
                          initial={{ scale: 0.8 }}
                          animate={{ 
                            scale: isCurrent ? [1, 1.3, 1] : 1,
                          }}
                          transition={{ 
                            duration: 0.8,
                            repeat: isCurrent ? Infinity : 0,
                          }}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {status === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">{t.complete}</h3>
                  <p className="text-sm text-muted-foreground">{t.completeDesc}</p>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive"
                  >
                    <AlertCircle className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-destructive">{t.errorTitle}</h3>
                  <p className="text-sm text-muted-foreground">{errorMessage}</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={onClose} data-testid="button-close-modal">
                      {t.close}
                    </Button>
                    <Button onClick={() => {
                      setStatus("loading");
                      setProgress(0);
                      setCurrentStage("init");
                      setErrorMessage("");
                    }} data-testid="button-try-again">
                      {t.tryAgain}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
