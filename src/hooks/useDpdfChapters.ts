import { useState, useEffect } from "react";
import type { HookQueryResult, Chapter } from "../types";
import dpdf from "../tools/Dpdf";

type Result = {
    chapters: Chapter[];
};
type Info = {};

const useDpdfChapters = (): HookQueryResult<Result, Info> => {
    const [chapters, setChapters] = useState<Chapter[]>([]);

    useEffect(() => {
        dpdf.findChapters().then((result: Chapter[]) => {
            setChapters(result);
        });
    }, []);

    return [{ chapters }, {}];
};

export default useDpdfChapters;
