import {
  FC,
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./Scrollbar.module.css";
import { updateAsExpression } from "typescript";

interface ScrollbarOptions {
  direction: "horizontal" | "vertical";
  isDraggable: boolean;
}

interface ScrollbarProps {
  options: ScrollbarOptions;
  contentRef: RefObject<HTMLDivElement>;
}

const Scrollbar: FC<ScrollbarProps> = (props: ScrollbarProps) => {
  const [thumbDragging, setThumbDragging] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const thumbRef = useRef<HTMLDivElement>(null);
  const thumbtrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    //if (thumbDragging) {
    document.addEventListener("mouseup", globalMouseUp);
    document.addEventListener("mousemove", updateThumbDrag);
    return () => {
      document.removeEventListener("mousemove", updateThumbDrag);
    };
    //}
  }, [thumbDragging]);

  const globalMouseUp = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    setThumbDragging(false);
  };

  const updateThumbDrag = useCallback((evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    if (thumbDragging) {
      console.log(evt.clientX, evt.clientY);
    }
  }, []);

  return (
    <div className={styles.scrollbar_h}>
      <div ref={thumbtrackRef} className={styles.thumbtrack}></div>
      <div
        ref={thumbRef}
        onMouseDown={(evt) => {
          setThumbDragging(true);
        }}
        className={styles.thumb}
      ></div>
    </div>
  );
};

export default Scrollbar;
