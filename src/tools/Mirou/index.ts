import { Shape } from "@mirohq/websdk-types";
import { ConditionFn, Coords, Props, Style } from "../../types";

class Mirou {
    filterItem(items: Shape[], props: Props, condition: ConditionFn) {
        const myItems = items as unknown as Props[];

        return myItems
            .filter((item) =>
                Object.keys(props).every((key) => item[key] === props[key])
            )
            .filter(condition) as unknown as Shape[];
    }

    async modifyStyle(items: Shape[], style: Style) {
        for (const item of items) {
            item.style = { ...item.style, ...style };
            await item.sync();
        }
    }
    async modifyStyleOfSelection(style: Style) {
        const selections = (await miro.board.getSelection()) as Shape[];

        return this.modifyStyle(selections, style);
    }

    async modifyStyleWithFilter(
        filter: Props,
        style: Style,
        condition: ConditionFn = () => true
    ) {
        const allItems = (await miro.board.get({
            type: (filter.type as string) || "shape",
        })) as Shape[];

        const items = this.filterItem(allItems, filter, condition);
        return this.modifyStyle(items, style);
    }

    getGlobalCoordinates(frame: Shape, coord: Coords) {
        return {
            x: frame.x - frame.width / 2 + coord.x,
            y: frame.y - frame.height / 2 + coord.y,
        };
    }

    async getShapes() {
        const items = (await miro.board.get()) as Shape[];
        const shapes = new Set(items.map((item) => item.shape));
        return shapes;
    }

    async getTypes() {
        const items = await miro.board.get();
        const types = new Set(items.map((item) => item.type));
        return types;
    }

    async getItems(props: Props, condition: ConditionFn = () => true) {
        const items = (await miro.board.get({
            type: (props.type as string) || "shape",
        })) as Shape[];

        return await this.filterItem(items, props, condition);
    }

    async removeItems(props: Props, condition = () => true) {
        const allItems = (await miro.board.get({
            type: (props.type as string) || "shape",
        })) as Shape[];

        const items = this.filterItem(allItems, props, condition);

        if (items.length > 100 || items.length === 0) {
            throw new Error(
                `Not more than 100 items or no items found (${items.length}).`
            );
        }

        return await Promise.all(items.map((item) => miro.board.remove(item)));
    }

    async modifyItems(
        searchProps: Props,
        modifyProps: Props,
        condition: ConditionFn = () => true
    ) {
        const allItems = (await miro.board.get({
            type: (searchProps.type as string) || "shape",
        })) as Shape[];

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

                    (item as unknown as Props)[key] = modifyProps[key];
                }
                return item.sync();
            })
        );
    }

    async zoomToId(id: string) {
        const item = (await miro.board.get({ id }))[0] as Shape;
        await miro.board.viewport.zoomTo(item);
    }
}

export default Mirou;
