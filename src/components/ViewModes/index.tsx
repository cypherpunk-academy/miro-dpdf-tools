import React from "react";
import useModifyConnectorsVisible from "../../hooks/useModifyConnectorsVisible";

interface Props {}

const ViewModes = ({}: Props): JSX.Element => {
    const [
        onChangeConnectorsVisible,
        { visible: connectorsVisible },
        { modifying: connectorsModifying },
    ] = useModifyConnectorsVisible();

    console.log(11.1, connectorsVisible, connectorsModifying);

    return (
        <label className="toggle">
            <input
                type="checkbox"
                onChange={onChangeConnectorsVisible}
                disabled={connectorsModifying}
            />
            <span>{connectorsVisible ? "On" : "Off"}</span>
        </label>
    );
};

export default ViewModes;
