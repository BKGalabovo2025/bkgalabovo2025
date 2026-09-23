"use client";

import React from "react";

interface SvgProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * 🏸 Векторна илюстрация: Елегантна совалка за бадминтон с градиенти
 */
export function BadmintonShuttlecockSvg({
  className = "size-12",
  primaryColor = "#F59E0B",
  secondaryColor = "#3B82F6",
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="shuttleGrad"
          x1="20"
          y1="20"
          x2="80"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.8" />
        </linearGradient>
        <radialGradient
          id="corkGrad"
          cx="50"
          cy="80"
          r="18"
          fx="45"
          fy="75"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </radialGradient>
      </defs>
      {/* Feathers */}
      <path
        d="M26 22 L40 68 L50 68 L36 18 Z"
        fill="url(#shuttleGrad)"
        opacity="0.85"
      />
      <path
        d="M38 18 L46 68 L54 68 L48 16 Z"
        fill="url(#shuttleGrad)"
        opacity="0.95"
      />
      <path
        d="M52 16 L54 68 L62 68 L64 18 Z"
        fill="url(#shuttleGrad)"
        opacity="0.95"
      />
      <path
        d="M64 18 L60 68 L70 68 L76 22 Z"
        fill="url(#shuttleGrad)"
        opacity="0.85"
      />
      {/* Stabilizer Ribbons */}
      <path
        d="M31 35 Q51 40 71 35"
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M36 50 Q51 54 66 50"
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Cork Head */}
      <path
        d="M40 70 Q40 88 50 88 Q60 88 60 70 Z"
        fill="url(#corkGrad)"
        stroke={primaryColor}
        strokeWidth="2"
      />
      <circle cx="50" cy="73" r="1.5" fill={primaryColor} />
    </svg>
  );
}

/**
 * 🏸 Векторна илюстрация: Преплетени ракети с перфорирана мрежа
 */
export function CrossedRacketsSvg({
  className = "size-16",
  primaryColor = "#F59E0B",
  secondaryColor = "#3B82F6",
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Racket - 45deg */}
      <g transform="rotate(28 60 60)">
        {/* Head Frame */}
        <ellipse
          cx="60"
          cy="30"
          rx="18"
          ry="24"
          stroke={primaryColor}
          strokeWidth="3"
          fill="none"
        />
        {/* Strings */}
        <line
          x1="48"
          y1="20"
          x2="48"
          y2="40"
          stroke={primaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="54"
          y1="12"
          x2="54"
          y2="48"
          stroke={primaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="60"
          y1="8"
          x2="60"
          y2="52"
          stroke={primaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="66"
          y1="12"
          x2="66"
          y2="48"
          stroke={primaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="72"
          y1="20"
          x2="72"
          y2="40"
          stroke={primaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="45"
          y1="24"
          x2="75"
          y2="24"
          stroke={primaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="43"
          y1="32"
          x2="77"
          y2="32"
          stroke={primaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="46"
          y1="40"
          x2="74"
          y2="40"
          stroke={primaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        {/* Shaft */}
        <line
          x1="60"
          y1="54"
          x2="60"
          y2="92"
          stroke={primaryColor}
          strokeWidth="2.5"
        />
        {/* Handle */}
        <rect
          x="58"
          y="92"
          width="4"
          height="24"
          rx="2"
          fill={secondaryColor}
          stroke={primaryColor}
          strokeWidth="1"
        />
      </g>

      {/* Right Racket - -45deg */}
      <g transform="rotate(-28 60 60)">
        <ellipse
          cx="60"
          cy="30"
          rx="18"
          ry="24"
          stroke={secondaryColor}
          strokeWidth="3"
          fill="none"
        />
        <line
          x1="48"
          y1="20"
          x2="48"
          y2="40"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="54"
          y1="12"
          x2="54"
          y2="48"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="60"
          y1="8"
          x2="60"
          y2="52"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="66"
          y1="12"
          x2="66"
          y2="48"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="72"
          y1="20"
          x2="72"
          y2="40"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="45"
          y1="24"
          x2="75"
          y2="24"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="43"
          y1="32"
          x2="77"
          y2="32"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="46"
          y1="40"
          x2="74"
          y2="40"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1="60"
          y1="54"
          x2="60"
          y2="92"
          stroke={secondaryColor}
          strokeWidth="2.5"
        />
        <rect
          x="58"
          y="92"
          width="4"
          height="24"
          rx="2"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}

/**
 * 🏃 Векторна илюстрация: Млад спортист в движение с ракета и динамични спирали
 */
export function KidsSportsDynamicSvg({
  className = "size-20",
  primaryColor = "#F59E0B",
  secondaryColor = "#3B82F6",
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="kidGrad"
          x1="0"
          y1="0"
          x2="160"
          y2="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
      {/* Motion swoosh lines */}
      <path
        d="M20 110 C45 125, 90 120, 140 90"
        stroke="url(#kidGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 6"
        opacity="0.7"
      />
      <path
        d="M30 95 C60 110, 110 100, 150 70"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Head */}
      <circle cx="85" cy="30" r="12" fill="url(#kidGrad)" />

      {/* Dynamic Torso & Running Arms */}
      <path
        d="M85 42 L80 75 L62 98 L50 94"
        stroke="url(#kidGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M80 75 L95 100 L115 110"
        stroke="url(#kidGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Front Racket Arm */}
      <path
        d="M83 50 L108 42 L128 26"
        stroke="url(#kidGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Back Balance Arm */}
      <path
        d="M80 52 L56 56 L44 68"
        stroke="url(#kidGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Badminton Racket in Hand */}
      <g transform="translate(124, 10) rotate(15)">
        <line
          x1="0"
          y1="16"
          x2="14"
          y2="0"
          stroke={primaryColor}
          strokeWidth="2.5"
        />
        <ellipse
          cx="20"
          cy="-6"
          rx="8"
          ry="12"
          stroke={primaryColor}
          strokeWidth="2"
          fill="none"
        />
      </g>

      {/* Flying Shuttlecock with stars */}
      <g transform="translate(138, 14) scale(0.6)">
        <polygon points="0,6 12,0 12,12" fill={primaryColor} />
        <circle
          cx="16"
          cy="6"
          r="4"
          fill="#FFFFFF"
          stroke={primaryColor}
          strokeWidth="1"
        />
      </g>
      <circle cx="35" cy="40" r="2.5" fill={primaryColor} />
      <polygon
        points="120,60 122,65 127,65 123,68 125,73 120,70 115,73 117,68 113,65 118,65"
        fill={primaryColor}
        opacity="0.8"
      />
    </svg>
  );
}

/**
 * 🌿 Векторна илюстрация: Златен лавров венец за официални грамоти
 */
export function LaurelWreathCrestSvg({
  className = "size-20",
  primaryColor = "#D97706",
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Branch */}
      <path
        d="M54 88 C40 85, 20 70, 18 42 C16 28, 26 15, 34 8"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Left Leaves */}
      <ellipse
        cx="22"
        cy="65"
        rx="5"
        ry="2.5"
        transform="rotate(-30 22 65)"
        fill={primaryColor}
      />
      <ellipse
        cx="17"
        cy="50"
        rx="6"
        ry="3"
        transform="rotate(-15 17 50)"
        fill={primaryColor}
      />
      <ellipse
        cx="18"
        cy="35"
        rx="6"
        ry="3"
        transform="rotate(10 18 35)"
        fill={primaryColor}
      />
      <ellipse
        cx="24"
        cy="22"
        rx="6"
        ry="3"
        transform="rotate(35 24 22)"
        fill={primaryColor}
      />
      <ellipse
        cx="32"
        cy="12"
        rx="5"
        ry="2.5"
        transform="rotate(55 32 12)"
        fill={primaryColor}
      />

      {/* Right Branch */}
      <path
        d="M66 88 C80 85, 100 70, 102 42 C104 28, 94 15, 86 8"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Right Leaves */}
      <ellipse
        cx="98"
        cy="65"
        rx="5"
        ry="2.5"
        transform="rotate(30 98 65)"
        fill={primaryColor}
      />
      <ellipse
        cx="103"
        cy="50"
        rx="6"
        ry="3"
        transform="rotate(15 103 50)"
        fill={primaryColor}
      />
      <ellipse
        cx="102"
        cy="35"
        rx="6"
        ry="3"
        transform="rotate(-10 102 35)"
        fill={primaryColor}
      />
      <ellipse
        cx="96"
        cy="22"
        rx="6"
        ry="3"
        transform="rotate(-35 96 22)"
        fill={primaryColor}
      />
      <ellipse
        cx="88"
        cy="12"
        rx="5"
        ry="2.5"
        transform="rotate(-55 88 12)"
        fill={primaryColor}
      />

      {/* Center Ribbon / Bow */}
      <path d="M52 86 Q60 92 68 86 Q60 84 52 86 Z" fill={primaryColor} />
      <circle
        cx="60"
        cy="86"
        r="3"
        fill="#FFFFFF"
        stroke={primaryColor}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * 🪷 Векторна илюстрация: Дзен лотос & вълни за Recovery Zone ваучери
 */
export function ZenWellnessLotusSvg({
  className = "size-16",
  primaryColor = "#10B981",
  secondaryColor = "#D97706",
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="lotusGrad"
          x1="50"
          y1="20"
          x2="50"
          y2="70"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
      </defs>
      {/* Gentle water ripples */}
      <path
        d="M15 68 Q50 72 85 68"
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M25 74 Q50 77 75 74"
        stroke={primaryColor}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Outer Lotus Petals */}
      <path
        d="M20 58 C25 45, 38 42, 50 62 C35 62, 24 60, 20 58 Z"
        fill="url(#lotusGrad)"
        opacity="0.8"
      />
      <path
        d="M80 58 C75 45, 62 42, 50 62 C65 62, 76 60, 80 58 Z"
        fill="url(#lotusGrad)"
        opacity="0.8"
      />

      {/* Mid Petals */}
      <path
        d="M30 52 C35 34, 46 32, 50 58 C40 58, 32 54, 30 52 Z"
        fill="url(#lotusGrad)"
        opacity="0.9"
      />
      <path
        d="M70 52 C65 34, 54 32, 50 58 C60 58, 68 54, 70 52 Z"
        fill="url(#lotusGrad)"
        opacity="0.9"
      />

      {/* Center Main Crown Petal */}
      <path
        d="M50 18 C44 32, 44 48, 50 60 C56 48, 56 32, 50 18 Z"
        fill="url(#lotusGrad)"
      />
      <circle cx="50" cy="24" r="2" fill={secondaryColor} />
    </svg>
  );
}
