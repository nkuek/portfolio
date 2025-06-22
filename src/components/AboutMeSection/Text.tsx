"use client";
import { useEffect, useRef, useState } from "react";

export default function AboutMeText() {
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  console.log();
  useEffect(() => {
    if (!textContainerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(textContainerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={textContainerRef}
      data-visible={visible}
      className="text-text-dark ease relative w-full grow self-end bg-[rgba(23,23,23,.95)] opacity-0 duration-700 md:transition-[opacity,translate] md:data-[visible=false]:translate-y-[15%] md:data-[visible=true]:opacity-100"
    >
      <div className="mx-auto grid w-full max-w-[1408px] gap-4 px-4 py-12 md:min-h-[35vh] md:grid-cols-3 md:gap-10 md:px-8 md:py-16">
        <div className="mb-6 flex flex-col gap-4 text-center md:text-left">
          <h2 className="hero">About Me</h2>
          <h3 className="text-2xl">An EMT turned Software Engineer</h3>
        </div>

        <p className="body">
          With the pandemic ravaging the country and burnout on my mind, I
          decided to make the tough decision to put my career in medicine on
          hold and dive head first into the world of programming. After
          attending App Academy, I can safely say this was the best decision
          Iʼve made.
        </p>
        <p className="body">
          By channeling the work ethic and interpersonal skills I gained as an
          EMT, I developed a passion for making the web a little more beautiful,
          which you will see in the projects Iʼve listed below. Outside of
          software engineering and medicine, I enjoy hiking, guitar, and
          building custom mechanical keyboards.
        </p>
      </div>
    </div>
  );
}
