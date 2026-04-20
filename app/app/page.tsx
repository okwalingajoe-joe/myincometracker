"use client"

import useEmblaCarousel from "embla-carousel-react"
import { Coins, HandHeart, LineChart, Scale, Sprout } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { DailyIncomeTab } from "@/components/tracker/daily-income-tab"
import { GivingTab } from "@/components/tracker/giving-tab"
import { InvestmentsTab } from "@/components/tracker/investments-tab"
import { NetWorthTab } from "@/components/tracker/net-worth-tab"
import { StreamsTab } from "@/components/tracker/streams-tab"

const TABS = [
  { id: "daily", label: "Daily income", icon: Coins },
  { id: "giving", label: "Giving", icon: HandHeart },
  { id: "streams", label: "Streams", icon: LineChart },
  { id: "networth", label: "Net worth", icon: Scale },
  { id: "investments", label: "Investments", icon: Sprout },
] as const

export default function TrackerPage() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
  })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Tab pills — horizontally scrollable on small screens */}
      <nav
        aria-label="Tracker sections"
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {TABS.map((tab, i) => {
          const Icon = tab.icon
          const active = i === selected
          return (
            <button
              key={tab.id}
              onClick={() => scrollTo(i)}
              className={cn(
                "group flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "border-white/40 bg-white/40 text-foreground/80 backdrop-blur-xl hover:bg-white/60",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Swipeable carousel */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          <section className="min-w-0 flex-[0_0_100%] pr-1">
            <DailyIncomeTab />
          </section>
          <section className="min-w-0 flex-[0_0_100%] pr-1">
            <GivingTab />
          </section>
          <section className="min-w-0 flex-[0_0_100%] pr-1">
            <StreamsTab />
          </section>
          <section className="min-w-0 flex-[0_0_100%] pr-1">
            <NetWorthTab />
          </section>
          <section className="min-w-0 flex-[0_0_100%] pr-1">
            <InvestmentsTab />
          </section>
        </div>
      </div>

      {/* Dot indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => scrollTo(i)}
            aria-label={`Go to ${tab.label}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === selected ? "w-6 bg-primary" : "w-1.5 bg-foreground/20",
            )}
          />
        ))}
      </div>
    </div>
  )
}
