import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { saveAs } from "file-saver";
import useModifyConnectorsVisible from "../../hooks/useModifyConnectorsVisible";
import useDpdfText from "../../hooks/useDpdfText";
import useDpdfChapters from "../../hooks/useDpdfChapters";
interface Props {}

// TODO: Load multiple chapters
// Set a file name (book name)
// Show a progress bar for 7 chapters

const ViewModes = ({}: Props): JSX.Element => {
    const [shouldDownload, setShouldDownload] = useState<boolean>(false);
    const [
        onChangeConnectorsVisible,
        { visible: connectorsVisible },
        { modifying: connectorsModifying },
    ] = useModifyConnectorsVisible();

    const [{ chapters }] = useDpdfChapters();
    const [onReadText, { text, title }, { reading: textReading }] =
        useDpdfText();

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
            saveAs(blob, `${title}.txt`);
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
                    <div className="form-group">
                        <label>Wähle ein Kapitel:</label>
                        <select
                            className="select"
                            disabled={
                                textReading === true || chapters.length === 0
                            }
                        >
                            {chapters.map((chapter) => (
                                <option
                                    key={chapter.id}
                                    value={chapter.nr}
                                    onClick={() => onReadText(chapter)}
                                >
                                    {`${chapter.nr} ${chapter.title}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    {textReading === true ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} spin />
                            <span>Ich lese den Text ...</span>
                        </>
                    ) : null}
                </label>
            </div>
        </div>
    );
};

export default ViewModes;
