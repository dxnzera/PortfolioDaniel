import { useId } from "react";

export default function StoryObjects() {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const brushId = `story-brush-${instanceId}`;
  const orbitId = `story-orbit-${instanceId}`;
  const brushEdge = `url(#${brushId})`;

  return (
    <div className="story-objects" aria-hidden="true">
      <svg className="story-brush-definitions" width="0" height="0" focusable="false">
        <defs>
          <filter id={brushId} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.075" numOctaves="2" seed="17" stitchTiles="stitch" result="paint-grain" />
            <feDisplacementMap in="SourceGraphic" in2="paint-grain" scale="1.35" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <svg className="story-object sticker-smile" viewBox="0 0 136 112" focusable="false" fill="currentColor">
        <g filter={brushEdge}>
          <path d="M13 9C22 12 34 27 47 36L45 41C36 37 25 28 16 22L11 13Z" />
          <path d="M47 8L51 11C43 22 31 35 18 42L13 39C24 29 33 18 47 8Z" />
          <path d="M78 7C88 11 102 23 115 32L111 38C101 35 90 26 81 21L75 11Z" />
          <path d="M112 5L117 8C109 20 97 32 83 38L79 34C91 23 99 13 112 5Z" />
          <path d="M12 57C27 82 52 94 75 93C98 91 115 78 124 52L126 52C123 70 115 88 98 98C75 113 43 105 26 88C18 78 13 66 12 57Z" />
          <path d="M126 45L130 49L128 54L125 51Z" />
        </g>
      </svg>

      <svg className="story-object sticker-spark" viewBox="0 0 120 120" focusable="false" fill="currentColor">
        <g filter={brushEdge}>
          <path d="M55 3L64 38L88 15L77 45L117 49L82 61L109 91L77 78L70 118L56 82L27 107L40 75L3 72L37 58L10 27L45 41Z" />
          <path d="M93 7L97 8L96 14L92 12Z" />
          <path d="M7 88L12 86L14 90L10 94Z" />
        </g>
      </svg>

      <svg className="story-object sticker-orbit" viewBox="0 0 160 160" focusable="false" fill="currentColor">
        <defs><path id={orbitId} d="M17 80a63 63 0 1 1 126 0a63 63 0 1 1-126 0" /></defs>
        <text>
          <textPath href={`#${orbitId}`} textLength="392" lengthAdjust="spacing">DESIGNER · DESENVOLVEDOR · DANIEL MENDES · </textPath>
        </text>
        <g filter={brushEdge}>
          <path fillRule="evenodd" d="M79 54C95 54 106 66 105 81C105 98 92 107 77 105C63 104 53 92 55 78C56 63 66 54 79 54ZM79 59C67 59 60 68 59 79C58 91 66 99 78 100C90 101 100 93 100 80C100 67 91 59 79 59Z" />
          <path d="M67 96C72 86 85 69 94 63L96 67C89 78 79 91 70 99Z" />
        </g>
      </svg>

      <svg className="story-object sticker-code" viewBox="0 0 184 132" focusable="false" fill="currentColor">
        <g filter={brushEdge}>
          <path d="M62 14C50 30 34 47 15 65C29 79 43 88 59 99L57 105C38 99 20 89 5 77L2 66C17 49 39 29 62 14Z" />
          <path d="M109 4C103 31 96 53 88 78C82 97 75 115 66 127L61 123C67 101 74 82 80 62C88 38 97 17 109 4Z" />
          <path d="M126 17C145 32 166 49 181 65L179 77C166 87 146 97 128 103L122 99C138 87 150 78 165 68C151 52 137 39 126 17Z" />
          <path d="M66 128L70 128L69 132L65 131Z" />
          <path d="M170 88L177 87L180 91L173 94Z" />
        </g>
      </svg>

    </div>
  );
}
