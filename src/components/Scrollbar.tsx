import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import styles from "./Scrollbar.module.css";

interface ScrollbarOptions {
  direction: string;
  alwaysVisible?: boolean;
  isDraggable?: boolean;
  minThumbWidth?: number;
}

interface ScrollbarProps {
  options: ScrollbarOptions;
  contentRef: any;
}

interface visibilityState {
  thumbVisible: boolean;
  scrollbarVisible: boolean;
}

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
  }
  return state;
};

const Scrollbar: React.FC<ScrollbarProps> = (props: ScrollbarProps) => {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const {
    direction,
    minThumbWidth = 20,
    isDraggable = true,
    alwaysVisible = false,
  } = props.options;

  const [thumbWidth, setThumbWidth] = useState(minThumbWidth);
  const [scrollStartPosition, setScrollStartPosition] = useState(0);

  const [visibility, setVisibility] = useReducer(handleVisibility, {
    thumbVisible: true,
    scrollbarVisible: true,
  });

  const [initialScrollLeft, setInitialScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [isContentDragging, setIsContentDragging] = useState(false);
  const [prevX, setPrevX] = useState(0);

  const positionThumb = () => {
    if (props.contentRef.current && scrollTrackRef.current) {
      const { scrollLeft: contentLeft, scrollWidth: contentWidth } =
        props.contentRef.current;
      const { clientWidth: trackWidth } = scrollTrackRef.current;
      let thumbPos = (+contentLeft / +contentWidth) * trackWidth;
      thumbPos = Math.min(thumbPos, trackWidth - thumbWidth);
      scrollThumbRef.current!.style.left = `${thumbPos}px`;
    }
  };

  function handleResize() {
    if (props.contentRef.current && scrollTrackRef.current) {
      positionThumb();
      const { clientWidth, scrollWidth } = props.contentRef.current;
      const { clientWidth: trackSize } = scrollTrackRef.current;
      if (!alwaysVisible && clientWidth >= scrollWidth) {
        setVisibility("SCROLLBAR_HIDDEN");
      } else if (alwaysVisible && clientWidth >= scrollWidth) {
        setVisibility("THUMB_HIDDEN");
      } else {
        setVisibility("SCROLLBAR_VISIBLE");
      }
      setThumbWidth(
        Math.max((clientWidth / scrollWidth) * trackSize, minThumbWidth)
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
  }, [thumbWidth]);

  const handleTrackClick = useCallback(
    (e: any) => {
      const { current: trackCurrent } = scrollTrackRef;
      const { current: contentCurrent } = props.contentRef;

      if (trackCurrent && contentCurrent) {
        const { clientX } = e;
        const target = e.target as HTMLDivElement;
        const rect = target.getBoundingClientRect();
        const trackLeft = rect.left;
        const thumbOffset = -(thumbWidth / 2);
        const clickRatio =
          (clientX - trackLeft + thumbOffset) / trackCurrent.clientWidth;
        const scrollAmount = Math.floor(
          clickRatio * contentCurrent.scrollWidth
        );
        contentCurrent.scrollTo({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    },
    [thumbWidth]
  );

  /******************TIMELINE DRAG DESKTOP HANDLERS****************/

  const handleContentMousedown = useCallback((e: any) => {
    setIsContentDragging(true);
    setPrevX(e.clientX);
  }, []);

  const handleContentMouseup = useCallback(
    (e: any) => {
      /* e.preventDefault();
      e.stopPropagation(); */
      if (isContentDragging) {
        setIsContentDragging(false);
      }
    },
    [isContentDragging]
  );

  const handleContentMove = useCallback(
    (e: any) => {
      /* e.preventDefault();
      e.stopPropagation(); */
      if (isContentDragging) {
        const deltaX = (e.clientX ?? e.touches[0].clientX) - prevX;
        props.contentRef.current.scrollLeft -= deltaX;
        setPrevX(e.clientX ?? e.touches[0].clientX);
      }
    },
    [isContentDragging, prevX]
  );

  /******************TIMELINE DRAG MOBILE HANDLERS****************/

  const handleContentBegin = useCallback((e: any) => {
    setIsContentDragging(true);
    setPrevX(e.clientX ?? e.touches[0].clientX);
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
    setScrollStartPosition(e.clientX ?? e.touches[0].clientX);
    setInitialScrollLeft(props.contentRef.current!.scrollLeft);
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
          scrollWidth: contentScrollWidth,
          offsetWidth: contentOffsetWidth,
        } = props.contentRef.current;
        const deltaX =
          ((e.clientX ?? e.touches[0].clientX) - scrollStartPosition) *
          (contentOffsetWidth / thumbWidth);
        const newScrollLeft = Math.min(
          initialScrollLeft + deltaX,
          contentScrollWidth - contentOffsetWidth
        );
        props.contentRef.current.scrollLeft = newScrollLeft;
      }
    },
    [isDragging, scrollStartPosition, thumbWidth]
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
      (methods:Function[], currEvent) => [...methods, currEvent.method],
      []
    ),
    handleContentBegin,
  ]);

  return (
    <div
      className={styles.scrollbar}
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
          width: `${thumbWidth}px`,
          cursor: isDragging ? "grabbing" : "grab",
          visibility: visibility.thumbVisible ? "visible" : "hidden",
        }}
      ></div>
    </div>
  );
};

export default Scrollbar;
