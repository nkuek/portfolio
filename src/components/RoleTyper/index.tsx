import { useState } from "react";

const roles = [
  "Software Engineer",
  "Creative Developer",
  "CSS Enthusiast",
  "Keyboard Hobbyist",
  "Frontend Developer",
  "Coffee Fanatic",
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
          <span
            onAnimationIteration={(event) => {
              if (
                event.animationName === "type" &&
                event.pseudoElement === "::before"
              ) {
                const newIdx = roleIndex + 1;
                setRoleIndex(newIdx % roles.length);
              }
            }}
            style={
              {
                // add 1 to account for period
                "--textLength": role.length + 1,
                "--typeSpeed": "4.5s",
              } as React.CSSProperties
            }
            className="subtitle decoration-primary before:grainy-background-opaque relative w-max font-[family-name:var(--font-source-code-pro)] font-normal underline before:absolute before:top-[-.25em] before:right-0 before:bottom-[-.25em] before:left-0 before:animate-[type_var(--typeSpeed)_steps(var(--textLength))_infinite] after:absolute after:top-[-.25em] after:right-0 after:bottom-[-.25em] after:left-0 after:w-[0.125em] after:animate-[type_var(--typeSpeed)_steps(var(--textLength))_infinite,blink_var(--typeSpeed)_infinite] after:bg-teal-600 before:md:top-[-.35em] before:md:bottom-[-.35em] after:md:top-[-.35em] after:md:bottom-[-.35em]"
          >
            {role}.
          </span>
        </div>
      </div>
    </div>
  );
}
