import { useState } from "react";

const roles = [
  "Software Engineer",
  "Creative Developer",
  "CSS Enthusiast",
  "Frontend Developer",
  "Keyboard Hobbyist",
  "Coffee Fanatic",
  "Pickleball Noob",
];

export default function RoleTyper() {
  const [roleIndex, setRoleIndex] = useState(0);

  const role = roles[roleIndex];

  return (
    <div className="text-text flex flex-col items-center gap-4">
      <h1 className="hero">Hi, Iʼm Nick Kuek</h1>
      <div className="inline w-full">
        <div className="xs:min-w-[344px] xs:flex-row xs:items-start flex w-full flex-col items-center md:min-w-[473px] md:flex-row">
          <span className="subtitle">Iʼm a &nbsp;</span>
          <div
            className="subtitle relative inline-block"
            style={
              {
                // add 1 to account for period
                "--textLength": role.length + 1,
                "--typeSpeed": "4.5s",
              } as React.CSSProperties
            }
            onAnimationIteration={(event) => {
              if (event.animationName === "revealLetters") {
                setRoleIndex((prevIndex) => (prevIndex + 1) % roles.length);
              }
            }}
          >
            <span className="decoration-primary animate-type animate-revealLetters relative w-max font-(family-name:--font-source-code-pro) font-normal underline [clip-path:rect(auto_0_auto_auto)]">
              {role}.
            </span>
            <span className="absolute -top-[0.25em] right-0 -bottom-[0.25em] left-0 w-[0.125em] animate-[type_var(--typeSpeed)_steps(var(--textLength))_infinite,blink_var(--typeSpeed)_infinite] bg-teal-600 md:-top-[.35em] md:-bottom-[.35em]" />
          </div>
        </div>
      </div>
    </div>
  );
}
