/**
 * Fixed page atmosphere for marketing surfaces.
 * Nightlife discovery feel: charcoal stage, soft lights, grain, subtle venue photo wash.
 */
export function SiteAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[hsl(240_18%_4%)]" />

      {/* Soft venue photo wash — common on discovery apps */}
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-40 saturate-[0.9]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1800&q=60')",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_hsl(240_20%_4%_/_0.4)_0%,_hsl(240_18%_4%_/_0.55)_40%,_hsl(240_18%_4%_/_0.82)_100%)]" />

      <div className="beats-orb beats-orb-a absolute -left-[18%] -top-[22%] h-[78vmin] w-[78vmin] rounded-full bg-[radial-gradient(circle,_hsl(262_80%_52%_/_0.55)_0%,_transparent_68%)] blur-3xl" />
      <div className="beats-orb beats-orb-b absolute -right-[12%] top-[-8%] h-[62vmin] w-[62vmin] rounded-full bg-[radial-gradient(circle,_hsl(315_78%_48%_/_0.42)_0%,_transparent_70%)] blur-3xl" />
      <div className="beats-orb beats-orb-c absolute bottom-[-18%] left-[22%] h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(circle,_hsl(198_70%_42%_/_0.28)_0%,_transparent_70%)] blur-3xl" />

      <div className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,_hsl(262_65%_40%_/_0.25),_transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(to_top,_hsl(262_45%_12%_/_0.55)_0%,_transparent_80%)]" />

      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-soft-light"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_hsl(240_24%_2%_/_0.4)_100%)]" />
    </div>
  )
}
