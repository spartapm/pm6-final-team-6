import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

/** SVG 일러스트 공통 래퍼 (next/image) */
export default function Illustration({
  src,
  alt = "",
  width = 120,
  height = 120,
  className = "",
  priority,
}: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
