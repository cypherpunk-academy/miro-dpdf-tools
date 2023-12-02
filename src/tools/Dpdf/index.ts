import Mirou from "../Mirou";
import type { Coords, Paragraph, Style } from "../../types";
import type {
    Connector,
    ConnectorProps,
    Shape,
    ShapeProps,
    StickyNote,
    WidgetMixin,
} from "@mirohq/websdk-types";
import romanize from "./romanize";
import type { PartialWidgetMixin, Chapter } from "../../types";

const textShapes = [
    "rectangle",
    "round_rectangle",
    "square",
    "right_arrow",
    "left_arrow",
    "hexagon",
    "circle",
];

const startStyle: Shape["style"] = {
    fillColor: "#f9ac9d",
    fontFamily: "open_sans",
    borderStyle: "normal",
    borderOpacity: 0.2,
    borderColor: "#f24726",
    borderWidth: 2,
    fillOpacity: 1,
    color: "#000",
    fontSize: 13,
    textAlign: "center",
    textAlignVertical: "middle",
};

const endStyle: Shape["style"] = {
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

const paragraphStart: PartialWidgetMixin = {
    type: "shape",
    shape: "triangle",
    style: startStyle,
    width: 9,
    height: 13,
};

const paragraphEnd: PartialWidgetMixin = {
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

export class Dpdf {
    frame: Shape | null = null;
    mirou: Mirou;

    constructor() {
        this.mirou = new Mirou();

        const globalThisMirou = globalThis as typeof globalThis & {
            dpdf: Dpdf | null;
            mirou: Mirou;
        };

        if (globalThisMirou.dpdf === undefined) {
            globalThisMirou.dpdf = null;

            const dpdf = new Dpdf();

            globalThisMirou.dpdf = dpdf;
            globalThisMirou.mirou = this.mirou;
        }
    }

    private calculateRotation(coords1: Coords, coords2: Coords) {
        const dx = coords2.x - coords1.x;
        const dy = coords2.y - coords1.y;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (angle + 90) % 360;
    }

    private async getCoords(item: WidgetMixin) {
        if (!item) throw new Error("Item is undefined.");

        return item.relativeTo === "parent_top_left"
            ? this.mirou.getGlobalCoordinates(await this.getFrame(), item)
            : {
                  x: item.x,
                  y: item.y,
              };
    }

    private async getFrame() {
        if (this.frame === null) {
            this.frame = (await this.mirou.getItems({ type: "frame" }))[0];
        }

        return this.frame;
    }

    private async getChapter(num: number) {
        return (await this.mirou.getItems({ shape: "star" })).find((item) =>
            item.content.includes(num.toString())
        );
    }

    private async addTrianglePointingToParagraphEnd(
        p: Paragraph,
        prevP: Paragraph
    ) {
        const firstSentence = p.sentences[0];
        const lastSentence = prevP.sentences[prevP.sentences.length - 1];

        const coords1 = await this.getCoords({
            ...firstSentence,
            y: firstSentence.y - firstSentence.height / 2 - 5,
        });

        const coords2 = await this.getCoords(lastSentence);
        const rotation = this.calculateRotation(coords1, coords2);

        const triangle = (await this.getNextSentence(
            firstSentence.id,
            firstSentence.connectorIds,
            ["triangle"]
        )) as Shape;

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

        const newTriangle = await miro.board.createShape(shape as ShapeProps);

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
        } as ConnectorProps);

        console.info(`Added start and end to Paragraph ${p.nr}.`);
    }

    private async getNextSentence(
        id: string,
        connectorIds: string[] = [],
        shapesOrTypes: string[] = [],
        previousSentences: string[] = []
    ): Promise<WidgetMixin | null> {
        for (const connectorId of connectorIds) {
            const connector = (
                await miro.board.get({ id: connectorId })
            )[0] as Connector;
            if (!connector) {
                continue;
            }

            const sentenceId =
                connector.start?.item === id
                    ? connector.end?.item
                    : connector.start?.item;

            if (!sentenceId) {
                throw new Error(
                    "I did not find a fitting sentence id. Maybe a loop?"
                );
            }

            const item = (await miro.board.get({ id: sentenceId }))[0] as Shape;

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

    private getPlainTextFromHtml(htmlString: string) {
        const tempElement = document.createElement("div");
        tempElement.innerHTML = htmlString;
        return tempElement.textContent;
    }

    async syncParagraphsOfChapter(num: number) {
        const chapter = await this.getChapter(num);

        if (!chapter || !chapter.connectorIds) {
            throw new Error(`I did not find a chapter  ${num}`);
        }

        const paragraphs: Paragraph[] = [];
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
                if (curve.connectorIds) {
                    nextConnectorIds.push(
                        ...curve.connectorIds.filter(
                            (id) => !nextConnectorIds.includes(id)
                        )
                    );
                }

                if (!nextConnectorIds.length) {
                    throw new Error(`Didn't find a next connector id.`);
                }

                const circle = (await this.getNextSentence(
                    curve.id,
                    nextConnectorIds,
                    ["circle"]
                )) as Shape | StickyNote;

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
                    sentence = (await this.getNextSentence(
                        sentence.id,
                        sentence.connectorIds,
                        textShapes,
                        previousSentences
                    )) as Shape | StickyNote;

                    if (!sentence) {
                        break;
                    }

                    previousSentences.push(sentence.id);
                    sentences.push(sentence);
                }

                if (sentences.length > 0) {
                    paragraphs.push({
                        sentences,
                        nr: (paragraphNr && parseInt(paragraphNr, 10)) || 0,
                    });

                    const lastSentence = sentences[sentences.length - 1];
                    const rhombus = (await this.getNextSentence(
                        lastSentence.id,
                        lastSentence.connectorIds,
                        ["rhombus"]
                    )) as Shape;

                    const heightOffset =
                        lastSentence.type === "sticky_note"
                            ? -15
                            : ["left_arrow", "right_arrow"].includes(
                                  lastSentence.shape
                              )
                            ? -20
                            : 15;

                    const coords = await this.getCoords(lastSentence);
                    const shape: PartialWidgetMixin = {
                        ...paragraphEnd,
                        content: `<strong>${paragraphNr}</strong>`,
                        x: coords.x,
                        y: coords.y + lastSentence.height / 2 + heightOffset,
                    };

                    if (rhombus) {
                        setTimeout(() => miro.board.remove(rhombus), 500);
                    }

                    const newRhombus = await miro.board.createShape(
                        shape as ShapeProps
                    );
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
                    } as ConnectorProps);
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

        const plainText = this.getPlainTextFromHtml(chapter.content) || "";
        let paragraphInPlainText = `${romanize(num)}. ${plainText.replace(
            /[0-9-]/g,
            ""
        )}\n\n`;

        const sortedParagraphs = paragraphs.sort(
            (a, b) => (a.nr && b.nr && a.nr - b.nr) || 0
        );
        for (let i = 0; i < sortedParagraphs.length; i++) {
            const p = sortedParagraphs[i];
            const prevP = sortedParagraphs[i - 1];

            if (i > 0) {
                await this.addTrianglePointingToParagraphEnd(p, prevP);
            }

            const plainText =
                this.getPlainTextFromHtml(
                    p.sentences.map((s) => s.content).join(" ")
                ) || "";
            const text = plainText
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
        )[0] as WidgetMixin;
        const lastSentenceRhombus = (await this.getNextSentence(
            lastSentenceOfChapter.id,
            lastSentenceOfChapter.connectorIds,
            ["rhombus"]
        )) as Shape & { width: number; height: number };

        if (!lastSentenceRhombus) {
            throw new Error(
                `I did not find a rhombus for last sentence of chapter ${num}.`
            );
        }

        lastSentenceRhombus.width *= 2;
        lastSentenceRhombus.height *= 2;
        lastSentenceRhombus.y += lastSentenceRhombus.height / 4;
        lastSentenceRhombus.content = `<strong>${num}</strong>`;
        lastSentenceRhombus.style = endOfChapterStyle;

        await lastSentenceRhombus.sync();

        return { sortedParagraphs, paragraphInPlainText };
    }

    async hideConnectors() {
        await this.mirou.modifyItems(
            { type: "connector" },
            { style: { strokeColor: "#ffffff" } },
            (item) =>
                (item.style && item.style.strokeStyle === "dotted") || false
        );
    }

    private getContent = (html: string | string[]): string => {
        const contentWithHtml = (
            Array.isArray(html) ? html[0] : html
        ) as string;
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = contentWithHtml;
        return tempDiv.innerText;
    };

    async findChapters(): Promise<Chapter[]> {
        const items = await this.mirou.getItems({
            type: "shape",
            shape: "star",
        });

        return items
            .filter((item) => {
                if (!item || !item.content || typeof item.content === "object")
                    return false;

                const content = this.getContent(item.content);

                return content.match(/^[0-9]{1,2}/) !== null || false;
            })
            .map((item) => {
                const content = this.getContent(item.content);

                const nr = parseInt(content, 10);
                const title = content.substring(nr.toString().length);

                return { nr, title, id: item.id };
            })
            .sort((a, b) => a.nr - b.nr);
    }
}

export default new Dpdf();
