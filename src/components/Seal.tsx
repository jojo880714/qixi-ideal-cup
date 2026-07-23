import type { PersonaSeal } from "@/data/personas";

interface SealProps {
  seal: PersonaSeal;
  /** 印章上色，一律用該型 ink。 */
  color: string;
  size: number;
  /**
   * "stamp" = 含外框 rounded rect（結果卡右上／海報蓋章）；
   * "mark"  = 只有幾何 path，無外框（海報巨型浮水印）。
   */
  variant?: "stamp" | "mark";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 八派系幾何印章。path 座標系為 viewBox 0 0 64 64（見 personas.ts seal）。
 * stroke 3.5 / round cap，縮放至 20px 仍可辨識。
 */
export function Seal({ seal, color, size, variant = "stamp", className, style }: SealProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={style}
      role="img"
      aria-label={seal.meaning}
    >
      {variant === "stamp" && (
        <rect x="3" y="3" width="58" height="58" rx="14" stroke={color} strokeWidth="2.5" />
      )}
      <path d={seal.d1} stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {seal.d2 && (
        <path d={seal.d2} stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
