const Toolbar = (() => {
  let currentCell = null;

  // Track the currently focused editable cell
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    if (target && target.tagName === 'TD' && target.isContentEditable) {
      currentCell = target;
    }
  });

  function createToolbar(toolbarConfig) {
    const toolbar = document.getElementById("toolbar");
    toolbar.innerHTML = ""; // Clear existing buttons

    for (const [groupName, buttons] of Object.entries(toolbarConfig)) {
      // Create a group container
      const groupDiv = document.createElement("div");
      groupDiv.classList.add("toolbar-group");

      // Add a label for the group
      const label = document.createElement("span");
      label.classList.add("group-label");
      label.textContent = groupName;
      groupDiv.appendChild(label);

      // Create the group action container
      const actionGroupDiv = document.createElement("div");
      actionGroupDiv.classList.add("toolbar-action-group");

      // Add all buttons in that group
      buttons.forEach(btn => {


        if (btn.type && btn.type == "input:number") {
          const numberInputDiv = document.createElement('div');
          numberInputDiv.classList.add('number-input-container');

          const numberInput = document.createElement("input");
          numberInput.placeholder = btn.label;
          if (btn.value) numberInput.value = `${btn.prefix ? btn.prefix + " " : ""}${btn.value}${btn.suffix ? " " + btn.suffix : ""}`;
          numberInput.addEventListener('change', (e) => {
            const raw = (e.target.value || '').toString();
            const numeric = parseInt(raw.replace(/[^\d-]/g, ''), 10);
            if (isNaN(numeric)) return;
            if (typeof btn.action === 'function') {
              btn.action(numeric, currentCell);
            } else if (currentCell) {
              currentCell.style.fontSize = `${numeric}px`;
            }
            // normalize display value with prefix/suffix if any
            e.target.value = `${btn.prefix ? btn.prefix + " " : ""}${numeric}${btn.suffix ? " " + btn.suffix : ""}`;
          })

          const numberInputControlsDiv = document.createElement('div');
          numberInputControlsDiv.classList.add('number-input-controls-container');

          const upArrowImg = document.createElement('div');
          upArrowImg.classList.add('arrow-btn-div');
          fetch('./assets/up.svg')
            .then(res => res.text())
            .then(svgText => {
              upArrowImg.innerHTML = svgText;
            });
          upArrowImg.addEventListener('click', () => {
            const raw = (numberInput.value || '').toString();
            const numeric = parseInt(raw.replace(/[^\d-]/g, ''), 10) || 0;
            const next = numeric + 1;
            numberInput.value = `${btn.prefix ? btn.prefix + " " : ""}${next}${btn.suffix ? " " + btn.suffix : ""}`;
            numberInput.dispatchEvent(new Event('change'));
          });

          const downArrowImg = document.createElement('div');
          downArrowImg.classList.add('arrow-btn-div');
          fetch('./assets/down.svg')
            .then(res => res.text())
            .then(svgText => {
              downArrowImg.innerHTML = svgText;
            });
          downArrowImg.addEventListener('click', () => {
            const raw = (numberInput.value || '').toString();
            const numeric = parseInt(raw.replace(/[^\d-]/g, ''), 10) || 0;
            const next = numeric - 1;
            numberInput.value = `${btn.prefix ? btn.prefix + " " : ""}${next}${btn.suffix ? " " + btn.suffix : ""}`;
            numberInput.dispatchEvent(new Event('change'));
          });

          numberInputControlsDiv.appendChild(upArrowImg);
          numberInputControlsDiv.appendChild(downArrowImg);

          numberInputDiv.append(numberInput);
          numberInputDiv.append(numberInputControlsDiv);
          actionGroupDiv.append(numberInputDiv);
          return;
        }

        if (btn.type && btn.type == "dropdown") {
          const select = document.createElement("select");
          const label = document.createElement('option');
          label.innerText = btn.label;
          label.disabled = true;
          label.selected = true;
          select.appendChild(label);

          btn.values?.forEach(value => {
            const option = document.createElement('option');
            option.innerHTML = value;
            option.value = value;
            if (!btn.action) option.disabled = true;

            select.appendChild(option);
          });

          select.addEventListener('change', (e) => {
            const val = e.target.value;
            if (typeof btn.action === 'function') {
              btn.action(val, currentCell);
            } else if (currentCell) {
              // default behavior for a font-weight dropdown
              currentCell.style.fontWeight = val;
            }
          });

          actionGroupDiv.append(select);
          return;
        }

        const button = document.createElement("button");
        button.textContent = btn.label;
        button.addEventListener("click", () => {
          if (typeof btn.action === 'function') {
            btn.action(currentCell);
          }
        });
        if (!btn.action) button.disabled = true;
        actionGroupDiv.appendChild(button);
      });

      groupDiv.appendChild(actionGroupDiv);
      toolbar.appendChild(groupDiv);
    }
  }

  return { createToolbar };
})();
