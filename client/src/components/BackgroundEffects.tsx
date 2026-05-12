import { motion } from "framer-motion";

export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15]" />
      
      {/* Glowing Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -50, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[128px]"
      />
      
      {/* Tech Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}
