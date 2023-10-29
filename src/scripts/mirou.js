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

    async modifyItems(searchProps, modifyProps, condition = (item) => true) {
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

export default new Mirou();
