import { useCallback, useEffect, useRef, useState } from "react";

const TYPE_SPEED = 80;
const DELETE_SPEED = 40;
const PAUSE_AFTER_TYPE = 2000;
const PAUSE_AFTER_DELETE = 400;

type UseTyperOptions = {
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseAfterType?: number;
  pauseAfterDelete?: number;
};

const defaultOptions: UseTyperOptions = {
  typeSpeed: TYPE_SPEED,
  deleteSpeed: DELETE_SPEED,
  pauseAfterType: PAUSE_AFTER_TYPE,
  pauseAfterDelete: PAUSE_AFTER_DELETE,
};

export default function useTyper(items: string[], options?: UseTyperOptions) {
  const [display, setDisplay] = useState(items[0]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [inView, setInView] = useState(false);
  const roleIdx = useRef(0);
  const charIdx = useRef(items[0].length);
  const deleting = useRef(true);

  // Attach this ref to the container element to gate the animation on visibility
  const observerRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry], obs) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) obs.disconnect();
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const tick = useCallback(() => {
    const role = items[roleIdx.current];
    if (!deleting.current) {
      charIdx.current++;
      setDisplay(role.slice(0, charIdx.current));
      if (charIdx.current === role.length) {
        deleting.current = true;
        return options?.pauseAfterType ?? defaultOptions.pauseAfterType;
      }
      return TYPE_SPEED + Math.random() * 40;
    } else {
      charIdx.current--;
      setDisplay(role.slice(0, charIdx.current));
      if (charIdx.current === 0) {
        deleting.current = false;
        roleIdx.current = (roleIdx.current + 1) % items.length;
        return options?.pauseAfterDelete ?? defaultOptions.pauseAfterDelete;
      }
      return options?.deleteSpeed ?? defaultOptions.deleteSpeed;
    }
  }, [
    items,
    options?.deleteSpeed,
    options?.pauseAfterDelete,
    options?.pauseAfterType,
  ]);

  useEffect(() => {
    if (!inView) return;
    let timeout: NodeJS.Timeout;
    function loop() {
      const delay = tick();
      timeout = setTimeout(loop, delay);
    }
    timeout = setTimeout(loop, 3000);
    return () => clearTimeout(timeout);
  }, [tick, inView]);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, [inView]);

  return { display, cursorVisible, ref: observerRef };
}
