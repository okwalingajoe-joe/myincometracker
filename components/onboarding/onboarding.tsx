"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LogoLockup, LogoMark } from "@/components/brand/logo"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Illustrations — custom SVGs, designed to read at a glance on mobile.      */
/* -------------------------------------------------------------------------- */

function WelcomeArt() {
  return (
    <svg viewBox="0 0 240 180" className="h-40 w-full sm:h-48" aria-hidden>
      <defs>
        <linearGradient id="coin-a" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {/* Stacked coins */}
      <g className="text-primary" stroke="currentColor" strokeWidth="2.25" fill="url(#coin-a)">
        <ellipse cx="120" cy="130" rx="56" ry="14" />
        <rect x="64" y="108" width="112" height="22" rx="11" fill="url(#coin-a)" />
        <ellipse cx="120" cy="108" rx="56" ry="14" fill="currentColor" fillOpacity="0.1" />
        <rect x="72" y="86" width="96" height="22" rx="11" fill="url(#coin-a)" />
        <ellipse cx="120" cy="86" rx="48" ry="12" fill="currentColor" fillOpacity="0.14" />
        <rect x="82" y="66" width="76" height="20" rx="10" fill="url(#coin-a)" />
        <ellipse cx="120" cy="66" rx="38" ry="10" fill="currentColor" fillOpacity="0.18" />
      </g>
      {/* Top coin face with logo mark */}
      <g transform="translate(120 66)" className="text-primary">
        <circle r="20" fill="currentColor" />
        <g transform="translate(-10 -10) scale(0.83)" className="text-primary-foreground" stroke="currentColor" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.25" />
          <path d="M7.25 14.5 L10.25 11.25 L12.75 13 L16.5 8.75" />
          <circle cx="16.5" cy="8.75" r="1.35" fill="currentColor" stroke="none" />
        </g>
      </g>
      {/* Sparkles */}
      <g className="text-accent" fill="currentColor">
        <circle cx="46" cy="48" r="3" />
        <circle cx="200" cy="54" r="2.5" />
        <circle cx="186" cy="26" r="2" />
        <circle cx="58" cy="24" r="2" />
      </g>
    </svg>
  )
}

function TrackArt() {
  return (
    <svg viewBox="0 0 240 180" className="h-40 w-full sm:h-48" aria-hidden>
      {/* Phone body */}
      <g className="text-foreground/80" stroke="currentColor" strokeWidth="2" fill="none">
        <rect x="72" y="20" width="96" height="150" rx="18" fill="var(--card)" />
        <rect x="78" y="26" width="84" height="138" rx="14" fill="currentColor" fillOpacity="0.04" />
      </g>
      {/* Header pill */}
      <g className="text-primary">
        <rect x="86" y="34" width="68" height="10" rx="5" fill="currentColor" fillOpacity="0.18" />
        <rect x="86" y="50" width="44" height="6" rx="3" fill="currentColor" fillOpacity="0.35" />
      </g>
      {/* Entry rows */}
      <g>
        <rect x="86" y="68" width="68" height="22" rx="6" fill="var(--card)" stroke="var(--border)" />
        <rect x="92" y="74" width="10" height="10" rx="5" className="text-primary" fill="currentColor" />
        <rect x="106" y="76" width="30" height="3" rx="1.5" className="text-foreground/70" fill="currentColor" />
        <rect x="106" y="82" width="18" height="3" rx="1.5" className="text-muted-foreground" fill="currentColor" />
      </g>
      <g>
        <rect x="86" y="94" width="68" height="22" rx="6" fill="var(--card)" stroke="var(--border)" />
        <rect x="92" y="100" width="10" height="10" rx="5" className="text-accent" fill="currentColor" />
        <rect x="106" y="102" width="26" height="3" rx="1.5" className="text-foreground/70" fill="currentColor" />
        <rect x="106" y="108" width="14" height="3" rx="1.5" className="text-muted-foreground" fill="currentColor" />
      </g>
      <g>
        <rect x="86" y="120" width="68" height="22" rx="6" fill="var(--card)" stroke="var(--border)" />
        <rect x="92" y="126" width="10" height="10" rx="5" className="text-primary" fill="currentColor" />
        <rect x="106" y="128" width="22" height="3" rx="1.5" className="text-foreground/70" fill="currentColor" />
        <rect x="106" y="134" width="16" height="3" rx="1.5" className="text-muted-foreground" fill="currentColor" />
      </g>
      {/* Plus FAB */}
      <g className="text-primary">
        <circle cx="188" cy="150" r="14" fill="currentColor" />
        <path d="M182 150h12M188 144v12" stroke="var(--primary-foreground)" strokeWidth="2.25" strokeLinecap="round" />
      </g>
      {/* Coins flying in */}
      <g className="text-accent" fill="currentColor">
        <circle cx="38" cy="60" r="7" />
        <circle cx="26" cy="90" r="5" />
        <circle cx="46" cy="120" r="4" />
      </g>
    </svg>
  )
}

function InsightsArt() {
  return (
    <svg viewBox="0 0 240 180" className="h-40 w-full sm:h-48" aria-hidden>
      {/* Card */}
      <rect x="24" y="28" width="192" height="124" rx="18" fill="var(--card)" stroke="var(--border)" />
      {/* Header */}
      <rect x="40" y="46" width="90" height="8" rx="4" className="text-foreground/80" fill="currentColor" />
      <rect x="40" y="60" width="58" height="6" rx="3" className="text-muted-foreground" fill="currentColor" />
      {/* Pie */}
      <g transform="translate(178 86)">
        <circle r="28" fill="var(--muted)" />
        <path d="M0 -28 A28 28 0 0 1 26.6 -8.66 L0 0 Z" className="text-primary" fill="currentColor" />
        <path d="M26.6 -8.66 A28 28 0 0 1 8.66 26.6 L0 0 Z" className="text-accent" fill="currentColor" />
        <circle r="12" fill="var(--card)" />
      </g>
      {/* Bars */}
      <g transform="translate(40 92)">
        {[26, 42, 18, 50, 34, 60, 46].map((h, i) => (
          <rect
            key={i}
            x={i * 14}
            y={60 - h}
            width="9"
            height={h}
            rx="3"
            className={i % 2 === 0 ? "text-primary" : "text-primary/60"}
            fill="currentColor"
          />
        ))}
      </g>
      {/* Legend dots */}
      <g transform="translate(40 140)">
        <circle cx="0" cy="0" r="3" className="text-primary" fill="currentColor" />
        <rect x="8" y="-2" width="30" height="4" rx="2" className="text-muted-foreground" fill="currentColor" />
        <circle cx="56" cy="0" r="3" className="text-accent" fill="currentColor" />
        <rect x="64" y="-2" width="28" height="4" rx="2" className="text-muted-foreground" fill="currentColor" />
      </g>
    </svg>
  )
}

function PrivacyArt() {
  return (
    <svg viewBox="0 0 240 180" className="h-40 w-full sm:h-48" aria-hidden>
      {/* Shield */}
      <g className="text-primary">
        <path
          d="M120 22 L188 46 V96 C188 132 158 156 120 166 C82 156 52 132 52 96 V46 Z"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
      </g>
      {/* Lock body */}
      <g transform="translate(120 98)" className="text-primary">
        <rect x="-26" y="-6" width="52" height="40" rx="8" fill="currentColor" />
        <rect x="-18" y="-28" width="36" height="28" rx="14" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="0" cy="10" r="4" className="text-primary-foreground" fill="currentColor" />
        <rect x="-1.5" y="10" width="3" height="12" rx="1.5" className="text-primary-foreground" fill="currentColor" />
      </g>
      {/* Dashed orbit */}
      <circle
        cx="120"
        cy="94"
        r="70"
        fill="none"
        className="text-accent"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 6"
        opacity="0.55"
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  Slide data                                                                */
/* -------------------------------------------------------------------------- */

type Slide = {
  art: () => React.ReactNode
  eyebrow: string
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    art: WelcomeArt,
    eyebrow: "Welcome",
    title: "Meet MyIncomeTracker",
    body: "A warm, mobile-first place to watch every shilling you earn, give, save and grow — all in one quiet app.",
  },
  {
    art: TrackArt,
    eyebrow: "Capture",
    title: "Log income the moment it lands",
    body: "Salary, wage, commission, Mobile Money, cash, gifts — a few taps and it's saved, organised by source and date.",
  },
  {
    art: InsightsArt,
    eyebrow: "Understand",
    title: "See your whole money picture",
    body: "Daily income, giving, expected vs received streams, net worth and investments — one glance tells the full story.",
  },
  {
    art: PrivacyArt,
    eyebrow: "Yours alone",
    title: "Private, secure, free forever",
    body: "Your entries are tied to your account only. No ads, no selling data, no card required — ever.",
  },
]

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function Onboarding() {
  const router = useRouter()
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, align: "start" })
  const [index, setIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!embla) return
    setIndex(embla.selectedScrollSnap())
  }, [embla])

  useEffect(() => {
    if (!embla) return
    embla.on("select", onSelect)
    onSelect()
    return () => {
      embla.off("select", onSelect)
    }
  }, [embla, onSelect])

  const scrollTo = useCallback(
    (i: number) => embla?.scrollTo(i),
    [embla],
  )
  const prev = () => embla?.scrollPrev()
  const next = () => embla?.scrollNext()

  const isLast = index === SLIDES.length - 1

  return (
    <main className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-8 pt-5 sm:pt-8">
      {/* Top bar: brand + skip */}
      <div className="flex items-center justify-between">
        <LogoLockup size="sm" />
        <Link
          href="/auth/sign-up"
          className="rounded-full px-3 py-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          Skip
        </Link>
      </div>

      {/* Carousel viewport */}
      <div className="mt-6 flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {SLIDES.map((slide, i) => {
            const Art = slide.art
            return (
              <div
                key={i}
                className="flex h-full min-w-0 shrink-0 grow-0 basis-full flex-col items-center justify-center gap-8 px-2"
              >
                <div className="glass-strong flex w-full items-center justify-center rounded-3xl p-6 sm:p-8">
                  <Art />
                </div>

                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                    {slide.eyebrow}
                  </p>
                  <h2 className="mt-2 text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                    {slide.title}
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {slide.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots */}
      <div
        className="mt-6 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Onboarding progress"
      >
        {SLIDES.map((_, i) => {
          const active = i === index
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                active ? "w-8 bg-primary" : "w-2 bg-foreground/20 hover:bg-foreground/35",
              )}
            />
          )
        })}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous slide"
          className="h-11 w-11 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Button>

        {isLast ? (
          <Button
            asChild
            size="lg"
            className="h-11 flex-1 rounded-full shadow-lg shadow-primary/30"
          >
            <Link href="/auth/sign-up">
              Get started <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={next}
            className="h-11 flex-1 rounded-full shadow-lg shadow-primary/30"
          >
            Next <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        )}

        <span aria-hidden className="inline-flex h-11 w-11 items-center justify-center">
          <LogoMark className="h-5 w-5 text-primary/60" title="" />
        </span>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  )
}
