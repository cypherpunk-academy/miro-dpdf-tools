const textShapes = [
    "rectangle",
    "round_rectangle",
    "square",
    "right_arrow",
    "left_arrow",
    "hexagon",
    "circle",
];

const startStyle = {
    fillColor: "#f9ac9d",
    fontFamily: "open_sans",
    borderStyle: "normal",
    borderOpacity: 0.2,
    borderColor: "#f24726",
    borderWidth: 2,
    fillOpacity: 1,
};

const endStyle = {
    fillColor: "#ffffff",
    fontFamily: "open_sans",
    fontSize: 13,
    textAlign: "center",
    textAlignVertical: "middle",
    borderStyle: "normal",
    borderOpacity: 1,
    borderColor: "#F0DBD7",
    borderWidth: 3,
    fillOpacity: 1,
    color: "#f9ac9d",
};

const endOfChapterStyle = {
    ...endStyle,
    fontSize: 26,
    borderOpacity: 1,
    borderColor: "#DA0063",
    borderWidth: 6,
    fillOpacity: 1,
    color: "#f9ac9d",
};

const paragraphNrStyle = {
    width: 26.24692069989871,
    height: 24.048905483664203,
    style: {
        fillColor: "#ffffff",
        fontSize: 13,
        borderStyle: "normal",
        borderOpacity: 1,
        borderColor: "#ADD9D0",
        borderWidth: 2,
        fillOpacity: 1,
        color: "#0ca789",
    },
};

const paragraphStart = {
    type: "shape",
    shape: "triangle",
    style: startStyle,
    width: 9,
    height: 13,
};

const paragraphEnd = {
    type: "shape",
    shape: "rhombus",
    style: endStyle,
    width: 34,
    height: 26,
};

const endConnector = {
    type: "connector",
    shape: "straight",
    start: {
        item: "???",
        snapTo: "auto",
    },
    end: {
        item: "???",
        snapTo: "auto",
    },
    style: {
        startStrokeCap: "none",
        endStrokeCap: "none",
        strokeStyle: "dotted",
        strokeWidth: 1,
        strokeColor: "#5c9723",
        textOrientation: "horizontal",
    },
};
class Mirou {
    async modifyStyle(items, style) {
        for (const item of items) {
            item.style = { ...item.style, ...style };
            await item.sync();
        }
    }
    async modifyStyleOfSelection(style) {
        const selections = await miro.board.getSelection();

        return this.modifyStyle(selections, style);
    }

    async modifyStyleWithFilter(filter, style, condition = () => true) {
        const allItems = await miro.board.get({ type: filter.type || "shape" });
        const items = this.filterItem(allItems, filter, condition);
        return this.modifyStyle(items, style);
    }

    getGlobalCoordinates(frame, coord) {
        return {
            x: frame.x - frame.width / 2 + coord.x,
            y: frame.y - frame.height / 2 + coord.y,
        };
    }

    async getShapes() {
        const items = await miro.board.get();
        const shapes = new Set(items.map((item) => item.shape));
        return shapes;
    }

    async getTypes() {
        const items = await miro.board.get();
        const types = new Set(items.map((item) => item.type));
        return types;
    }

    filterItem(items, props, condition) {
        return items
            .filter((item) =>
                Object.keys(props).every((key) => item[key] === props[key])
            )
            .filter(condition);
    }

    async getItems(props, condition = () => true) {
        const items = await miro.board.get({ type: props.type || "shape" });
        return await this.filterItem(items, props, condition);
    }

    async removeItems(props, condition = () => true) {
        const allItems = await miro.board.get({ type: props.type || "shape" });

        const items = this.filterItem(allItems, props, condition);

        if (items.length > 100 || items.length === 0) {
            throw new Error(
                `Not more than 100 items or no items found (${items.length}).`
            );
        }

        return await Promise.all(items.map((item) => miro.board.remove(item)));
    }

    async modifyItems(searchProps, modifyProps, condition = () => true) {
        const allItems = await miro.board.get({
            type: searchProps.type || "shape",
        });

        const items = this.filterItem(allItems, searchProps, condition);

        return await Promise.all(
            items.map(async (item) => {
                for (const key of Object.keys(modifyProps)) {
                    if (key === "style") {
                        item.style = {
                            ...item.style,
                            ...modifyProps.style,
                        };
                        continue;
                    }

                    item[key] = modifyProps[key];
                }
                return item.sync();
            })
        );
    }

    async zoomToId(id) {
        const item = (await miro.board.get({ id }))[0];
        await miro.board.viewport.zoomTo(item);
    }
}

class Dpdf {
    frame = null;

    calculateRotation(coords1, coords2) {
        const dx = coords2.x - coords1.x;
        const dy = coords2.y - coords1.y;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (angle + 90) % 360;
    }

    async getCoords(item) {
        if (!item) {
            throw new Error("Item is undefined.");
        }
        return item.relativeTo === "parent_top_left"
            ? mirou.getGlobalCoordinates(await this.getFrame(), item)
            : {
                  x: item.x,
                  y: item.y,
              };
    }

    async getFrame() {
        if (!this.frame) {
            this.frame = (await mirou.getItems({ type: "frame" }))[0];
        }

        return this.frame;
    }

    async getChapter(num) {
        return (await mirou.getItems({ shape: "star" })).find((item) =>
            item.content.includes(num)
        );
    }

    async addTrianglePointingToParagraphEnd(p, prevP) {
        const firstSentence = p.sentences[0];
        const lastSentence = prevP.sentences[prevP.sentences.length - 1];

        const coords1 = await this.getCoords({
            ...firstSentence,
            y: firstSentence.y - firstSentence.height / 2 - 5,
        });

        const coords2 = await this.getCoords(lastSentence);
        const rotation = this.calculateRotation(coords1, coords2);

        const triangle = await this.getNextSentence(
            firstSentence.id,
            firstSentence.connectorIds,
            ["triangle"]
        );

        if (triangle) {
            setTimeout(() => miro.board.remove(triangle), 5000);
        }

        const shape = {
            ...paragraphStart,
            content: "",
            x: coords1.x,
            y: coords1.y,
            rotation,
        };

        const newTriangle = await miro.board.createShape(shape);

        miro.board.createConnector({
            ...endConnector,
            start: {
                ...endConnector.start,
                item: newTriangle.id,
            },
            end: {
                ...endConnector.end,
                item: firstSentence.id,
            },
        });

        console.info(`Added start and end to Paragraph ${p.nr}.`);
    }

    async getNextSentence(
        id,
        connectorIds,
        shapesOrTypes,
        previousSentences = []
    ) {
        for (const connectorId of connectorIds) {
            const connector = (await miro.board.get({ id: connectorId }))[0];
            if (!connector) {
                continue;
            }
            const sentenceId =
                connector.start.item === id
                    ? connector.end.item
                    : connector.start.item;

            if (!sentenceId) {
                throw new Error(
                    "I did not find a fitting sentence id. Maybe a loop?"
                );
            }

            const item = (await miro.board.get({ id: sentenceId }))[0];

            if (
                (!shapesOrTypes ||
                    shapesOrTypes.includes(item.shape) ||
                    shapesOrTypes.includes(item.type)) &&
                !previousSentences.includes(item.id)
            ) {
                return item;
            }
        }

        return null;
    }

    getPlainTextFromHtml(htmlString) {
        const tempElement = document.createElement("div");
        tempElement.innerHTML = htmlString;
        return tempElement.textContent;
    }

    romanize(num) {
        if (isNaN(num)) return NaN;
        var digits = String(+num).split(""),
            key = [
                "",
                "C",
                "CC",
                "CCC",
                "CD",
                "D",
                "DC",
                "DCC",
                "DCCC",
                "CM",
                "",
                "X",
                "XX",
                "XXX",
                "XL",
                "L",
                "LX",
                "LXX",
                "LXXX",
                "XC",
                "",
                "I",
                "II",
                "III",
                "IV",
                "V",
                "VI",
                "VII",
                "VIII",
                "IX",
            ],
            roman = "",
            i = 3;
        while (i--) roman = (key[+digits.pop() + i * 10] || "") + roman;
        return Array(+digits.join("") + 1).join("M") + roman;
    }

    async syncParagraphsOfChapter(num) {
        const chapter = await this.getChapter(num);

        if (!chapter) {
            throw new Error(`I did not find a chapter  ${num}`);
        }

        const paragraphs = [];
        for (const firstConnectorId of chapter.connectorIds) {
            let previousSentences = [];
            let connectorId = firstConnectorId;
            let nextConnectorIds = [connectorId];
            let curve = await this.getNextSentence(
                chapter.id,
                nextConnectorIds,
                ["curve"]
            );

            if (!curve || curve.type !== "curve") {
                continue;
            }

            while (true) {
                const sentences = [];
                previousSentences.push(curve.id);
                nextConnectorIds.push(
                    ...curve.connectorIds.filter(
                        (id) => !nextConnectorIds.includes(id)
                    )
                );

                if (!nextConnectorIds.length) {
                    throw new Error(`Didn't find a next connector id.`);
                }

                const circle = await this.getNextSentence(
                    curve.id,
                    nextConnectorIds,
                    ["circle"]
                );

                if (!circle) {
                    throw new Error(
                        `Didn't find a circle sentence for curve ${JSON.stringify(
                            curve
                        )}.`
                    );
                }

                previousSentences.push(circle.id);
                const paragraphNr = this.getPlainTextFromHtml(circle.content);

                let sentence = circle;
                console.info(`Adding sentences to paragraph ${paragraphNr}.`);

                while (true) {
                    sentence = await this.getNextSentence(
                        sentence.id,
                        sentence.connectorIds,
                        textShapes,
                        previousSentences
                    );

                    if (!sentence) {
                        break;
                    }

                    previousSentences.push(sentence.id);
                    sentences.push(sentence);
                }

                if (sentences.length > 0) {
                    paragraphs.push({ sentences, nr: paragraphNr });

                    const lastSentence = sentences[sentences.length - 1];
                    const rhombus = await this.getNextSentence(
                        lastSentence.id,
                        lastSentence.connectorIds,
                        ["rhombus"]
                    );

                    const heightOffset =
                        lastSentence.type === "sticky_note"
                            ? -15
                            : ["left_arrow", "right_arrow"].includes(
                                  lastSentence.shape
                              )
                            ? -20
                            : 15;

                    const coords = await this.getCoords(lastSentence);
                    const shape = {
                        ...paragraphEnd,
                        content: `<strong>${paragraphNr}</strong>`,
                        x: coords.x,
                        y: coords.y + lastSentence.height / 2 + heightOffset,
                    };

                    if (rhombus) {
                        setTimeout(() => miro.board.remove(rhombus), 500);
                    }

                    const newRhombus = await miro.board.createShape(shape);
                    await miro.board.createConnector({
                        ...endConnector,
                        start: {
                            ...endConnector.start,
                            item: lastSentence.id,
                        },
                        end: {
                            ...endConnector.end,
                            item: newRhombus.id,
                        },
                    });
                }

                console.info(sentences.length);

                curve = await this.getNextSentence(
                    curve.id,
                    curve.connectorIds,
                    ["curve"],
                    previousSentences
                );

                if (!curve) {
                    break;
                } else {
                    nextConnectorIds = [];
                }
            }
        }

        let paragraphInPlainText = `${this.romanize(
            num
        )}. ${this.getPlainTextFromHtml(chapter.content).replace(
            /[0-9-]/g,
            ""
        )}\n\n`;

        const sortedParagraphs = paragraphs.sort((a, b) => a.nr - b.nr);
        for (let i = 0; i < sortedParagraphs.length; i++) {
            const p = sortedParagraphs[i];
            const prevP = sortedParagraphs[i - 1];

            if (i > 0) {
                await this.addTrianglePointingToParagraphEnd(p, prevP);
            }

            const text = this.getPlainTextFromHtml(
                p.sentences.map((s) => s.content).join(" ")
            )
                .replace(";", "; ")
                .replace(/([,:;.-])\s*-/g, "$1 ")
                .replace(/\s\s/g, " ");
            paragraphInPlainText += `${p.nr}\n${text}\n`;
        }

        const lastParagraphOfChapter =
            sortedParagraphs[sortedParagraphs.length - 1].sentences;
        const lastSentenceOfChapter = (
            await miro.board.get({
                id: lastParagraphOfChapter[lastParagraphOfChapter.length - 1]
                    .id,
            })
        )[0];
        const lastSentenceRhombus = await this.getNextSentence(
            lastSentenceOfChapter.id,
            lastSentenceOfChapter.connectorIds,
            ["rhombus"]
        );

        lastSentenceRhombus.width *= 2;
        lastSentenceRhombus.height *= 2;
        lastSentenceRhombus.y += lastSentenceRhombus.height / 4;
        lastSentenceRhombus.content = `<strong>${num}</strong>`;
        lastSentenceRhombus.style = endOfChapterStyle;

        await lastSentenceRhombus.sync();

        return { sortedParagraphs, paragraphInPlainText };
    }

    async hideConnectors() {
        await mirou.modifyItems(
            { type: "connector" },
            { style: { strokeColor: "#ffffff" } },
            (item) => item.style.strokeStyle === "dotted"
        );
    }
}

window.mi = miro.board;
window.miv = miro.board.viewport;
window.mirou = new Mirou();
window.dpdf = new Dpdf();
