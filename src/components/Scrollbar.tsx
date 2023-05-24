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
      e.preventDefault();
      e.stopPropagation();
      if (isContentDragging) {
        setIsContentDragging(false);
      }
    },
    [isContentDragging]
  );

  const handleContentMousemove = useCallback(
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      if (isContentDragging) {
        const deltaX = e.clientX - prevX;
        props.contentRef.current.scrollLeft -= deltaX;

        setPrevX(e.clientX);
      }
    },
    [isContentDragging, prevX]
  );

  /******************TIMELINE DRAG MOBILE HANDLERS****************/

  const handleContentBegin = useCallback((e: any) => {
    setIsContentDragging(true);
    setPrevX(e.touches ? e.touches[0].clientX : e.clientX);
  }, []);

  const handleContentEnd = useCallback(
    (e: any) => {
      if (isContentDragging) {
        setIsContentDragging(false);
      }
    },
    [isContentDragging]
  );

  const handleContentTouchmove = useCallback(
    (e: any) => {
      if (isContentDragging) {
        const deltaX = e.touches[0].clientX - prevX;
        props.contentRef.current.scrollLeft -= deltaX;

        setPrevX(e.touches[0].clientX);
      }
    },
    [isContentDragging, prevX]
  );

  const handleThumbMousedown = useCallback((e: any) => {
    setScrollStartPosition(e.clientX);
    setInitialScrollLeft(props.contentRef.current!.scrollLeft);
    setIsDragging(true);
  }, []);

  const handleThumbTouchdown = useCallback((e: any) => {
    setScrollStartPosition(e.touches[0].clientX);
    setInitialScrollLeft(props.contentRef.current!.scrollLeft);
    setIsDragging(true);
  }, []);

  const handleThumbMouseup = useCallback(
    (e: any) => {
      if (isDragging) {
        setIsDragging(false);
      }
    },
    [isDragging]
  );

  const handleThumbMousemove = useCallback(
    (e: any) => {
      if (isDragging) {
        const {
          scrollWidth: contentScrollWidth,
          offsetWidth: contentOffsetWidth,
        } = props.contentRef.current;
        const deltaX =
          (e.clientX - scrollStartPosition) * (contentOffsetWidth / thumbWidth);
        const newScrollLeft = Math.min(
          initialScrollLeft + deltaX,
          contentScrollWidth - contentOffsetWidth
        );
        props.contentRef.current.scrollLeft = newScrollLeft;
      }
    },
    [isDragging, scrollStartPosition, thumbWidth]
  );

  const handleThumbTouchmove = useCallback(
    (e: any) => {
      if (isDragging) {
        const {
          scrollWidth: contentScrollWidth,
          offsetWidth: contentOffsetWidth,
        } = props.contentRef.current;
        const deltaX =
          (e.touches[0].clientX - scrollStartPosition) *
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

  // Listen for mouse events to handle scrolling by dragging the thumb
  useEffect(() => {
    document.addEventListener("mousemove", handleThumbMousemove);
    document.addEventListener("touchmove", handleThumbTouchmove);
    document.addEventListener("mouseup", handleThumbMouseup);
    document.addEventListener("mouseleave", handleThumbMouseup);
    document.addEventListener("touchend", handleThumbMouseup);

    document.addEventListener("mousemove", handleContentMousemove);
    props.contentRef.current.addEventListener("mousedown", handleContentBegin);
    document.addEventListener("mouseup", handleContentEnd);

    document.addEventListener("touchmove", handleContentTouchmove);
    props.contentRef.current.addEventListener("touchstart", handleContentBegin);
    document.addEventListener("touchend", handleContentEnd);

    return () => {
      document.removeEventListener("mousemove", handleThumbMousemove);
      document.removeEventListener("touchmove", handleThumbTouchmove);
      document.removeEventListener("mouseup", handleThumbMouseup);
      document.removeEventListener("mouseleave", handleThumbMouseup);
      document.removeEventListener("touchend", handleThumbMouseup);
      document.removeEventListener("mousemove", handleContentMousemove);
      document.removeEventListener("mouseup", handleContentEnd);
      document.removeEventListener("touchmove", handleContentTouchmove);
      document.removeEventListener("touchend", handleContentEnd);
      props.contentRef.current.removeEventListener(
        "touchstart",
        handleContentBegin
      );
      props.contentRef.current.removeEventListener(
        "mousedown",
        handleContentBegin
      );
    };
  }, [
    handleThumbMousemove,
    handleThumbMouseup,
    handleContentMousedown,
    handleContentMouseup,
    handleContentMousemove,
    handleContentBegin,
    handleContentEnd,
    handleContentTouchmove,
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
        onMouseDown={handleThumbMousedown}
        onTouchStart={handleThumbTouchdown}
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
