const blockMap = new Map();

document.addEventListener('DOMContentLoaded', () => {
    blockMap.set("all", []);
    // on page load index each block with its traits and store them all
    for (const child of document.querySelectorAll(".block")) {
        blockMap.get("all").push(child)
        console.log(child)
        // go through all blocks and store them in sorting
        for(const label of child.querySelectorAll(".label")) {
            const value = label.firstChild.textContent
            console.log(value)
            // check if we have a map entry for value
            if(!blockMap.has(value)) {
                // if not make one
                blockMap.set(value, [])
            }
            // add the child to the map
            blockMap.get(value).push(child)
        }
    }
    console.log(blockMap)
})
