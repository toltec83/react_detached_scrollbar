import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import Scrollbar from "./components/Scrollbar";

function App() {
  
  /*****************************************************/

  const contentRef = useRef<HTMLDivElement>(null);
  const [blockNum, setBlockNum] = useState({ v: 2, h: 3 });

  const addBlocks = () => {
    const contentBlocks = [];
    for (let i = 0; i < blockNum.h; i++) {
      const rowBlocks = [];
      for (let j = 0; j < blockNum.v; j++) {
        rowBlocks.push(
          <div key={"block" + j} className={styles.block}>
            <div className={styles.block_face}></div>
          </div>
        );
      }
      contentBlocks.push(
        <div key={"column" + i} className={styles.column}>
          {rowBlocks}
        </div>
      );
    }
    return contentBlocks;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content_outer}>
        <div ref={contentRef} className={styles.content}>
          {addBlocks()}
        </div>

        <div className={[styles.buttons, styles.buttons_v].join(" ")}>
          <button
            onClick={() => {
              setBlockNum({
                ...blockNum,
                v: blockNum.v > 0 ? blockNum.v - 1 : 0,
              });
            }}
          >
            -
          </button>
          <button
            onClick={() => {
              setBlockNum({ ...blockNum, v: blockNum.v + 1 });
            }}
          >
            +
          </button>
        </div>

        <div className={[styles.buttons, styles.buttons_h].join(" ")}>
          <button
            onClick={() => {
              setBlockNum({
                ...blockNum,
                h: blockNum.h > 0 ? blockNum.h - 1 : 0,
              });
            }}
          >
            -
          </button>
          <button
            onClick={() => {
              setBlockNum({ ...blockNum, h: blockNum.h + 1 });
            }}
          >
            +
          </button>
        </div>
      </div>

      <Scrollbar
        contentRef={contentRef}
        options={{ direction: "horizontal", isDraggable: false }}
      />
    </div>
  );
}

export default App;
