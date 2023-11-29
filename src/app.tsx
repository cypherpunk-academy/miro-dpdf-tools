import * as React from "react";
import { createRoot } from "react-dom/client";
import { GridWrapper } from "./styled";
import ViewModes from "./components/ViewModes";

const App: React.FC = () => {
    return (
        <GridWrapper className="cs1 ce12">
            <ViewModes />
        </GridWrapper>
    );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
