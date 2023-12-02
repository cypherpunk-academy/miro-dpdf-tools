import { ItemType, Shape, StickyNote } from "@mirohq/websdk-types";

export type HookMutationResult<
    Invoke extends (...args: any[]) => any,
    Return,
    Info
> = [Invoke: Invoke, Return: Return, Info: Info];

export type HookQueryResult<Return, Info> = [Return: Return, Info: Info];

export interface Coords {
    x: number;
    y: number;
}

export interface Style {
    [key: string]: string;
}

export interface Props {
    style?: Style;
    [key: string]: string | string[] | Style | undefined;
}

export type ConditionFn = (item: Props) => boolean;

export interface PartialWidgetMixin {
    type: ItemType;
    shape: string;
    style: Shape["style"];
    width: number;
    height: number;
    content?: string;
    x?: number;
    y?: number;
}

export type Paragraph = {
    sentences: (Shape | StickyNote)[];
    nr: number;
};

export type Chapter = {
    nr: number;
    title?: string;
    paragraphs?: Paragraph[];
    id?: string;
};
