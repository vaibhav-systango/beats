/**
 * Soft pastel atmosphere for marketing surfaces (light + dark).
 */
export function SiteAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />
      <div className="beats-grid-bg absolute inset-0 opacity-70 dark:opacity-40" />

      <div className="beats-orb beats-orb-a absolute -left-[20%] -top-[28%] h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(circle,_hsl(320_90%_70%_/_0.22)_0%,_transparent_68%)] blur-3xl dark:bg-[radial-gradient(circle,_hsl(320_90%_50%_/_0.28)_0%,_transparent_68%)]" />
      <div className="beats-orb beats-orb-b absolute -right-[10%] top-[-12%] h-[58vmin] w-[58vmin] rounded-full bg-[radial-gradient(circle,_hsl(280_80%_70%_/_0.2)_0%,_transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,_hsl(280_80%_55%_/_0.25)_0%,_transparent_70%)]" />
      <div className="beats-orb beats-orb-c absolute bottom-[-20%] left-[28%] h-[64vmin] w-[64vmin] rounded-full bg-[radial-gradient(circle,_hsl(190_75%_65%_/_0.18)_0%,_transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,_hsl(190_70%_45%_/_0.2)_0%,_transparent_70%)]" />

      <div className="absolute inset-x-0 top-0 h-[48%] bg-[radial-gradient(ellipse_80%_60%_at_70%_0%,_hsl(320_90%_80%_/_0.35),_transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_70%_0%,_hsl(320_70%_40%_/_0.22),_transparent_70%)]" />
    </div>
  )
}
