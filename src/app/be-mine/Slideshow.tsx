"use client";

import { useState, useEffect, useRef } from "react";
import Image, { StaticImageData } from "next/image";

import img1 from "./_assets/20241019_153222.jpg";
import img2 from "./_assets/20241019_155033.jpg";
import img3 from "./_assets/20241019_155534.jpg";
import img4 from "./_assets/20241019_170409.jpg";
import img5 from "./_assets/20250314_133738.jpg";
import img6 from "./_assets/20250329_104337.jpg";
import img7 from "./_assets/20250329_104413.jpg";
import img8 from "./_assets/IMG_9866.jpg";
import img9 from "./_assets/FullSizeRender.jpg";
import img10 from "./_assets/IMG_0353.jpg";
import img11 from "./_assets/IMG_8837.jpg";
import img12 from "./_assets/IMG_9111.jpg";
import img13 from "./_assets/IMG_9130.jpg";
import img14 from "./_assets/IMG_9137.jpg";
import img15 from "./_assets/IMG_9143.jpg";
import img16 from "./_assets/IMG_9257.jpg";
import img17 from "./_assets/IMG_9292.jpg";
import img18 from "./_assets/BreJanePhotography-Mercury-Maui-Moon-Dream-Lally-Events-Day1-23.jpg";

const slides: StaticImageData[] = [
  img1,
  img2,
  img3,
  img4,
  img5,
  img6,
  img7,
  img8,
  img9,
  img10,
  img11,
  img12,
  img13,
  img14,
  img15,
  img16,
  img17,
  img18,
];

const INTERVAL = Math.round(60000 / 23);

export default function Slideshow({ playing = false }: { playing?: boolean }) {
  const [current, setCurrent] = useState(0);

  const isFirstSlideRef = useRef(true);

  useEffect(() => {
    if (!playing) return;

    // Extra 2 beats at 92 BPM only on the very first slide
    const extraHold = isFirstSlideRef.current
      ? Math.round((60000 / 92) * 2)
      : 0;
    isFirstSlideRef.current = false;

    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, INTERVAL + extraHold);
    return () => clearTimeout(timer);
  }, [playing, current]);

  return (
    <div className="relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl sm:max-w-sm">
      {slides.map((src, i) => (
        <Image
          key={i}
          src={src}
          alt={`Slideshow photo ${i + 1}`}
          fill
          className={`object-cover transition-opacity duration-200 ease-in-out ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
          priority={i === 0}
        />
      ))}
    </div>
  );
}
