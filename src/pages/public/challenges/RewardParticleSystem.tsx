import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { missionAssets } from "./missionAssets";
import { Star } from "lucide-react";

export interface RewardParticle {
  id: string;
  type: "coin" | "exp";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const RewardParticleSystem: React.FC<{ particles: RewardParticle[] }> = ({ particles }) => {
  const [activeParticles, setActiveParticles] = useState<RewardParticle[]>([]);

  useEffect(() => {
    if (particles.length > 0) {
      setActiveParticles((prev) => [...prev, ...particles]);
      
      // Auto cleanup
      const timer = setTimeout(() => {
        setActiveParticles((prev) => prev.filter(p => !particles.find(newP => newP.id === p.id)));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10000 }}>
      <AnimatePresence>
        {activeParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: particle.startX, 
              y: particle.startY,
              scale: 0.5,
              opacity: 0
            }}
            animate={{ 
              x: particle.endX, 
              y: particle.endY,
              scale: [0.5, 1.5, 1],
              opacity: [0, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.7,
              ease: "easeInOut",
              scale: { times: [0, 0.5, 1] },
              opacity: { times: [0, 0.2, 1] }
            }}
            style={{
              position: 'absolute',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {particle.type === "coin" ? (
              <img src={missionAssets.goldCoin} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Star className="fill-amber-400 text-amber-400" style={{ width: '100%', height: '100%' }} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
