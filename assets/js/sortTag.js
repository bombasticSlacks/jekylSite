const yBlockMap = new Map();
const gBlockMap = new Map();
const bBlockMap = new Map();
const pBlockMap = new Map();
const rBlockMap = new Map();
const allMaps = [
  { value: ".label-yellow", map: yBlockMap },
  { value: ".label-green", map: gBlockMap },
  { value: ".label-blue", map: bBlockMap },
  { value: ".label-purple", map: pBlockMap },
  { value: ".label-red", map: rBlockMap },
];
// all blocks unsorted
const allBlocksMap = new Map();

const blue = "#0060df";

// create storage for constraints by type
const constraints = new Map();
constraints.set(".label-yellow", new Set());
constraints.set(".label-green", new Set());
constraints.set(".label-blue", new Set());
constraints.set(".label-purple", new Set());
constraints.set(".label-red", new Set());

const allBlocks = [];

const showLoop = (block) => {
  let show = true;
  // get each overall constraint category
  for (const constraintSet of constraints) {
    // go through each constraint
    let found = false;
    for (const constraint of constraintSet) {
      if (allBlocksMap.get(constraint).has(block)) {
        found = true;
      }
    }
    if(!found) {
      show = false
      break;
    }
  }
  if (show) {
    block.style.display = "block";
  }
};

const addConstraint = (label, constraint) => {
  constraints.get(label).add(constraint);
};

const deleteConstraint = (label, constraint) => {
  constraints.get(label).delete(constraint);
};

const constraintsEmpty = () => {
  for (set of constraints) {
    if (set.size > 0) return false;
  }

  return true;
};

document.addEventListener("DOMContentLoaded", () => {
  // process any parameters
  const queryString = document.location.search;
  const searchParams = new URLSearchParams(queryString);

  const filterNode = document.querySelector(".filter");
  if (filterNode !== null) {
    // on page load index each block with its traits and store them all
    for (const child of document.querySelectorAll("main > .block")) {
      allBlocks.push(child);
      // go through all blocks and store them in sorting
      for (const map of allMaps) {
        const blockMap = map.map;
        // get the corresponding labels but only first layer
        for (const label of child.querySelectorAll(
          "main > .block > " + map.value
        )) {
          const value = label.firstChild.textContent;
          // check if we have a map entry for value
          if (!blockMap.has(value)) {
            // if not make one
            blockMap.set(value, new Set());
            allBlocksMap.set(value, new Set());
          }
          // add the child to the map
          blockMap.get(value).add(child);
          allBlocksMap.get(value).add(child);
        }
      }
    }

    // need to replace sort placeholder with the available options
    for (const map of allMaps) {
      const blockMap = map.map;
      if (blockMap.size === 0) {
        continue;
      }

      // Put all entries related to a map inside a div
      const div = document.createElement("div");

      for (const key of blockMap) {
        // need a checkbox and label
        //const nameString = key[0] + " (" + key[1].size + ")";
        const nameString = key[0];
        const checkBox = document.createElement("input");
        checkBox.type = "checkbox";
        checkBox.name = nameString;
        checkBox.checked = searchParams.has(nameString);
        checkBox.style.display = "none";

        // if already checked add constraint
        if (searchParams.has(nameString)) {
          addConstraint(map.value, key[0]);
        }

        const name = document.createElement("label");
        name.textContent = nameString;

        // div for them to sit in
        const storage = document.createElement("div");

        storage.className = "filterEntry";
        if (searchParams.has(nameString)) {
          storage.style.background = blue;
        } else {
          storage.style.background = "none";
        }

        storage.onclick = () => {
          var cb = storage.querySelector("input");

          // flip the color
          cb.checked = !cb.checked;

          const checked = cb.checked;

          // set the background
          if (checked) {
            storage.style.background = blue;
          } else {
            storage.style.background = "none";
          }

          // if checked enable all the entries
          if (checked) {
            addConstraint(map.value, key[0]);
          } else {
            deleteConstraint(map.value, key[0]);
          }

          // if we have constraints update whats showing
          if (!constraintsEmpty()) {
            // Clear Entries Briefly
            for (const block of allBlocks) {
              block.style.display = "none";
            }

            // Only Enable Entries That Pass All Constraints
            if (checked) {
              // if checked we can just iterate over the current list
              for (const block of blockMap.get(key[0])) {
                showLoop(block);
              }
            } else {
              // otherwise we need to iterate over everything
              for (const block of allBlocks) {
                showLoop(block);
              }
            }
          } else {
            // if we don't have constraints, show everything
            for (const block of allBlocks) {
              block.style.display = "block";
            }
          }
        };

        storage.appendChild(checkBox);
        storage.appendChild(name);
        div.appendChild(storage);
      }

      filterNode.appendChild(div);
    }

    // after all if we have constraints update shown blocks
    if (!constraintsEmpty()) {
      // Clear Entries Briefly
      for (const block of allBlocks) {
        block.style.display = "none";
      }

      for (const block of allBlocks) {
        showLoop(block);
      }
    }
  }
});
