import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import styles from "./Scrollbar.module.css";

interface ScrollbarOptions {
  direction: "horizontal" | "vertical";
  alwaysVisible?: boolean;
  isContentDraggable?: boolean;
  minThumbSize?: number;
}

interface ScrollbarProps {
  options: ScrollbarOptions;
  contentRef: any;
}

interface visibilityState {
  thumbVisible: boolean;
  scrollbarVisible: boolean;
}

type dirProps = {
  [key in "horizontal" | "vertical"]: {
    clientPos: "clientY" | "clientX";
    pos: "left" | "top";
    size:"width" | "height";
    scrollPos: "scrollLeft" | "scrollTop";
    scrollSize: "scrollWidth" | "scrollHeight";
    clientSize: "clientWidth" | "clientHeight";
    offsetSize: "offsetWidth" | "offsetHeight";
  };
};

const dirProps: dirProps = {
  horizontal: {
    clientPos: "clientX",
    pos: "left",
    size: "width",
    scrollPos: "scrollLeft",
    scrollSize: "scrollWidth",
    clientSize:"clientWidth",
    offsetSize:"offsetWidth"
  },
  vertical: {
    clientPos: "clientY",
    pos: "top",
    size:"height",
    scrollPos: "scrollTop",
    scrollSize: "scrollHeight",
    clientSize:"clientHeight",
    offsetSize:"offsetHeight"
  },
};

const handleVisibility = (state: visibilityState, action: string) => {
  switch (action) {
    case "SCROLLBAR_VISIBLE":
      state.scrollbarVisible = true;
      state.thumbVisible = true;
      break;
    case "SCROLLBAR_HIDDEN":
      state.scrollbarVisible = false;
      state.thumbVisible = false;
      break;
    case "THUMB_HIDDEN":
      state.scrollbarVisible = true;
      state.thumbVisible = false;
      break;
    default:
      state.scrollbarVisible = true;
      state.thumbVisible = true;
  }
  return state;
};

const Scrollbar: React.FC<ScrollbarProps> = (props: ScrollbarProps) => {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const {
    direction,
    minThumbSize = 20,
    isContentDraggable = true,
    alwaysVisible = false,
  } = props.options;

  const { pos, size, clientPos, scrollPos, scrollSize, clientSize, offsetSize } =
    dirProps[direction];

  const [thumbSize, setThumbSize] = useState(minThumbSize);
  const [scrollStartPosition, setScrollStartPosition] = useState(0);

  const [visibility, setVisibility] = useReducer(handleVisibility, {
    thumbVisible: false,
    scrollbarVisible: false,
  });

  const [initialScrollPos, setInitialScrollPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [isContentDragging, setIsContentDragging] = useState(false);
  const [prevPos, setPrevPos] = useState(0);

  const positionThumb = () => {
    if (props.contentRef.current && scrollTrackRef.current) {
      const { [scrollPos]: contentPos, [scrollSize]: contentSize } =
        props.contentRef.current;
      const { [clientSize]: trackSize } = scrollTrackRef.current;
      let thumbPos = (+contentPos / +contentSize) * trackSize;
      thumbPos = Math.min(thumbPos, trackSize - thumbSize);
      scrollThumbRef.current!.style[pos] = `${thumbPos}px`;
    }
  };

  function handleResize() {
    if (props.contentRef.current && scrollTrackRef.current) {
      positionThumb();
      const { [clientSize]:clientS, [scrollSize]:scrollS } = props.contentRef.current;
      const { [clientSize]: trackSize } = scrollTrackRef.current;
      if (!alwaysVisible && clientS >= scrollS) {
        setVisibility("SCROLLBAR_HIDDEN");
      } else if (alwaysVisible && clientS >= scrollS) {
        setVisibility("THUMB_HIDDEN");
      } else {
        setVisibility("SCROLLBAR_VISIBLE");
      }
      setThumbSize(
        Math.max((clientS / scrollS) * trackSize, minThumbSize)
      );
    }
  }

  useEffect(() => {
    if (props.contentRef.current && scrollTrackRef.current) {
      const ref = props.contentRef.current;
      observer.current = new ResizeObserver(() => {
        handleResize();
      });
      observer.current?.observe(ref);
      ref.addEventListener("scroll", handleThumbPosition);
      window.addEventListener("resize", handleResize);
      return () => {
        observer.current?.unobserve(ref);
        ref.removeEventListener("scroll", handleThumbPosition);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [props.contentRef.current?.getBoundingClientRect()]);

  const handleThumbPosition = useCallback(() => {
    if (props.contentRef.current && scrollTrackRef.current) {
      positionThumb();
    }
  }, [thumbSize]);

  const handleTrackClick = useCallback(
    (e: any) => {
      const { current: trackCurrent } = scrollTrackRef;
      const { current: contentCurrent } = props.contentRef;
      if (trackCurrent && contentCurrent) {
        const clientPosition = e[clientPos];
        const target = e.target as HTMLDivElement;
        const trackPos = target.getBoundingClientRect()[pos];
        const thumbOffset = -(thumbSize / 2);
        const clickRatio =
          (clientPosition - trackPos + thumbOffset) / trackCurrent[clientSize];
        const scrollAmount = Math.floor(
          clickRatio * contentCurrent[scrollSize]
        );
        contentCurrent.scrollTo({
          [pos]: scrollAmount,
          behavior: "smooth",
        });
      }
    },
    [thumbSize]
  );

  const handleContentMove = useCallback(
    (e: any) => {
      if (isContentDragging) {
        const delta = (e[clientPos] ?? e.touches[0][clientPos]) - prevPos;
        props.contentRef.current[scrollPos] -= delta;
        setPrevPos(e[clientPos] ?? e.touches[0][clientPos]);
      }
    },
    [isContentDragging, prevPos]
  );

  const handleContentBegin = useCallback((e: any) => {
    setIsContentDragging(true);
    setPrevPos(e[clientPos] ?? e.touches[0][clientPos]);
  }, []);

  const handleContentEnd = useCallback(
    (e: any) => {
      if (isContentDragging) {
        setIsContentDragging(false);
      }
    },
    [isContentDragging]
  );

  const handleThumbBegin = useCallback((e: any) => {
    setScrollStartPosition(e[clientPos] ?? e.touches[0][clientPos]);
    setInitialScrollPos(props.contentRef.current![scrollPos]);
    setIsDragging(true);
  }, []);

  const handleThumbEnd = useCallback(
    (e: any) => {
      if (isDragging) {
        setIsDragging(false);
      }
    },
    [isDragging]
  );

  const handleThumbMove = useCallback(
    (e: any) => {
      if (isDragging) {
        const {
          [scrollSize]: contentScrollSize,
          [offsetSize]: contentOffsetSize,
        } = props.contentRef.current;
        const deltaX =
          ((e[clientPos] ?? e.touches[0][clientPos]) - scrollStartPosition) *
          (contentOffsetSize / thumbSize);
        const newScrollPos = Math.min(
          initialScrollPos + deltaX,
          contentScrollSize - contentOffsetSize
        );
        props.contentRef.current[scrollPos] = newScrollPos;
      }
    },
    [isDragging, scrollStartPosition, thumbSize]
  );

  const events = [
    { event: "mousemove", target: document, method: handleThumbMove },
    { event: "touchmove", target: document, method: handleThumbMove },
    { event: "mouseup", target: document, method: handleThumbEnd },
    { event: "mouseleave", target: document, method: handleThumbEnd },
    { event: "touchend", target: document, method: handleThumbEnd },
    { event: "mousemove", target: document, method: handleContentMove },
    { event: "mouseup", target: document, method: handleContentEnd },
    { event: "touchmove", target: document, method: handleContentMove },
    { event: "touchend", target: document, method: handleContentEnd },
  ];

  useEffect(() => {
    for (let event of events) {
      event.target.addEventListener(event.event, event.method);
    }
    props.contentRef.current.addEventListener("mousedown", handleContentBegin);
    props.contentRef.current.addEventListener("touchstart", handleContentBegin);

    return () => {
      for (let event of events) {
        event.target.removeEventListener(event.event, event.method);
      }
      props.contentRef.current.addEventListener(
        "mousedown",
        handleContentBegin
      );
      props.contentRef.current.addEventListener(
        "touchstart",
        handleContentBegin
      );
    };
  }, [
    ...events.reduce(
      (methods: Function[], currEvent) => [...methods, currEvent.method],
      []
    ),
    handleContentBegin,
  ]);

  return (
    <div
      className={[styles.scrollbar, styles[direction]].join(" ")}
      style={{ visibility: visibility.scrollbarVisible ? "visible" : "hidden" }}
    >
      <div
        className={styles.track}
        ref={scrollTrackRef}
        onClick={handleTrackClick}
        style={{ cursor: isDragging ? "grabbing" : "pointer" }}
      ></div>
      <div
        className={styles.thumb}
        ref={scrollThumbRef}
        onMouseDown={handleThumbBegin}
        onTouchStart={handleThumbBegin}
        style={{
          [size]: `${thumbSize}px`,
          cursor: isDragging ? "grabbing" : "grab",
          visibility: visibility.thumbVisible ? "visible" : "hidden",
        }}
      ></div>
    </div>
  );
};

export default Scrollbar;
