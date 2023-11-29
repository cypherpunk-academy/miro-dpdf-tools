import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import useModifyConnectorsVisible from "../../hooks/useModifyConnectorsVisible";
import useDpdfText from "../../hooks/useDpdfText";
interface Props {}

const ViewModes = ({}: Props): JSX.Element => {
    const [shouldDownload, setShouldDownload] = useState<boolean>(false);
    const [
        onChangeConnectorsVisible,
        { visible: connectorsVisible },
        { modifying: connectorsModifying },
    ] = useModifyConnectorsVisible();

    const [onReadText, { text }, { reading: textReading }] = useDpdfText();

    useEffect(() => {
        if (shouldDownload === false && textReading === true) {
            setShouldDownload(true);
        } else if (
            shouldDownload === true &&
            textReading === false &&
            text !== ""
        ) {
            setShouldDownload(false);

            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "filename.txt");
        }
    }, [shouldDownload, text, textReading]);

    return (
        <div className="dpdf-tools">
            <div className="group">
                <div className="label">Connectors</div>
                <label className="toggle">
                    <input
                        type="checkbox"
                        onChange={onChangeConnectorsVisible}
                        disabled={connectorsModifying}
                    />
                    <span>{connectorsVisible ? "On" : "Off"}</span>
                </label>
            </div>
            <div className="group">
                <div className="label">Download text</div>
                <label className="download">
                    <button
                        className="button button-primary button-small"
                        type="button"
                        onClick={onReadText}
                        disabled={textReading}
                    >
                        {textReading ? "Downloading..." : "Download"}
                    </button>
                </label>
            </div>
        </div>
    );
};

export default ViewModes;
