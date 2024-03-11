const blockMap = new Map();
const constraints = new Set();
const allBlocks = [];

document.addEventListener("DOMContentLoaded", () => {
  const filterNode = document.querySelector(".filter");
  if (filterNode !== null) {
    // on page load index each block with its traits and store them all
    for (const child of document.querySelectorAll(".block")) {
      allBlocks.push(child);
      // go through all blocks and store them in sorting
      for (const label of child.querySelectorAll(".label")) {
        const value = label.firstChild.textContent;
        // check if we have a map entry for value
        if (!blockMap.has(value)) {
          // if not make one
          blockMap.set(value, new Set());
        }
        // add the child to the map
        blockMap.get(value).add(child);
      }
    }

    // need to replace sort placeholder with the available options
    for (const key of blockMap) {
      // need a checkbox and label
      const nameString = key[0] + " (" + key[1].size + ")";
      const checkBox = document.createElement("input");
      checkBox.type = "checkbox";
      checkBox.name = nameString;
      checkBox.onchange = (event) => {
        // if checked enable all the entries
        if (event.currentTarget.checked) {
          constraints.add(key[0]);
        } else {
          constraints.delete(key[0]);
        }

        console.log(constraints)

        // if we have constraints update whats showing
        if (constraints.size !== 0) {
          // Clear Entries Briefly
          for (block of allBlocks) {
            block.style.display = "none";
          }

          // Only Enable Entries That Pass All Constraints
          if (event.currentTarget.checked) {
            // if checked we can just iterate over the current list
            for (block of blockMap.get(key[0])) {
              let show = true;
              for (constraint of constraints) {
                if (!blockMap.get(constraint).has(block)) {
                  show = false;
                  return;
                }
              }
              if (show) {
                block.style.display = "block";
              }
            }
          } else {
            // otherwise we need to iterate over everything
            for (block of allBlocks) {
              let show = true;
              for (constraint of constraints) {
                if (!blockMap.get(constraint).has(block)) {
                  show = false;
                  return;
                }
              }
              if (show) {
                block.style.display = "block";
              }
            }
          }
        } else {
          // if we don't have constraints, show everything
          for (block of allBlocks) {
            block.style.display = "block";
          }
        }
      };
      const name = document.createElement("label");
      name.textContent = nameString;
      filterNode.appendChild(checkBox);
      filterNode.appendChild(name);
    }
  }
});
