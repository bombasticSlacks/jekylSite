const blockMap = new Map();

document.addEventListener("DOMContentLoaded", () => {
  const filterNode = document.querySelector(".filter");
  if (filterNode !== null) {
    blockMap.set("all", []);
    // on page load index each block with its traits and store them all
    for (const child of document.querySelectorAll(".block")) {
      blockMap.get("all").push(child);
      // go through all blocks and store them in sorting
      for (const label of child.querySelectorAll(".label")) {
        const value = label.firstChild.textContent;
        // check if we have a map entry for value
        if (!blockMap.has(value)) {
          // if not make one
          blockMap.set(value, []);
        }
        // add the child to the map
        blockMap.get(value).push(child);
      }
    }

    // need to replace sort placeholder with the available options
    for (const key of blockMap) {
        const nameString = key[0] + " (" + key.length + ")"
        const checkBox = document.createElement("input")
        checkBox.type = "checkbox"
        checkBox.name = nameString
        checkBox.onchange = ((event) => {
            // if checked enable all the entries
            if(event.currentTarget.checked) {
                for(block of blockMap.get(key[0])) {
                    block.style.display="block"
                }
            } else {
                for(block of blockMap.get(key[0])) {
                    block.style.display="none"
                }
            }
        })
        const name = document.createElement("label")
        name.textContent(nameString)
        filterNode.appendChild(checkBox)
        filterNode.appendChild(name)
    }
  }
});
