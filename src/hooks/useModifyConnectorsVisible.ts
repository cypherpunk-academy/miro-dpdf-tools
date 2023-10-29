import { useState, useCallback, useEffect } from "react";
import type { HookMutationResult } from "../types";
import mirou from "../scripts/mirou";

type Invoke = () => void;
type Result = {
    visible: boolean;
};
type Info = {
    modifying: boolean;
};

const useChangeConnectorsVisible = (): HookMutationResult<
    Invoke,
    Result,
    Info
> => {
    const [visible, setVisible] = useState(false);
    const [modifying, setModifying] = useState(false);
    const [shouldModify, setShouldModify] = useState(false);

    useEffect(() => {
        if (shouldModify === true && modifying === false) {
            setModifying(true);
            setShouldModify(false);

            mirou
                .modifyItems(
                    { type: "connector" },
                    { style: { strokeColor: visible ? "#ffffff" : "#800000" } },
                    (item) => item.style.strokeStyle === "dotted"
                )
                .then(() => {
                    setModifying(false);
                });

            setVisible((prev) => !prev);
        }
    }, [shouldModify, modifying]);

    const invoke = useCallback(async () => {
        setShouldModify(true);
    }, []);

    return [invoke, { visible }, { modifying }];
};

export default useChangeConnectorsVisible;
