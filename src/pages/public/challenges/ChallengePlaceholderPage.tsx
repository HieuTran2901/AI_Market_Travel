import React from "react";
import { Gamepad2, ListChecks, RotateCw, Trophy } from "lucide-react";

const challengePageContent = {
  "lucky-wheel": {
    title: "Vòng quay may mắn",
    description: "Quay thưởng và nhận Coins, vật phẩm đặc biệt.",
    icon: RotateCw,
  },
  missions: {
    title: "Nhiệm vụ",
    description: "Hoàn thành thử thách để nhận phần thưởng.",
    icon: ListChecks,
  },
  games: {
    title: "Game",
    description: "Khám phá các minigame giải trí.",
    icon: Gamepad2,
  },
  index: {
    title: "Challenge",
    description: "Thử thách, nhiệm vụ và phần thưởng Special Coins.",
    icon: Trophy,
  },
} as const;

export type ChallengePageKind = keyof typeof challengePageContent;

export const ChallengePlaceholderPage: React.FC<{
  kind?: ChallengePageKind;
}> = ({ kind = "index" }) => {
  const content = challengePageContent[kind];
  const Icon = content.icon;

  return (
    <section className="min-h-[55vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-violet-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-600">
          <Icon className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
          {content.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-slate-600">
          {content.description}
        </p>
        <p className="mt-4 text-sm font-bold text-slate-400">
          Challenge experience coming soon.
        </p>
      </div>
    </section>
  );
};
