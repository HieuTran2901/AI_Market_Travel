import React from "react";
import { ArrowRight, Check, Clock, Gift } from "lucide-react";
import { missionAssets } from "./missionAssets";
import { type MissionItem } from "./missionData";
import "./EventTab.css";
import eventBackground from "../../../assets/images/eventbackground.png";

interface EventTabProps {
  missions: MissionItem[];
  onMissionAction: (mission: MissionItem) => void;
}

export const EventTab: React.FC<EventTabProps> = ({ missions, onMissionAction }) => {

  // Sort event missions if necessary, or assume they are ordered
  const eventMissions = missions.filter(m => m.category === "events");
  // For the UI redesign we want a fixed progression timeline.
  
  // Wait, the screenshot shows "2/5 Completed", and the missions are Mission 1 to Mission 5. 
  // We can calculate from `eventMissions` but there's only one "event-summer" mission in `missionItems`. 
  // Let's use the provided `eventMissions[0]` data: progress 2, target 5.
  const eventData = eventMissions[0] || { progress: 2, target: 5, rewardCoins: 700 };
  const currentProgress = eventData.progress;
  const maxTarget = eventData.target;
  const progressRatio = Math.min(currentProgress / Math.max(maxTarget, 1), 1);

  return (
    <div className="event-tab-container">
      {/* 1. Hero Event Banner */}
      <section className="event-hero-banner">
        <div 
          className="event-hero-bg" 
          style={{ backgroundImage: `url(${eventBackground})` }} 
        />
        <div className="event-hero-overlay" />
        
        {/* Top Right Special Coins Badge */}
        <div className="event-special-coins-badge">
          <span className="event-special-coins-title">Special Coins</span>
          <span className="event-special-coins-amount">+{eventData.rewardCoins}</span>
          <img src={missionAssets.goldCoin} alt="Gold Coins" />
        </div>

        <div className="event-hero-content">
          <div className="event-header-top">
            <div className="event-live-badge">
              <span /> EVENT LIVE
            </div>
            <div className="event-countdown">
              <Clock /> 24d 18h 32m left
            </div>
          </div>

          <h1 className="event-title">
            SUMMER <span>TRAVEL SPRINT</span>
          </h1>
          <p className="event-description">
            Complete {maxTarget} event missions and earn Special Coins plus exclusive rewards!
          </p>

          {/* 2. Mission Progress Timeline */}
          <div className="event-progress-section">
            <div className="event-progress-header">
              <span>Your Progress</span>
              <span>{currentProgress} / {maxTarget} Completed</span>
            </div>
            <div className="event-progress-bar-container">
              <div 
                className="event-progress-bar-fill" 
                style={{ width: `${progressRatio * 100}%` }} 
              />
            </div>
          </div>

          <div className="event-timeline">
            {[1, 2, 3, 4, 5].map((step) => {
              const isCompleted = step <= currentProgress;
              return (
                <div key={step} className={`event-timeline-node ${isCompleted ? "completed" : ""}`}>
                  <div className="event-timeline-circle">
                    {isCompleted ? <Check /> : <Gift />}
                  </div>
                  <span>Mission {step}</span>
                </div>
              );
            })}
          </div>

          {/* 3. Rewards Preview & 4. CTA */}
          <div className="event-bottom-section">
            <div className="event-rewards-preview">
              <div className="event-rewards-preview-header">
                <div className="event-rewards-preview-title">
                  <Gift /> Rewards Preview
                </div>
                <div className="event-rewards-preview-subtitle">
                  Complete missions to unlock all rewards
                </div>
              </div>
              
              <div className="event-reward-card special">
                <img src={missionAssets.goldCoin} alt="Coins" />
                <span className="event-reward-card-value">+{eventData.rewardCoins}</span>
                <span className="event-reward-card-label">Complete All</span>
              </div>
              <div className="event-reward-card">
                <img src={missionAssets.seasonMilestones.current} alt="Reward" />
                <span className="event-reward-card-value">x15</span>
                <span className="event-reward-card-label">Mission 1</span>
              </div>
              <div className="event-reward-card">
                <img src={missionAssets.checkInDay7Chest} alt="Reward" />
                <span className="event-reward-card-value">x1</span>
                <span className="event-reward-card-label">Mission 2</span>
              </div>
              <div className="event-reward-card">
                <img src={missionAssets.seasonMilestones.current} alt="Reward" />
                <span className="event-reward-card-value">x20</span>
                <span className="event-reward-card-label">Mission 3</span>
              </div>
              <div className="event-reward-card">
                <img src={missionAssets.vipCard} alt="Reward" />
                <span className="event-reward-card-value">3 Days</span>
                <span className="event-reward-card-label">Mission 4</span>
              </div>
              <div className="event-reward-card">
                <img src={missionAssets.seasonMilestones.silver} alt="Reward" />
                <span className="event-reward-card-value">x1</span>
                <span className="event-reward-card-label">Mission 5</span>
              </div>
            </div>

            <div className="event-cta-wrapper">
              <button 
                className="event-cta-btn"
                onClick={() => eventMissions[0] && onMissionAction(eventMissions[0])}
              >
                Go Now <ArrowRight />
              </button>
              <p>Complete missions and <strong>claim your rewards!</strong></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventTab;
