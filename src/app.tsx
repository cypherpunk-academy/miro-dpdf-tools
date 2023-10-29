import * as React from "react";
import { createRoot } from "react-dom/client";
import { GridWrapper } from "./styled";
import ViewModes from "./components/ViewModes";

// async function addSticky() {
//   const stickyNote = await miro.board.createStickyNote({
//     content: "Hello, World!!!",
//   });

//   await miro.board.viewport.zoomTo(stickyNote);
// }

const App: React.FC = () => {
    // React.useEffect(() => {
    //   addSticky();
    // }, []);

    return (
        <GridWrapper className="cs1 ce12">
            <ViewModes />
        </GridWrapper>
    );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
