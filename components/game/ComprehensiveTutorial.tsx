"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Zap,
  DollarSign,
  AlertTriangle,
  Trophy,
  Users,
  Target,
  Dices,
  List,
  Lock,
  Unlock,
  TrendingUp,
  Clock,
  Star,
  Calendar,
  Shield,
  Skull,
  MapPin,
  MessageSquare,
  Sparkles,
  Award,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameContext } from "@/lib/game/GameContext";

// Tutorial page structure
interface TutorialPage {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  color: string;
  content: React.ReactNode;
}

// ================================
// TUTORIAL PAGE COMPONENTS
// ================================

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-4 text-sm">{children}</div>
);

const Section: React.FC<{
  title: string;
  icon?: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
}> = ({ title, icon: Icon, iconColor = "text-cyan-400", children }) => (
  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
      {Icon && <Icon size={16} className={iconColor} />}
      {title}
    </h4>
    {children}
  </div>
);

const ResourceBadge: React.FC<{
  icon: React.ElementType;
  name: string;
  color: string;
  description: string;
}> = ({ icon: Icon, name, color, description }) => (
  <div className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
    <div className={`p-2 rounded ${color}`}>
      <Icon size={16} />
    </div>
    <div>
      <span className="font-semibold text-white">{name}</span>
      <p className="text-white/60 text-xs mt-0.5">{description}</p>
    </div>
  </div>
);

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs">
    <Sparkles size={14} className="flex-shrink-0 mt-0.5" />
    <span>{children}</span>
  </div>
);

// ================================
// TUTORIAL PAGES DATA
// ================================

const tutorialPages: TutorialPage[] = [
  // 1. WELCOME
  {
    id: "welcome",
    title: "Welcome to Culture War",
    category: "Introduction",
    icon: Play,
    color: "text-cyan-400",
    content: (
      <PageWrapper>
        <div className="text-center py-4">
          <div className="text-5xl mb-4">🎮</div>
          <h3 className="text-xl font-bold text-white mb-2">
            Lead a Digital Movement
          </h3>
          <p className="text-white/70">
            Build support across America, manage resources, navigate political
            factions, and rise to cultural dominance—or watch your movement
            crumble.
          </p>
        </div>

        <Section title="Your Mission" icon={Target} iconColor="text-purple-400">
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              Build nationwide support through strategic actions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              Manage resources: Clout, Funds, and Risk
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              Win faction loyalty or broad public approval
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              Achieve victory before you get canceled
            </li>
          </ul>
        </Section>

        <Tip>
          This tutorial covers all mechanics. Use the navigation arrows or page
          dots to jump between sections!
        </Tip>
      </PageWrapper>
    ),
  },

  // 2. RESOURCES
  {
    id: "resources",
    title: "Core Resources",
    category: "Basics",
    icon: Zap,
    color: "text-cyan-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Every action costs resources. Manage these carefully to sustain your
          movement.
        </p>

        <div className="space-y-3">
          <ResourceBadge
            icon={Zap}
            name="Clout"
            color="bg-cyan-500/20 text-cyan-400"
            description="Your reputation and influence. Spend it on high-profile actions. Earned through successful campaigns."
          />
          <ResourceBadge
            icon={DollarSign}
            name="Funds"
            color="bg-green-500/20 text-green-400"
            description="Money for operations. Needed for rallies, ads, and infrastructure. Earn through fundraising."
          />
          <ResourceBadge
            icon={AlertTriangle}
            name="Risk"
            color="bg-red-500/20 text-red-400"
            description="Platform scrutiny level. High risk = higher costs. At 100%, your movement collapses!"
          />
          <ResourceBadge
            icon={Heart}
            name="Support"
            color="bg-purple-500/20 text-purple-400"
            description="State-by-state approval rating. Your primary measure of success. Win by reaching 80% average."
          />
        </div>

        <Tip>
          Start with 50 Clout and $100 Funds. Risk starts at 0% but grows with
          aggressive actions.
        </Tip>
      </PageWrapper>
    ),
  },

  // 3. RISK ZONES
  {
    id: "risk-zones",
    title: "Risk Zones",
    category: "Basics",
    icon: AlertTriangle,
    color: "text-red-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          As your risk increases, you enter different danger zones. Each zone
          has consequences.
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Shield size={20} className="text-green-400" />
            <div>
              <span className="font-semibold text-green-400">
                SAFE (0-49%)
              </span>
              <p className="text-white/60 text-xs">
                Normal operations. No cost penalties.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle size={20} className="text-yellow-400" />
            <div>
              <span className="font-semibold text-yellow-400">
                CAUTION (50-74%)
              </span>
              <p className="text-white/60 text-xs">
                All action costs +10%. Advisors getting nervous.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <AlertTriangle size={20} className="text-orange-400" />
            <div>
              <span className="font-semibold text-orange-400">
                DANGER (75-89%)
              </span>
              <p className="text-white/60 text-xs">
                All action costs +25%. High scrutiny.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <Skull size={20} className="text-red-400" />
            <div>
              <span className="font-semibold text-red-400">
                CRITICAL (90-99%)
              </span>
              <p className="text-white/60 text-xs">
                All costs +40%. Some actions LOCKED. One wrong move = game over!
              </p>
            </div>
          </div>
        </div>

        <Tip>
          Some actions reduce risk. Balance aggressive growth with damage
          control!
        </Tip>
      </PageWrapper>
    ),
  },

  // 4. SPIN MODE
  {
    id: "spin-mode",
    title: "Spin Mode",
    category: "Actions",
    icon: Dices,
    color: "text-purple-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          The innovative "Narrative Poker" system. Spin 3 reels to create unique
          action combinations!
        </p>

        <Section title="The Three Reels" icon={Dices} iconColor="text-purple-400">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="text-2xl mb-1">⚔️</div>
              <span className="text-xs font-semibold text-cyan-400">ACTION</span>
              <p className="text-[10px] text-white/50">What you do</p>
            </div>
            <div className="text-center p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="text-2xl mb-1">✨</div>
              <span className="text-xs font-semibold text-purple-400">MODIFIER</span>
              <p className="text-[10px] text-white/50">How you do it</p>
            </div>
            <div className="text-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="text-2xl mb-1">🎯</div>
              <span className="text-xs font-semibold text-amber-400">TARGET</span>
              <p className="text-[10px] text-white/50">Where/Who</p>
            </div>
          </div>
          <p className="text-white/60 text-xs">
            Example: <strong>Rally</strong> + <strong>Viral</strong> + <strong>Swing States</strong> =
            A viral rally focused on swing states!
          </p>
        </Section>

        <Section title="Key Features" icon={Star} iconColor="text-amber-400">
          <ul className="space-y-2 text-white/70 text-xs">
            <li className="flex items-start gap-2">
              <Lock size={12} className="text-amber-400 mt-0.5" />
              <span><strong>Lock Reels:</strong> Keep results you like, reroll the rest</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={12} className="text-purple-400 mt-0.5" />
              <span><strong>Combos:</strong> Matching tags = damage multipliers (1.5x-3x!)</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap size={12} className="text-cyan-400 mt-0.5" />
              <span><strong>Reroll Cost:</strong> Increases each time (5, 10, 20 clout...)</span>
            </li>
          </ul>
        </Section>

        <Tip>
          Look for matching tags between reels! "Aggressive" action + "Aggressive" modifier = COMBO bonus!
        </Tip>
      </PageWrapper>
    ),
  },

  // 5. CLASSIC MODE
  {
    id: "classic-mode",
    title: "Classic Mode",
    category: "Actions",
    icon: List,
    color: "text-cyan-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Prefer direct control? Classic mode offers fixed actions with
          predictable costs and outcomes.
        </p>

        <Section title="Available Actions" icon={List} iconColor="text-cyan-400">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-black/20 rounded">
              <span className="text-white">📣 Meme Campaign</span>
              <span className="text-xs text-cyan-400">10 Clout → +5% Support</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-black/20 rounded">
              <span className="text-white">💰 Fundraise</span>
              <span className="text-xs text-green-400">Free → +$50</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-black/20 rounded">
              <span className="text-white">🎪 Rally</span>
              <span className="text-xs text-amber-400">$30 → +10% State</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-black/20 rounded">
              <span className="text-white">🤖 Bot Army</span>
              <span className="text-xs text-red-400">$20 + 5 Clout → +3% All (HIGH RISK)</span>
            </div>
          </div>
        </Section>

        <Section title="Action Economy" icon={Clock} iconColor="text-amber-400">
          <ul className="space-y-2 text-white/70 text-xs">
            <li className="flex items-start gap-2">
              <Clock size={12} className="text-amber-400 mt-0.5" />
              <span><strong>Cooldowns:</strong> Powerful actions have cooldown periods</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp size={12} className="text-red-400 mt-0.5" />
              <span><strong>Diminishing Returns:</strong> Spamming same action reduces effectiveness</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock size={12} className="text-white/40 mt-0.5" />
              <span><strong>Prerequisites:</strong> Some actions require minimum stats</span>
            </li>
          </ul>
        </Section>

        <Tip>
          Switch between Spin and Classic mode anytime! Use the toggle at the
          top of the Actions panel.
        </Tip>
      </PageWrapper>
    ),
  },

  // 6. VICTORY PATHS
  {
    id: "victory",
    title: "Victory Paths",
    category: "Goals",
    icon: Trophy,
    color: "text-amber-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Four distinct ways to win. Choose your strategy and focus your
          efforts!
        </p>

        <div className="space-y-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-amber-400" />
              <span className="font-semibold text-amber-400">Popular Mandate</span>
            </div>
            <p className="text-white/60 text-xs">
              Reach 80% average support + control 35 states at 60%+
            </p>
          </div>

          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-purple-400" />
              <span className="font-semibold text-purple-400">Faction Dominance</span>
            </div>
            <p className="text-white/60 text-xs">
              Get any single faction to 95% loyalty
            </p>
          </div>

          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-green-400" />
              <span className="font-semibold text-green-400">Economic Power</span>
            </div>
            <p className="text-white/60 text-xs">
              Earn $2,000 total funds + 1,000 total clout
            </p>
          </div>

          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-cyan-400" />
              <span className="font-semibold text-cyan-400">Speed Run</span>
            </div>
            <p className="text-white/60 text-xs">
              Reach 60% support by turn 10 (high risk, high reward!)
            </p>
          </div>
        </div>

        <Tip>
          Track your progress toward all victory paths using the Victory Tracker
          at the top of the screen!
        </Tip>
      </PageWrapper>
    ),
  },

  // 7. DEFEAT CONDITIONS
  {
    id: "defeat",
    title: "How You Lose",
    category: "Goals",
    icon: Skull,
    color: "text-red-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Your movement can collapse in several ways. Stay vigilant!
        </p>

        <div className="space-y-3">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-red-400" />
              <span className="font-semibold text-red-400">Risk Collapse</span>
            </div>
            <p className="text-white/60 text-sm">
              Risk reaches 100%. You've been completely exposed and deplatformed.
            </p>
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-purple-400" />
              <span className="font-semibold text-purple-400">Faction Abandonment</span>
            </div>
            <p className="text-white/60 text-sm">
              Any faction drops below 10% loyalty. They turn hostile and work
              against you.
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-amber-400" />
              <span className="font-semibold text-amber-400">Bankruptcy</span>
            </div>
            <p className="text-white/60 text-sm">
              Stay at $0 for 3 consecutive turns. Your movement runs out of
              steam.
            </p>
          </div>
        </div>

        <Tip>
          Watch the Risk Meter and faction sentiment! Early warnings give you
          time to course-correct.
        </Tip>
      </PageWrapper>
    ),
  },

  // 8. FACTIONS
  {
    id: "factions",
    title: "Political Factions",
    category: "Advanced",
    icon: Users,
    color: "text-purple-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Five voter factions with distinct personalities. Each reacts
          differently to your actions!
        </p>

        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
            <span className="text-2xl">💻</span>
            <div>
              <span className="font-semibold text-white text-sm">Tech Workers</span>
              <p className="text-white/50 text-xs">Love podcasts, hate bots</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
            <span className="text-2xl">🌾</span>
            <div>
              <span className="font-semibold text-white text-sm">Rural Voters</span>
              <p className="text-white/50 text-xs">Love rallies & canvassing</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
            <span className="text-2xl">✊</span>
            <div>
              <span className="font-semibold text-white text-sm">Young Activists</span>
              <p className="text-white/50 text-xs">Love memes, impatient</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
            <span className="text-2xl">🏛️</span>
            <div>
              <span className="font-semibold text-white text-sm">Establishment</span>
              <p className="text-white/50 text-xs">Value stability, hate chaos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
            <span className="text-2xl">💼</span>
            <div>
              <span className="font-semibold text-white text-sm">Business Class</span>
              <p className="text-white/50 text-xs">Profit-focused, pragmatic</p>
            </div>
          </div>
        </div>

        <Section title="Faction Mood States" icon={Heart} iconColor="text-pink-400">
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">Hostile</span>
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">Skeptical</span>
            <span className="px-2 py-1 bg-white/10 text-white/60 rounded">Neutral</span>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Sympathetic</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">Enthusiastic</span>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Devoted</span>
          </div>
        </Section>

        <Tip>
          Check the Factions panel to see how each group feels about your
          movement. Hostile factions can sabotage you!
        </Tip>
      </PageWrapper>
    ),
  },

  // 9. EVENTS
  {
    id: "events",
    title: "Events System",
    category: "Advanced",
    icon: MessageSquare,
    color: "text-cyan-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Random events create narrative moments. Your choices shape the story!
        </p>

        <Section title="Event Types" icon={MessageSquare} iconColor="text-cyan-400">
          <ul className="space-y-2 text-white/70 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span><strong>Interactive Events:</strong> Choose between options with different outcomes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span><strong>Narrative Events:</strong> Story moments that auto-resolve</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>Chain Events:</strong> Multi-part stories that unfold over turns</span>
            </li>
          </ul>
        </Section>

        <Section title="When Events Happen" icon={Clock} iconColor="text-amber-400">
          <ul className="space-y-2 text-white/70 text-xs">
            <li>• Events start appearing after Turn 3</li>
            <li>• ~30% chance each turn after that</li>
            <li>• Events block actions until resolved</li>
            <li>• Some events are triggered by your choices</li>
          </ul>
        </Section>

        <Tip>
          Read event descriptions carefully! The "safe" option isn't always the
          best choice. Sometimes risk pays off.
        </Tip>
      </PageWrapper>
    ),
  },

  // 10. ADVISORS
  {
    id: "advisors",
    title: "Advisors",
    category: "Advanced",
    icon: Users,
    color: "text-amber-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          NPCs that provide strategic bonuses. Each advisor has unique abilities
          and quotes!
        </p>

        <Section title="Advisor Abilities" icon={Star} iconColor="text-amber-400">
          <ul className="space-y-2 text-white/70 text-xs">
            <li className="flex items-start gap-2">
              <DollarSign size={12} className="text-green-400 mt-0.5" />
              <span><strong>Cost Reduction:</strong> Discounts on specific action types</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap size={12} className="text-cyan-400 mt-0.5" />
              <span><strong>Effect Boost:</strong> Increased outcomes for matching actions</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={12} className="text-purple-400 mt-0.5" />
              <span><strong>Critical Bonus:</strong> Higher crit chance for their specialty</span>
            </li>
          </ul>
        </Section>

        <Section title="How They Work" icon={Target} iconColor="text-cyan-400">
          <p className="text-white/60 text-xs">
            Advisors are assigned when you start a new game. Their bonuses
            automatically apply to matching actions. Check the Advisors panel to
            see your current team and their abilities.
          </p>
        </Section>

        <Tip>
          Match your strategy to your advisors! If you have a rally specialist,
          lean into rally-focused gameplay.
        </Tip>
      </PageWrapper>
    ),
  },

  // 11. CRITICAL HITS & STREAKS
  {
    id: "criticals",
    title: "Criticals & Streaks",
    category: "Advanced",
    icon: Sparkles,
    color: "text-amber-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Bonus systems that reward skillful play and lucky moments!
        </p>

        <Section title="Critical Hits" icon={Zap} iconColor="text-amber-400">
          <div className="space-y-2 text-white/70 text-xs">
            <p>
              <strong className="text-amber-400">8% base chance</strong> on every action for a critical
              hit.
            </p>
            <p>
              When you crit, all positive outcomes are multiplied by{" "}
              <strong className="text-amber-400">1.75x</strong>!
            </p>
            <p>
              The screen shakes, particles explode, and you hear a satisfying
              notification.
            </p>
          </div>
        </Section>

        <Section title="Action Streaks" icon={TrendingUp} iconColor="text-green-400">
          <div className="space-y-2 text-white/70 text-xs">
            <p>
              Consecutive successful actions build your streak counter.
            </p>
            <p>
              <strong className="text-green-400">Streak milestones (3, 5, 10)</strong> trigger bonus
              particle effects!
            </p>
            <p>
              High streaks earn bonus Legacy Points on victory.
            </p>
          </div>
        </Section>

        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-purple-400" />
            <span className="font-semibold text-purple-400 text-sm">First Action Bonus</span>
          </div>
          <p className="text-white/60 text-xs">
            Your first action each session gets a small boost. Start strong!
          </p>
        </div>

        <Tip>
          Advisors can boost your critical hit chance for specific actions. Stack
          these bonuses for massive hits!
        </Tip>
      </PageWrapper>
    ),
  },

  // 12. PRESTIGE SYSTEM
  {
    id: "prestige",
    title: "Prestige & Legacy",
    category: "Meta",
    icon: Award,
    color: "text-amber-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Meta-progression that persists across games. Win to earn Legacy Points!
        </p>

        <Section title="Legacy Points" icon={Star} iconColor="text-amber-400">
          <div className="space-y-2 text-white/70 text-xs">
            <p>Earned on every victory based on:</p>
            <ul className="space-y-1 ml-4">
              <li>• <strong>Base:</strong> 100 points for winning</li>
              <li>• <strong>Speed:</strong> Up to 100 for fast wins</li>
              <li>• <strong>Streak:</strong> 5 points per streak level</li>
              <li>• <strong>Criticals:</strong> 10 points per crit</li>
              <li>• <strong>Risk:</strong> Bonus for low ending risk</li>
            </ul>
          </div>
        </Section>

        <Section title="Prestige Upgrades" icon={Unlock} iconColor="text-purple-400">
          <p className="text-white/60 text-xs mb-2">
            Spend Legacy Points on permanent bonuses:
          </p>
          <ul className="space-y-1 text-white/70 text-xs">
            <li>• Extra starting Clout/Funds</li>
            <li>• Reduced action costs</li>
            <li>• Bonus critical hit chance</li>
            <li>• Faction loyalty boosts</li>
          </ul>
        </Section>

        <Tip>
          Access the Prestige panel from the gold star button in the header.
          Upgrades make future runs easier!
        </Tip>
      </PageWrapper>
    ),
  },

  // 13. DAILY CHALLENGES
  {
    id: "daily",
    title: "Daily Challenges",
    category: "Meta",
    icon: Calendar,
    color: "text-purple-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Fresh challenges every day with special rules and bonus rewards!
        </p>

        <Section title="How It Works" icon={Calendar} iconColor="text-purple-400">
          <ul className="space-y-2 text-white/70 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>New challenge generated each day at midnight</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Special constraints modify the rules (banned actions, limited resources, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Complete the goal to earn bonus Legacy Points</span>
            </li>
          </ul>
        </Section>

        <Section title="Difficulty Levels" icon={Target} iconColor="text-amber-400">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">Easy</span>
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded">Medium</span>
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">Hard</span>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Brutal</span>
          </div>
          <p className="text-white/50 text-xs mt-2">
            Higher difficulty = more constraints but bigger rewards!
          </p>
        </Section>

        <Tip>
          Access Daily Challenges from the calendar button in the header. Login
          streaks also give bonus rewards!
        </Tip>
      </PageWrapper>
    ),
  },

  // 14. MAP & STATES
  {
    id: "map",
    title: "The Map",
    category: "Interface",
    icon: MapPin,
    color: "text-cyan-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          The USA map shows your support level in each state. Hover for details!
        </p>

        <Section title="Support Colors" icon={MapPin} iconColor="text-cyan-400">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400"></div>
              <span className="text-white/60">0-19%: Negligible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-200"></div>
              <span className="text-white/60">20-39%: Emerging</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-400"></div>
              <span className="text-white/60">40-59%: Growing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-white/60">60-79%: Solid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-700"></div>
              <span className="text-white/60">80-100%: Dominant</span>
            </div>
          </div>
        </Section>

        <Section title="Key States" icon={Star} iconColor="text-amber-400">
          <p className="text-white/60 text-xs">
            Different factions have stronghold states where they're more
            influential. Target these for faction-specific strategies!
          </p>
        </Section>

        <Tip>
          States at 60%+ count as "controlled" for the Popular Mandate victory.
          Focus on getting states over this threshold!
        </Tip>
      </PageWrapper>
    ),
  },

  // 15. PRO TIPS
  {
    id: "tips",
    title: "Pro Tips",
    category: "Strategy",
    icon: Sparkles,
    color: "text-amber-400",
    content: (
      <PageWrapper>
        <p className="text-white/70">
          Master-level strategies to dominate the culture war!
        </p>

        <div className="space-y-3">
          <Tip>
            <strong>Early Game:</strong> Fundraise first! Build a war chest
            before making big moves.
          </Tip>

          <Tip>
            <strong>Risk Management:</strong> Stay below 50% risk in early game.
            The cost penalties compound quickly.
          </Tip>

          <Tip>
            <strong>Faction Focus:</strong> Faction Dominance (95% single
            faction) is often faster than Popular Mandate.
          </Tip>

          <Tip>
            <strong>Spin Strategy:</strong> Lock high-value reels and reroll for
            combo matches. 2x multipliers are worth the clout!
          </Tip>

          <Tip>
            <strong>Advisor Synergy:</strong> Check your advisors' bonuses and
            build your strategy around them.
          </Tip>

          <Tip>
            <strong>Event Choices:</strong> Sometimes the risky option is better.
            Read the descriptions carefully!
          </Tip>

          <Tip>
            <strong>Prestige First:</strong> Early upgrades like "Starting Clout +10"
            compound across all future runs.
          </Tip>
        </div>
      </PageWrapper>
    ),
  },
];

// ================================
// MAIN COMPONENT
// ================================

interface ComprehensiveTutorialProps {
  onClose?: () => void;
  startPage?: number;
}

const ComprehensiveTutorial: React.FC<ComprehensiveTutorialProps> = ({
  onClose,
  startPage = 0,
}) => {
  const { dispatch } = useGameContext();
  const [currentPage, setCurrentPage] = useState(startPage);

  const page = tutorialPages[currentPage];
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === tutorialPages.length - 1;

  const handleNext = useCallback(() => {
    if (!isLastPage) {
      setCurrentPage((p) => p + 1);
    }
  }, [isLastPage]);

  const handlePrev = useCallback(() => {
    if (!isFirstPage) {
      setCurrentPage((p) => p - 1);
    }
  }, [isFirstPage]);

  const handleClose = useCallback(() => {
    dispatch({ type: "DISMISS_TUTORIAL" });
    dispatch({ type: "COMPLETE_TUTORIAL_STEP", step: "WELCOME" });
    onClose?.();
  }, [dispatch, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleClose();
    },
    [handleNext, handlePrev, handleClose]
  );

  // Group pages by category for navigation
  const categories = [...new Set(tutorialPages.map((p) => p.category))];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      {/* Modal */}
      <motion.div
        className="relative max-w-2xl w-full max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 ${page.color}`}>
              <page.icon size={20} />
            </div>
            <div>
              <span className="text-xs text-white/40 uppercase tracking-wider">
                {page.category}
              </span>
              <h3 className="text-lg font-bold text-white">{page.title}</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Close tutorial"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={page.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {page.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Page indicators */}
        <div className="flex justify-center gap-1 py-3 border-t border-white/10 bg-black/20">
          {tutorialPages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPage
                  ? "bg-cyan-400 w-4"
                  : "bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={isFirstPage}
            className="gap-1 text-white/60 hover:text-white"
          >
            <ChevronLeft size={16} />
            Previous
          </Button>

          <span className="text-xs text-white/40">
            {currentPage + 1} / {tutorialPages.length}
          </span>

          {isLastPage ? (
            <Button
              size="sm"
              onClick={handleClose}
              className="gap-1 bg-cyan-500 hover:bg-cyan-400 text-white"
            >
              <Play size={16} />
              Start Playing
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="gap-1 text-white/60 hover:text-white"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ComprehensiveTutorial;
