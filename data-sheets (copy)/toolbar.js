const Toolbar = (() => {
  let currentCell = null;

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

          const downArrowImg = document.createElement('div');
          downArrowImg.classList.add('arrow-btn-div');
          fetch('./assets/down.svg')
            .then(res => res.text())
            .then(svgText => {
              downArrowImg.innerHTML = svgText;
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
          select.appendChild(label);

          btn.values?.forEach(value => {
            const option = document.createElement('option');
            option.innerHTML = value;
            option.value = value;
            if (!btn.action) option.disabled = true;

            select.appendChild(option);
          });

          actionGroupDiv.append(select);
          return;
        }

        const button = document.createElement("button");
        button.textContent = btn.label;
        button.addEventListener("click", btn.action);
        if (!btn.action) button.disabled = true;
        actionGroupDiv.appendChild(button);
      });

      groupDiv.appendChild(actionGroupDiv);
      toolbar.appendChild(groupDiv);
    }
  }

  return { createToolbar };
})();
