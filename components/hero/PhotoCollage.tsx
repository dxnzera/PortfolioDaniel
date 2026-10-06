import Image from "next/image";
import StoryObjects from "./StoryObjects";

type PhotoCollageProps = {
  className?: string;
  decorative?: boolean;
  eager?: boolean;
  sizes?: string;
};

export default function PhotoCollage({
  className = "",
  decorative = false,
  eager = false,
  sizes = "(max-width: 767px) 180px, 28vw",
}: PhotoCollageProps) {
  return (
    <div className={`story-collage ${className}`.trim()} aria-hidden={decorative || undefined}>
      <div className="polaroid-arrival">
        <figure className="story-polaroid">
          <div className="polaroid-photo">
            <Image src="/images/daniel.jpeg" alt={decorative ? "" : "Daniel Mendes"} width={747} height={1054} loading={eager ? "eager" : "lazy"} sizes={sizes} />
          </div>
          <StoryObjects />
          <figcaption>
            <Image className="polaroid-signature" src="/images/DanielMendesLogoPreta.png" alt="" width={815} height={526} />
            <span>Brasil</span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
