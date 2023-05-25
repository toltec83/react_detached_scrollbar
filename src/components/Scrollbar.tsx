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
    clientXY: "clientY" | "clientX";
    pos: "left" | "top";
    size: "width" | "height";
    scrollXY: "scrollLeft" | "scrollTop";
    scrollWH: "scrollWidth" | "scrollHeight";
    clientWH: "clientWidth" | "clientHeight";
    offsetWH: "offsetWidth" | "offsetHeight";
  };
};

const dirProps: dirProps = {
  horizontal: {
    clientXY: "clientX",
    pos: "left",
    size: "width",
    scrollXY: "scrollLeft",
    scrollWH: "scrollWidth",
    clientWH: "clientWidth",
    offsetWH: "offsetWidth",
  },
  vertical: {
    clientXY: "clientY",
    pos: "top",
    size: "height",
    scrollXY: "scrollTop",
    scrollWH: "scrollHeight",
    clientWH: "clientHeight",
    offsetWH: "offsetHeight",
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

  const { pos, size, clientXY, scrollXY, scrollWH, clientWH, offsetWH } =
    dirProps[direction];

  const [thumbSize, setThumbSize] = useState(minThumbSize);
  const [realThumbSize, setRealThumbSize] = useState(minThumbSize);
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
      const { [scrollXY]: contentPos, [scrollWH]: contentSize } =
        props.contentRef.current;
      const { [clientWH]: trackSize } = scrollTrackRef.current;
      let thumbPos =
        (+contentPos / +contentSize) *
        (trackSize - (thumbSize - realThumbSize));
      thumbPos = Math.min(thumbPos, trackSize - thumbSize);
      scrollThumbRef.current!.style[pos] = `${thumbPos}px`;
    }
  };

  function handleResize() {
    if (props.contentRef.current && scrollTrackRef.current) {
      if (!isContentDragging){console.log("pos thu"); positionThumb();}
      const { [clientWH]: clientS, [scrollWH]: scrollS } =
        props.contentRef.current;
      const { [clientWH]: trackSize } = scrollTrackRef.current;
      if (!alwaysVisible && clientS >= scrollS) {
        setVisibility("SCROLLBAR_HIDDEN");
      } else if (alwaysVisible && clientS >= scrollS) {
        setVisibility("THUMB_HIDDEN");
      } else {
        setVisibility("SCROLLBAR_VISIBLE");
      }
      setThumbSize(Math.max((clientS / scrollS) * trackSize, minThumbSize));
      setRealThumbSize((clientS / scrollS) * trackSize);
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
        const clientXYition = e[clientXY];
        const target = e.target as HTMLDivElement;
        const trackPos = target.getBoundingClientRect()[pos];
        const thumbOffset = -(thumbSize / 2);
        const clickRatio =
          (clientXYition - trackPos + thumbOffset) / trackCurrent[clientWH];
        const scrollAmount = Math.floor(clickRatio * contentCurrent[scrollWH]);
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
        const delta = (e[clientXY] ?? e.touches[0][clientXY]) - prevPos;
        props.contentRef.current[scrollXY] -= delta;
        setPrevPos(e[clientXY] ?? e.touches[0][clientXY]);
      }
    },
    [isContentDragging, prevPos]
  );

  const handleContentBegin = useCallback((e: any) => {
    setIsContentDragging(true);
    setPrevPos(e[clientXY] ?? e.touches[0][clientXY]);
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
    setScrollStartPosition(e[clientXY] ?? e.touches[0][clientXY]);
    setInitialScrollPos(props.contentRef.current![scrollXY]);
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
        const { [scrollWH]: contentScrollSize, [offsetWH]: contentOffsetSize } =
          props.contentRef.current;
        const deltaX =
          ((e[clientXY] ?? e.touches[0][clientXY]) - scrollStartPosition) *
          (contentOffsetSize / realThumbSize);
        const newScrollPos = Math.min(
          initialScrollPos + deltaX,
          contentScrollSize - contentOffsetSize
        );
        props.contentRef.current[scrollXY] = newScrollPos;
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
