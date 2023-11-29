import { useState, useCallback, useEffect } from "react";
import type { HookMutationResult } from "../types";
import dpdf from "../tools/Dpdf";

type Invoke = () => void;
type Result = {
    text: string;
};
type Info = {
    reading: boolean;
};

const useDpdfText = (): HookMutationResult<Invoke, Result, Info> => {
    const [text, setText] = useState<string>("");
    const [reading, setReading] = useState<boolean>(false);
    const [shouldModify, setShouldModify] = useState<boolean>(false);

    useEffect(() => {
        if (shouldModify === true && reading === false) {
            setReading(true);
            setShouldModify(false);

            dpdf.syncParagraphsOfChapter(1).then((text) => {
                setText(text.paragraphInPlainText);
                setReading(false);
            });
        }
    }, [shouldModify, reading]);

    const invoke = useCallback(async () => {
        setShouldModify(true);
    }, []);

    return [invoke, { text }, { reading }];
};

export default useDpdfText;
