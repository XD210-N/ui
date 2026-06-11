import { projectMockVariants } from "../content";

function MockBlock({ type }: { type: string }) {
  const base = "absolute rounded-full bg-white/65";
  const className = {
    "mock-nav": "left-[10%] top-[12%] h-[10%] w-[80%]",
    "mock-title": "left-[13%] top-[34%] h-[12%] w-[44%]",
    "mock-row": "bottom-[18%] left-[13%] h-[18%] w-[72%]",
    "mock-side": "left-[8%] top-[12%] h-[76%] w-[20%] rounded-2xl",
    "mock-content": "right-[9%] top-[18%] h-[62%] w-[56%] rounded-[18px]",
    "mock-phone": "left-[15%] top-[12%] h-[76%] w-[26%] rounded-[24px]",
    "mock-lines": "right-[13%] top-[22%] h-[48%] w-[38%] rounded-[18px]",
    "mock-card-a": "left-[11%] top-[18%] h-[58%] w-[34%] rounded-[20px]",
    "mock-card-b": "right-[11%] top-[24%] h-[48%] w-[34%] rounded-[20px]",
    "mock-dashboard": "left-[10%] top-[14%] h-[72%] w-[80%] rounded-[20px]",
  }[type] ?? "";
  return <div className={base + " " + className} />;
}

export function ProjectPreview({ index }: { index: number }) {
  const variant = projectMockVariants[index % projectMockVariants.length]!;
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-[18px] border border-black/6 shadow-[0_14px_28px_rgba(15,18,24,0.06),inset_0_1px_0_rgba(255,255,255,0.88)]"
      style={{ background: variant.screen }}
    >
      {variant.blocks.map((block) => <MockBlock key={block} type={block} />)}
    </div>
  );
}
