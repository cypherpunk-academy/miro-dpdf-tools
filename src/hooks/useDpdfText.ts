import { useState, useCallback, useEffect } from "react";
import type { Chapter, HookMutationResult } from "../types";
import dpdf from "../tools/Dpdf";

type Invoke = (chapter: Chapter) => void;
type Result = {
    text: string;
    title: string;
};
type Info = {
    reading: boolean;
};

const useDpdfText = (): HookMutationResult<Invoke, Result, Info> => {
    const [text, setText] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [reading, setReading] = useState<boolean>(false);
    const [shouldRead, setShouldRead] = useState<number | null>(null);

    useEffect(() => {
        if (shouldRead !== null && reading === false) {
            setReading(true);

            dpdf.syncParagraphsOfChapter(shouldRead).then((text) => {
                setText(text.paragraphInPlainText);
                setReading(false);
            });

            setShouldRead(null);
        }
    }, [shouldRead, reading]);

    const invoke = useCallback(async (chapter: Chapter) => {
        setShouldRead(chapter.nr);
        setTitle(`${chapter.nr} ${chapter.title}`);
    }, []);

    return [invoke, { text, title }, { reading }];
};

export default useDpdfText;
