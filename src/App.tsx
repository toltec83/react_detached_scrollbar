import { useRef, useState } from "react";
import styles from "./App.module.css";
import Scrollbar from "./components/Scrollbar";

function App() {


  const contentRef = useRef<HTMLDivElement>(null);
  const [blockNum, setBlockNum] = useState({ v: 1, h: 2 });

  const blockColors = ["DarkCyan", "DarkOliveGreen"];

  const contentBlocks = () => {
    const blocks = [];
    for (let i = 0; i < blockNum.h; i++) {
      const rowBlocks = [];
      for (let j = 0; j < blockNum.v; j++) {
        rowBlocks.push(
          <div key={"block" + j} className={styles.block}>
            <div className={styles.block_face} style={{backgroundColor:blockColors[j%2]}}></div>
          </div>
        );
      }
      blocks.push(
        <div key={"column" + i} className={styles.column}>
          {rowBlocks}
        </div>
      );
    }
    return blocks;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content_outer}>
        <div ref={contentRef} className={styles.content}>
          {contentBlocks()}
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
        options={{
          direction: "horizontal",
          isContentDraggable: true,
          alwaysVisible: true,
          minThumbSize: 50,
        }}
      />

      <Scrollbar
        contentRef={contentRef}
        options={{
          direction: "vertical",
          isContentDraggable: true,
          alwaysVisible: true,
          minThumbSize: 40,
        }}
      />
    </div>
  );
}

export default App;
